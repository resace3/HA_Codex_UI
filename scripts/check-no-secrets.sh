#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

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
    ./scripts/check-no-secrets.sh|./test-fixtures/workspaces/sample-ha-config/secrets.yaml.example)
      continue
      ;;
  esac
  if grep -En 'sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|"refresh_token"[[:space:]]*:|"access_token"[[:space:]]*:|SUPERVISOR_TOKEN=.+' "${file}" >/tmp/config-pilot-secret-hit 2>/dev/null; then
    echo "Potential secret in ${file}"
    cat /tmp/config-pilot-secret-hit
    failures=1
  fi
  if [[ "${file}" == *"/secrets.yaml" ]]; then
    echo "Real secrets.yaml file must not be committed: ${file}"
    failures=1
  fi
done < "${tmp}"
rm -f "${tmp}" /tmp/config-pilot-secret-hit
exit "${failures}"
