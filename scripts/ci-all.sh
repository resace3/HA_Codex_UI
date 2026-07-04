#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

python3 scripts/validate-addon-metadata.py
bash scripts/check-name-collisions.sh
bash scripts/check-no-secrets.sh
bash scripts/check-ingress-paths.sh
bash scripts/check-websocket-proxy.sh

(
  cd config_pilot/backend
  npm install --package-lock-only
  npm ci
  npm run lint
  npm run typecheck
  npm test
)

(
  cd config_pilot/frontend
  npm install --package-lock-only
  npm ci
  npm run lint
  npm run typecheck
  npm test
  npm run build
)

if command -v docker >/dev/null 2>&1; then
  bash scripts/smoke-docker-image.sh
else
  echo "Docker is unavailable in this GitHub Actions environment; Docker smoke is skipped by ci-all and covered by docker-build workflow."
fi

if command -v devcontainer >/dev/null 2>&1; then
  bash scripts/smoke-devcontainer.sh
else
  echo "Devcontainer CLI is unavailable in this GitHub Actions environment; devcontainer workflow covers it separately."
fi
