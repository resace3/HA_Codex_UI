#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
cd /workspaces/ha-config-pilot
python3 scripts/validate-addon-metadata.py
test -f repository.yaml
test -f config_pilot/config.yaml
grep -F "slug: config_pilot" config_pilot/config.yaml
grep -F "ingress_port: 8107" config_pilot/config.yaml
echo "Config Pilot local add-on structure detected."
