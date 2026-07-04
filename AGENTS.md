# AGENTS.md

This repository is a Home Assistant add-on named **HA_Codex_UI**.

## Non-Negotiable Rules

- Never commit secrets.
- Never weaken path policy.
- Never disable security tests to pass CI.
- Keep Home Assistant Ingress working.
- Keep mobile layout working.
- Update docs when behavior changes.
- Prefer safe defaults.
- Do not add host networking.
- Do not add full access.
- Do not add Docker socket access.
- Do not commit generated data.
- Do not run tests, builds, Docker, devcontainers, package installers, or generated scripts locally.
- Let GitHub Actions run all execution.
- Do not rename the app back to old conflicting names.
- Keep slug as `ha_codex_ui` unless a migration is documented.

## Local Work Policy

Local work is limited to creating files, editing files, deleting files created by mistake, chmod on scripts, git operations, and GitHub CLI repository or workflow inspection operations. Local validation must be static text inspection only.

## Security Expectations

HA_Codex_UI exposes file and terminal access inside Home Assistant. Treat every change as security-sensitive:

- Path resolution must stay rooted inside configured workspaces.
- Symlink escape must stay blocked.
- Codex auth files must never be readable or downloadable.
- `secrets.yaml` must stay blocked by default.
- Sensitive Home Assistant mounts must stay read-only in the default add-on configuration.
- Terminal features must retain warnings and limits.
- Logs must not include file contents, tokens, or auth JSON.

## CI Expectations

All project execution belongs in GitHub Actions. If a change needs verification, add or update a workflow or test file and let Actions run after push.
