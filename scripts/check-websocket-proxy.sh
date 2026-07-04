#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

grep -R "/api/terminals/:id/ws" config_pilot/backend/src/server/routes >/dev/null
grep -R "WebSocketServer" config_pilot/backend/src/server/websocket.ts >/dev/null
grep -R '"ping"' config_pilot/backend/src >/dev/null
grep -R '"pong"' config_pilot/backend/src >/dev/null
grep -R "stripIngressPrefix" config_pilot/backend/src/server/websocket.ts >/dev/null
echo "WebSocket proxy checks passed."
