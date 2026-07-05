#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

python3 scripts/validate-addon-metadata.py
docker build --build-arg CODEX_STUB=1 -t ghcr.io/resace3/ha-codex-ui:ha-smoke -f ha_codex_ui/Dockerfile ha_codex_ui
echo "Basic local add-on image build completed."

HA_ENDPOINT="${HA_INSTANCE_URL:-${HA_ENDPOINT:-${HA_SUPERVISOR_URL:-}}}"
HA_TOKEN="${HA_TOKEN:-${HA_LONG_LIVED_TOKEN:-${SUPERVISOR_TOKEN:-${HASSIO_TOKEN:-}}}}"
REPO_URL="${HA_REPO_URL:-https://github.com/resace3/HA_Codex_UI}"
ADDON_SLUG="${HA_ADDON_SLUG:-ha_codex_ui}"
HA_CLI_BIN="${HA_CLI_BIN:-ha}"

if [ -z "${HA_ENDPOINT:-}" ] || [ -z "${HA_TOKEN:-}" ]; then
  echo "HA instance endpoint and/or token not provided. Skipping direct Supervisor install."
  echo "Set HA_INSTANCE_URL and HA_TOKEN to attempt real add-on install in this smoke job."
  exit 0
fi

if ! command -v "${HA_CLI_BIN}" >/dev/null 2>&1; then
  echo "Home Assistant CLI is not available in this CI environment."
  exit 0
fi

HA_API_URL="${HA_ENDPOINT%/}/api/hassio"
echo "Attempting Supervisor install flow against ${HA_ENDPOINT} for slug ${ADDON_SLUG}."

if ! "${HA_CLI_BIN}" --endpoint "${HA_API_URL}" --api-token "${HA_TOKEN}" store add "${REPO_URL}"; then
  echo "Failed to add repository: ${REPO_URL}"
  echo "This usually means the endpoint, permissions, or token is invalid."
  exit 1
fi

if ! "${HA_CLI_BIN}" --endpoint "${HA_API_URL}" --api-token "${HA_TOKEN}" store apps install "${ADDON_SLUG}"; then
  if "${HA_CLI_BIN}" --endpoint "${HA_API_URL}" --api-token "${HA_TOKEN}" apps info "${ADDON_SLUG}" >/dev/null 2>&1; then
    echo "Add-on is already installed; continuing."
  else
    echo "Failed to install add-on ${ADDON_SLUG}."
    exit 1
  fi
fi

if "${HA_CLI_BIN}" --endpoint "${HA_API_URL}" --api-token "${HA_TOKEN}" apps info "${ADDON_SLUG}" >/dev/null 2>&1; then
  echo "Home Assistant add-on ${ADDON_SLUG} installation completed or already active."
else
  echo "Supervisor install actions completed, but add-on info could not be read."
fi

echo "HA_Codex_UI local add-on install smoke attempt completed."
