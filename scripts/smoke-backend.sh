#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/ha_codex_ui/backend"

npm install --package-lock-only
npm ci
npm run build

tmp="$(mktemp -d)"
trap 'kill "${server_pid:-0}" 2>/dev/null || true; rm -rf "${tmp}"' EXIT
mkdir -p "${tmp}/data" "${tmp}/share/ha_codex_ui_workspace" "${tmp}/share/ha_codex_ui_uploads"
default_workspace="${tmp}/share/ha_codex_ui_workspace"
upload_workspace="${tmp}/share/ha_codex_ui_uploads"
cat > "${tmp}/options.json" <<JSON
{
  "default_workspace": "${default_workspace}",
  "upload_workspace": "${upload_workspace}",
  "allowed_workspaces": ["${default_workspace}", "${upload_workspace}"],
  "app_data_dir": "${tmp}/data/ha_codex_ui",
  "codex_home": "${tmp}/data/ha_codex_ui/.codex"
}
JSON
HA_CODEX_UI_OPTIONS="${tmp}/options.json" HA_CODEX_UI_DIRECT_ACCESS=1 PORT=8107 node dist/index.js > "${tmp}/backend.log" 2>&1 &
server_pid="$!"
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8107/api/health >/dev/null; then
    break
  fi
  sleep 1
done
curl -fsS http://127.0.0.1:8107/api/health
curl -fsS http://127.0.0.1:8107/api/diagnostics
workspaces_json="$(curl -fsS http://127.0.0.1:8107/api/workspaces)"
upload_workspace_id="$(printf '%s' "${workspaces_json}" | jq -r --arg root "${upload_workspace}" '.data[] | select(.root == $root) | .id')"
default_workspace_id="$(printf '%s' "${workspaces_json}" | jq -r --arg root "${default_workspace}" '.data[] | select(.root == $root) | .id')"
if [ -z "${upload_workspace_id}" ] || [ "${upload_workspace_id}" = "null" ] || [ -z "${default_workspace_id}" ] || [ "${default_workspace_id}" = "null" ]; then
  echo "Unable to resolve smoke workspace ids from /api/workspaces."
  printf '%s\n' "${workspaces_json}"
  exit 1
fi
printf 'upload smoke\n' > "${tmp}/upload.txt"
curl -fsS -F "file=@${tmp}/upload.txt" "http://127.0.0.1:8107/api/files/upload?workspaceId=${upload_workspace_id}&path=.&overwrite=true&confirmed=true"
curl -fsS "http://127.0.0.1:8107/api/files/download?workspaceId=${upload_workspace_id}&path=upload.txt" | grep -F "upload smoke"
terminal_payload="$(jq -cn --arg workspaceId "${default_workspace_id}" '{type:"shell",workspaceId:$workspaceId,name:"Smoke",command:"sleep 5",confirmed:true}')"
terminal_id="$(curl -fsS -H 'Content-Type: application/json' -d "${terminal_payload}" http://127.0.0.1:8107/api/terminals | jq -r '.data.id')"
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
