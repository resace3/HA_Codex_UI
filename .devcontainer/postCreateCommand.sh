#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
node --version
npm --version
python3 --version
echo "HA_Codex_UI devcontainer post-create checks completed in GitHub Actions."
