#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

if ! command -v devcontainer >/dev/null 2>&1; then
  echo "devcontainer CLI is not available."
  exit 0
fi

devcontainer up --workspace-folder "${ROOT}"
devcontainer exec --workspace-folder "${ROOT}" bash scripts/ci-all.sh
echo "Devcontainer smoke completed."
