#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/config_pilot/backend"

npm install --package-lock-only
npm ci
npm run build

tmp="$(mktemp -d)"
trap 'kill "${server_pid:-0}" 2>/dev/null || true; rm -rf "${tmp}"' EXIT
mkdir -p "${tmp}/data" "${tmp}/share/config_pilot_workspace" "${tmp}/share/config_pilot_uploads"
cat > "${tmp}/options.json" <<JSON
{
  "default_workspace": "${tmp}/share/config_pilot_workspace",
  "upload_workspace": "${tmp}/share/config_pilot_uploads",
  "allowed_workspaces": ["${tmp}/share/config_pilot_workspace", "${tmp}/share/config_pilot_uploads"],
  "app_data_dir": "${tmp}/data/config_pilot",
  "codex_home": "${tmp}/data/config_pilot/.codex"
}
JSON
CONFIG_PILOT_OPTIONS="${tmp}/options.json" CONFIG_PILOT_DIRECT_ACCESS=1 PORT=8107 node dist/index.js > "${tmp}/backend.log" 2>&1 &
server_pid="$!"
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8107/api/health >/dev/null; then
    break
  fi
  sleep 1
done
curl -fsS http://127.0.0.1:8107/api/health
curl -fsS http://127.0.0.1:8107/api/diagnostics
printf 'upload smoke\n' > "${tmp}/upload.txt"
curl -fsS -F "file=@${tmp}/upload.txt" "http://127.0.0.1:8107/api/files/upload?workspaceId=uploads&path=.&overwrite=true&confirmed=true"
curl -fsS "http://127.0.0.1:8107/api/files/download?workspaceId=uploads&path=upload.txt" | grep -F "upload smoke"
terminal_id="$(curl -fsS -H 'Content-Type: application/json' -d '{"type":"shell","workspaceId":"share-workspace","name":"Smoke","command":"sleep 5","confirmed":true}' http://127.0.0.1:8107/api/terminals | jq -r '.data.id')"
TERMINAL_ID="${terminal_id}" node - <<'NODE'
const id = process.env.TERMINAL_ID;
const socket = new WebSocket(`ws://127.0.0.1:8107/api/terminals/${id}/ws`);
const timer = setTimeout(() => {
  console.error("WebSocket smoke timed out");
  process.exit(1);
}, 5000);
socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "ping" })));
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "pong") {
    clearTimeout(timer);
    socket.close();
    process.exit(0);
  }
});
NODE
curl -fsS -X POST "http://127.0.0.1:8107/api/terminals/${terminal_id}/stop"
echo "Backend smoke completed."
