#!/usr/bin/env bash
set -euo pipefail

OPTIONS_FILE="/data/options.json"
APP_DATA_DIR="$(jq -r '.app_data_dir // "/data/ha_codex_ui"' "${OPTIONS_FILE}" 2>/dev/null || echo "/data/ha_codex_ui")"
CODEX_HOME_DIR="$(jq -r '.codex_home // "/data/ha_codex_ui/.codex"' "${OPTIONS_FILE}" 2>/dev/null || echo "/data/ha_codex_ui/.codex")"
DEFAULT_WORKSPACE="$(jq -r '.default_workspace // "/share/ha_codex_ui_workspace"' "${OPTIONS_FILE}" 2>/dev/null || echo "/share/ha_codex_ui_workspace")"
UPLOAD_WORKSPACE="$(jq -r '.upload_workspace // "/share/ha_codex_ui_uploads"' "${OPTIONS_FILE}" 2>/dev/null || echo "/share/ha_codex_ui_uploads")"
LOG_LEVEL="$(jq -r '.log_level // "info"' "${OPTIONS_FILE}" 2>/dev/null || echo "info")"

mkdir -p "${APP_DATA_DIR}" "${CODEX_HOME_DIR}" "${APP_DATA_DIR}/sessions" "${APP_DATA_DIR}/snapshots"
mkdir -p "${DEFAULT_WORKSPACE}" "${UPLOAD_WORKSPACE}"
chmod 0700 "${CODEX_HOME_DIR}"

export CODEX_HOME="${CODEX_HOME_DIR}"
export HOME="${APP_DATA_DIR}"
export HA_CODEX_UI_DATA="${APP_DATA_DIR}"
export NODE_ENV=production
export PORT=8107
export HA_CODEX_UI_OPTIONS="${OPTIONS_FILE}"

echo "HA_Codex_UI starting."
echo "Service: ha-codex-ui"
echo "Port: ${PORT}"
echo "Data directory: ${APP_DATA_DIR}"
echo "Default workspace: ${DEFAULT_WORKSPACE}"
echo "Upload workspace: ${UPLOAD_WORKSPACE}"
echo "Codex home: ${CODEX_HOME_DIR}"
echo "Log level: ${LOG_LEVEL}"
echo "Secrets and auth file contents are not printed."
if [ -f /tmp/ha-codex-ui/openssl.cnf ]; then
  export OPENSSL_CONF=/tmp/ha-codex-ui/openssl.cnf
elif [ -f /etc/ssl/openssl.cnf ]; then
  export OPENSSL_CONF=/etc/ssl/openssl.cnf
else
  export OPENSSL_CONF=/dev/null
fi

exec node /opt/ha-codex-ui/backend/dist/index.js
