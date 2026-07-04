# Config Pilot Devcontainer

This devcontainer exists for GitHub Actions diagnostics for Config Pilot. Its helper scripts refuse to run unless `GITHUB_ACTIONS=true`.

The workflow builds the devcontainer, validates the add-on structure, runs CI inside the container where supported, attempts Docker image creation, and records Home Assistant startup or install diagnostics when the runner supports them.

Local execution is intentionally disabled for this project.
