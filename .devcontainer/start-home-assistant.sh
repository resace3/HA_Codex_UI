#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
mkdir -p /tmp/ha-codex-ui-ha
echo "Attempting Home Assistant development startup only as a GitHub Actions diagnostic."
if command -v docker >/dev/null 2>&1; then
  docker version
  echo "Docker is available. A full Supervisor boot may still be unsupported in this runner."
else
  echo "Docker is unavailable; Home Assistant startup diagnostic is unsupported."
fi
