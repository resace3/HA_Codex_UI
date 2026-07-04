#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

forbidden=(
  "Config Pilot"
  "config_pilot"
  "config-pilot"
  "ha-config-pilot"
  "ghcr.io/resace3/ha-config-pilot"
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
  -path ./ha_codex_ui/backend/node_modules -prune -o \
  -path ./ha_codex_ui/frontend/node_modules -prune -o \
  -type f -print > "${tmp}"

failures=0
while IFS= read -r file; do
  case "${file}" in
    ./scripts/check-name-collisions.sh)
      continue
      ;;
  esac
  for name in "${forbidden[@]}"; do
    if [[ "${file}" == *"${name}"* ]]; then
      echo "Forbidden old project name found in path ${file}: ${name}"
      failures=1
    fi
    if grep -FIn -- "${name}" "${file}" >/tmp/ha-codex-ui-name-hit 2>/dev/null; then
      echo "Forbidden old project name found in ${file}: ${name}"
      cat /tmp/ha-codex-ui-name-hit
      failures=1
    fi
  done
done < "${tmp}"

rm -f "${tmp}" /tmp/ha-codex-ui-name-hit
exit "${failures}"
