#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
cd /workspaces/HA_Codex_UI
python3 scripts/validate-addon-metadata.py
test -f repository.yaml
test -f ha_codex_ui/config.yaml
grep -F "slug: ha_codex_ui" ha_codex_ui/config.yaml
grep -F "ingress_port: 8107" ha_codex_ui/config.yaml
echo "HA_Codex_UI local add-on structure detected."

HA_ENDPOINT="${HA_INSTANCE_URL:-${HA_ENDPOINT:-${HA_SUPERVISOR_URL:-}}}"
HA_TOKEN="${HA_TOKEN:-${HA_LONG_LIVED_TOKEN:-${SUPERVISOR_TOKEN:-${HASSIO_TOKEN:-}}}}"
REPO_URL="${HA_REPO_URL:-https://github.com/resace3/HA_Codex_UI}"
ADDON_SLUG="${HA_ADDON_SLUG:-ha_codex_ui}"
HA_CLI_BIN="${HA_CLI_BIN:-ha}"

if [ -z "${HA_ENDPOINT:-}" ] || [ -z "${HA_TOKEN:-}" ]; then
  echo "HA instance endpoint/token unavailable; skipping live install attempt."
  echo "Set HA_INSTANCE_URL and HA_TOKEN to run real Supervisor install in CI."
  exit 0
fi

if ! command -v "${HA_CLI_BIN}" >/dev/null 2>&1; then
  echo "Home Assistant CLI is not available in devcontainer; skipping live Supervisor attempt."
  exit 0
fi

HA_API_URL="${HA_ENDPOINT%/}/api/hassio"
echo "Attempting Supervisor install flow against ${HA_ENDPOINT} for ${ADDON_SLUG}."
if ! "${HA_CLI_BIN}" --endpoint "${HA_API_URL}" --api-token "${HA_TOKEN}" store add "${REPO_URL}"; then
  echo "Failed to add repository ${REPO_URL}."
  exit 1
fi

if ! "${HA_CLI_BIN}" --endpoint "${HA_API_URL}" --api-token "${HA_TOKEN}" store apps install "${ADDON_SLUG}"; then
  if "${HA_CLI_BIN}" --endpoint "${HA_API_URL}" --api-token "${HA_TOKEN}" apps info "${ADDON_SLUG}" >/dev/null 2>&1; then
    echo "Add-on already exists; continuing."
  else
    echo "Failed to install ${ADDON_SLUG}."
    exit 1
  fi
fi

if "${HA_CLI_BIN}" --endpoint "${HA_API_URL}" --api-token "${HA_TOKEN}" apps info "${ADDON_SLUG}" >/dev/null 2>&1; then
  echo "HA_Codex_UI detected in Home Assistant."
else
  echo "Unable to verify add-on state after install attempt."
fi
