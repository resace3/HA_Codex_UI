#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

mkdir -p artifacts
tar --exclude='.git' --exclude='node_modules' --exclude='dist' -czf artifacts/config-pilot-addon.tar.gz repository.yaml config_pilot
echo "Packaged artifacts/config-pilot-addon.tar.gz"
