#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

forbidden=(
  "Codex Studio"
  "ha-codex-studio"
  "codex_studio"
  "codex-studio"
  "Codex Studio Home Assistant Add-ons"
  "ghcr.io/resace3/ha-codex-studio"
)

tmp="$(mktemp)"
find . \
  -path ./.git -prune -o \
  -path ./node_modules -prune -o \
  -path ./config_pilot/backend/node_modules -prune -o \
  -path ./config_pilot/frontend/node_modules -prune -o \
  -type f -print > "${tmp}"

failures=0
while IFS= read -r file; do
  case "${file}" in
    ./scripts/check-name-collisions.sh)
      continue
      ;;
  esac
  for name in "${forbidden[@]}"; do
    if grep -FIn -- "${name}" "${file}" >/tmp/config-pilot-name-hit 2>/dev/null; then
      echo "Forbidden old project name found in ${file}: ${name}"
      cat /tmp/config-pilot-name-hit
      failures=1
    fi
  done
done < "${tmp}"

rm -f "${tmp}" /tmp/config-pilot-name-hit
exit "${failures}"
