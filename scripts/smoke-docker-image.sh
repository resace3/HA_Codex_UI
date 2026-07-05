#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

image="${SMOKE_IMAGE_TAG:-ghcr.io/resace3/ha-codex-ui:ci-smoke}"
skip_build="${SMOKE_SKIP_BUILD:-0}"
tmp="$(mktemp -d)"
container="ha-codex-ui-smoke-${GITHUB_RUN_ID:-manual}"
smoke_logs="/tmp/ha-codex-ui-smoke-${GITHUB_RUN_ID:-manual}.log"

cleanup() {
  status=$?
  if [ "${status}" -ne 0 ]; then
    echo "Container logs from failed smoke run:"
    docker logs "${container}" >"${smoke_logs}" 2>&1 || true
    cat "${smoke_logs}" || true
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

if [ "${skip_build}" = "1" ]; then
  if ! docker image inspect "${image}" >/dev/null 2>&1; then
    echo "Requested to skip image build, but image ${image} was not found."
    skip_build="0"
  fi
fi

if [ "${skip_build}" != "1" ]; then
  docker build --build-arg CODEX_STUB=1 -t "${image}" -f ha_codex_ui/Dockerfile ha_codex_ui
fi

docker run -d --name "${container}" -p 8107:8107 -v "${tmp}/data:/data" -v "${tmp}/share:/share" -v "${tmp}/config:/config:ro" "${image}"

for _ in $(seq 1 120); do
  if ! docker ps --format '{{.Names}}' | grep -Fx "${container}" >/dev/null; then
    echo "Container exited before health check passed."
    exit 1
  fi
  if curl -fsS http://127.0.0.1:8107/api/health >/dev/null; then
    break
  fi
  sleep 1
done
if ! curl -fsS http://127.0.0.1:8107/api/health >/dev/null; then
  echo "Health endpoint did not become available during smoke startup."
  exit 1
fi
curl -fsS http://127.0.0.1:8107/api/health
curl -fsS http://127.0.0.1:8107/api/diagnostics
workspaces_json="$(curl -fsS http://127.0.0.1:8107/api/workspaces)"
upload_workspace_id="$(printf '%s' "${workspaces_json}" | jq -r '.data[] | select(.root == "/share/ha_codex_ui_uploads") | .id')"
default_workspace_id="$(printf '%s' "${workspaces_json}" | jq -r '.data[] | select(.root == "/share/ha_codex_ui_workspace") | .id')"
if [ -z "${upload_workspace_id}" ] || [ "${upload_workspace_id}" = "null" ] || [ -z "${default_workspace_id}" ] || [ "${default_workspace_id}" = "null" ]; then
  echo "Unable to resolve Docker smoke workspace ids from /api/workspaces."
  printf '%s\n' "${workspaces_json}"
  exit 1
fi
printf 'docker upload smoke\n' > "${tmp}/upload.txt"
curl -fsS -F "file=@${tmp}/upload.txt" "http://127.0.0.1:8107/api/files/upload?workspaceId=${upload_workspace_id}&path=.&overwrite=true&confirmed=true"
curl -fsS "http://127.0.0.1:8107/api/files/download?workspaceId=${upload_workspace_id}&path=upload.txt" | grep -F "docker upload smoke"
terminal_payload="$(jq -cn --arg workspaceId "${default_workspace_id}" '{type:"shell",workspaceId:$workspaceId,name:"Docker Smoke",confirmed:true}')"
terminal_id="$(curl -fsS -H 'Content-Type: application/json' -d "${terminal_payload}" http://127.0.0.1:8107/api/terminals | jq -r '.data.id')"
if [ -z "${terminal_id}" ] || [ "${terminal_id}" = "null" ]; then
  echo "Failed to create terminal session from Docker smoke request."
  exit 1
fi

for _ in $(seq 1 20); do
  terminal_status="$(curl -fsS http://127.0.0.1:8107/api/terminals/${terminal_id} | jq -r '.data.status')"
  if [ "${terminal_status}" = "running" ]; then
    break
  fi
  if [ "${terminal_status}" = "exited" ] || [ "${terminal_status}" = "stopped" ]; then
    echo "Terminal did not stay running for websocket smoke: ${terminal_status}"
    exit 1
  fi
  sleep 1
done

if [ "${terminal_status:-}" != "running" ]; then
  echo "Terminal session did not enter running state for websocket smoke. status=${terminal_status:-unknown}"
  exit 1
fi

TERMINAL_ID="${terminal_id}" node - <<'NODE'
const id = process.env.TERMINAL_ID;
const socket = new WebSocket(`ws://127.0.0.1:8107/api/terminals/${id}/ws`);
const timer = setTimeout(() => {
  console.error("Docker WebSocket smoke timed out");
  process.exit(1);
}, 15000);
socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ type: "ping" }));
});
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "pong") {
    console.log("Docker WebSocket pong received.");
    clearTimeout(timer);
    socket.close();
    process.exit(0);
  }
});
socket.addEventListener("error", (event) => {
  console.error("Docker WebSocket smoke error", event instanceof Error ? event.message : String(event));
  clearTimeout(timer);
  process.exit(1);
});
NODE

curl -fsS -X POST "http://127.0.0.1:8107/api/terminals/${terminal_id}/stop"
docker exec "${container}" test -x /opt/ha-codex-ui/run.sh
docker exec "${container}" stat -c '%a' /data/ha_codex_ui/.codex | grep -E '^700$'
echo "Docker image smoke completed."
