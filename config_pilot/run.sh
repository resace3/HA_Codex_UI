#!/usr/bin/env bash
set -euo pipefail

OPTIONS_FILE="/data/options.json"
APP_DATA_DIR="$(jq -r '.app_data_dir // "/data/config_pilot"' "${OPTIONS_FILE}" 2>/dev/null || echo "/data/config_pilot")"
CODEX_HOME_DIR="$(jq -r '.codex_home // "/data/config_pilot/.codex"' "${OPTIONS_FILE}" 2>/dev/null || echo "/data/config_pilot/.codex")"
DEFAULT_WORKSPACE="$(jq -r '.default_workspace // "/share/config_pilot_workspace"' "${OPTIONS_FILE}" 2>/dev/null || echo "/share/config_pilot_workspace")"
UPLOAD_WORKSPACE="$(jq -r '.upload_workspace // "/share/config_pilot_uploads"' "${OPTIONS_FILE}" 2>/dev/null || echo "/share/config_pilot_uploads")"
LOG_LEVEL="$(jq -r '.log_level // "info"' "${OPTIONS_FILE}" 2>/dev/null || echo "info")"

mkdir -p "${APP_DATA_DIR}" "${CODEX_HOME_DIR}" "${APP_DATA_DIR}/sessions" "${APP_DATA_DIR}/snapshots"
mkdir -p "${DEFAULT_WORKSPACE}" "${UPLOAD_WORKSPACE}"
chmod 0700 "${CODEX_HOME_DIR}"

export CODEX_HOME="${CODEX_HOME_DIR}"
export HOME="${APP_DATA_DIR}"
export CONFIG_PILOT_DATA="${APP_DATA_DIR}"
export NODE_ENV=production
export PORT=8107
export CONFIG_PILOT_OPTIONS="${OPTIONS_FILE}"

echo "Config Pilot starting."
echo "Service: config-pilot"
echo "Port: ${PORT}"
echo "Data directory: ${APP_DATA_DIR}"
echo "Default workspace: ${DEFAULT_WORKSPACE}"
echo "Upload workspace: ${UPLOAD_WORKSPACE}"
echo "Codex home: ${CODEX_HOME_DIR}"
echo "Log level: ${LOG_LEVEL}"
echo "Secrets and auth file contents are not printed."

exec node /opt/config-pilot/backend/dist/index.js
