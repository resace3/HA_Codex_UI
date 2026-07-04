#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

grep -R "/api/terminals/:id/ws" ha_codex_ui/backend/src/server/routes >/dev/null
grep -R "WebSocketServer" ha_codex_ui/backend/src/server/websocket.ts >/dev/null
grep -R '"ping"' ha_codex_ui/backend/src >/dev/null
grep -R '"pong"' ha_codex_ui/backend/src >/dev/null
grep -R "stripIngressPrefix" ha_codex_ui/backend/src/server/websocket.ts >/dev/null
echo "WebSocket proxy checks passed."
