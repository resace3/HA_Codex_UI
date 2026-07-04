#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

image="ghcr.io/resace3/ha-codex-ui:ci-smoke"
tmp="$(mktemp -d)"
container="ha-codex-ui-smoke-${GITHUB_RUN_ID:-manual}"
cleanup() {
  status=$?
  if [ "${status}" -ne 0 ]; then
    echo "Container logs from failed smoke run:"
    docker logs "${container}" 2>&1 || true
  fi
  docker rm -f "${container}" >/dev/null 2>&1 || true
  if command -v sudo >/dev/null 2>&1; then
    sudo rm -rf "${tmp}" || true
  else
    rm -rf "${tmp}" || true
  fi
  exit "${status}"
}
trap cleanup EXIT
mkdir -p "${tmp}/data" "${tmp}/share" "${tmp}/config"
docker build --build-arg CODEX_STUB=1 -t "${image}" -f ha_codex_ui/Dockerfile ha_codex_ui
docker run -d --name "${container}" -p 8107:8107 -v "${tmp}/data:/data" -v "${tmp}/share:/share" -v "${tmp}/config:/config:ro" "${image}"
for _ in $(seq 1 90); do
  if ! docker ps --format '{{.Names}}' | grep -Fx "${container}" >/dev/null; then
    echo "Container exited before health check passed."
    exit 1
  fi
  if curl -fsS http://127.0.0.1:8107/api/health >/dev/null; then
    break
  fi
  sleep 1
done
curl -fsS http://127.0.0.1:8107/api/health
curl -fsS http://127.0.0.1:8107/api/diagnostics
printf 'docker upload smoke\n' > "${tmp}/upload.txt"
curl -fsS -F "file=@${tmp}/upload.txt" "http://127.0.0.1:8107/api/files/upload?workspaceId=uploads&path=.&overwrite=true&confirmed=true"
curl -fsS "http://127.0.0.1:8107/api/files/download?workspaceId=uploads&path=upload.txt" | grep -F "docker upload smoke"
terminal_id="$(curl -fsS -H 'Content-Type: application/json' -d '{"type":"shell","workspaceId":"share-workspace","name":"Docker Smoke","command":"sleep 5","confirmed":true}' http://127.0.0.1:8107/api/terminals | jq -r '.data.id')"
TERMINAL_ID="${terminal_id}" node - <<'NODE'
const id = process.env.TERMINAL_ID;
const socket = new WebSocket(`ws://127.0.0.1:8107/api/terminals/${id}/ws`);
const timer = setTimeout(() => {
  console.error("Docker WebSocket smoke timed out");
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
docker exec "${container}" test -x /run.sh
docker exec "${container}" stat -c '%a' /data/ha_codex_ui/.codex | grep -E '^700$'
echo "Docker image smoke completed."
