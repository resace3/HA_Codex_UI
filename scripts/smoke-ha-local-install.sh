#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

python3 scripts/validate-addon-metadata.py
docker build --build-arg CODEX_STUB=1 -t ghcr.io/resace3/ha-config-pilot:ha-smoke -f config_pilot/Dockerfile config_pilot
echo "Basic local add-on image build completed in GitHub Actions."
if command -v ha >/dev/null 2>&1; then
  echo "Home Assistant CLI detected; attempting read-only add-on listing."
  ha addons list || true
else
  echo "Home Assistant CLI is not available in this CI environment; full Supervisor install remains diagnostic."
fi
