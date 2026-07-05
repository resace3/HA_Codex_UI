#!/usr/bin/env bash
set -euo pipefail

OPTIONS_SOURCE="${HA_CODEX_UI_OPTIONS:-/data/options.json}"
OPTIONS_FILE="/tmp/ha-codex-ui/options.json"

mkdir -p /tmp/ha-codex-ui
if [ -r "${OPTIONS_SOURCE}" ]; then
  if ! cp "${OPTIONS_SOURCE}" "${OPTIONS_FILE}" 2>/dev/null; then
    printf '%s\n' "{}" >"${OPTIONS_FILE}"
  fi
else
  printf '%s\n' "{}" >"${OPTIONS_FILE}"
fi

export HA_CODEX_UI_OPTIONS="${OPTIONS_FILE}"

read_option() {
  local query="$1"
  local fallback="$2"
  local value
  value="$(jq -r "${query}" "${OPTIONS_FILE}" 2>/dev/null || true)"
  if [ -z "${value}" ] || [ "${value}" = "null" ]; then
    value="${fallback}"
  fi
  printf '%s' "${value}"
}

APP_DATA_DIR="$(read_option '.app_data_dir // "/data/ha_codex_ui"' '/data/ha_codex_ui')"
CODEX_HOME_DIR="$(read_option '.codex_home // "/data/ha_codex_ui/.codex"' '/data/ha_codex_ui/.codex')"
DEFAULT_WORKSPACE="$(read_option '.default_workspace // "/share/ha_codex_ui_workspace"' '/share/ha_codex_ui_workspace')"
UPLOAD_WORKSPACE="$(read_option '.upload_workspace // "/share/ha_codex_ui_uploads"' '/share/ha_codex_ui_uploads')"
LOG_LEVEL="$(read_option '.log_level // "info"' 'info')"

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

export OPENSSL_CONF="/tmp/ha-codex-ui/openssl.cnf"
if [ -r /etc/ssl/openssl.cnf ]; then
  cp -f /etc/ssl/openssl.cnf "$OPENSSL_CONF"
else
  printf '%s\n' 'nodejs_conf = default_conf' '[default_conf]' >"$OPENSSL_CONF"
fi
export NODE_OPTIONS="--openssl-config=${OPENSSL_CONF}"

export HA_CODEX_UI_OPTIONS
export HA_CODEX_UI_DATA="${APP_DATA_DIR}"

exec node --openssl-config="${OPENSSL_CONF}" /opt/ha-codex-ui/backend/dist/index.js
