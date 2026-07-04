#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

grep -R "detectIngressBase" ha_codex_ui/frontend/src >/dev/null
grep -R "websocketPath" ha_codex_ui/frontend/src >/dev/null
grep -R "ingressBasePath" ha_codex_ui/backend/src >/dev/null
grep -R "stripIngressPrefix" ha_codex_ui/backend/src >/dev/null
if grep -R "http://localhost" ha_codex_ui/frontend/src ha_codex_ui/backend/src >/dev/null; then
  echo "Hardcoded localhost URL found in application source."
  exit 1
fi
echo "Ingress path helpers are present."
