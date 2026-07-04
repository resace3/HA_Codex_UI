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
