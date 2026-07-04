# Security Policy

## Threat Model

HA_Codex_UI gives authenticated Home Assistant users browser access to file management, text editing, terminals, and Codex CLI sessions. The main risks are unauthorized access, accidental modification of Home Assistant configuration, secret exposure, terminal misuse, path traversal, symlink escape, unsafe downloads, and leaked Codex or Home Assistant tokens.

## Terminal Risk

Terminals can run arbitrary shell commands. The default add-on mapping keeps `/config`, `/addons`, and `/backup` read-only so terminal commands cannot silently modify sensitive Home Assistant folders. Writable workspaces remain powerful and should be treated as trusted.

## Codex Risk

Codex can edit files and run commands in the selected workspace. HA_Codex_UI stores Codex state under `/data/ha_codex_ui/.codex`, sets restrictive permissions, blocks direct browser access to that folder, and never displays auth file contents.

## Sensitive Files

The path policy blocks:

- Path traversal and absolute path escape.
- Symlink escape.
- `/data/ha_codex_ui/.codex`.
- Codex auth files.
- SSH and GnuPG state.
- Browser credential stores.
- Token-like files.
- `secrets.yaml`.

`secrets.yaml.example` is allowed.

## Vulnerability Reporting

Report vulnerabilities privately to Nick Rezaee at `resace3@gmail.com`. Include a clear description, affected files or endpoints, reproduction steps, and any suggested mitigations.

## If Codex Auth Leaks

1. Stop the add-on.
2. Remove affected files under `/data/ha_codex_ui/.codex`.
3. Revoke or rotate any impacted OpenAI credentials through the provider account.
4. Restart the add-on.
5. Sign in again through a Codex terminal.

## Disabling Risky Features

Use Home Assistant add-on options:

- Set `allow_shell: false` to disable shell terminals.
- Set `allow_codex: false` to disable Codex sessions.
- Keep `allow_config_write: false`.
- Keep `allow_addons_write: false`.
- Keep `allow_backup_write: false`.

## Network Exposure

Do not expose this add-on publicly. Use Home Assistant authentication through Ingress. For remote access, prefer Home Assistant Cloud, VPN, Tailscale, or another private access layer.

## Secret Redaction

Logs redact bearer tokens, OpenAI-style keys, Home Assistant tokens, refresh tokens, access tokens, private key blocks, and auth JSON-like values. File contents and raw terminal logs are not logged by default.

## Why `/config` Is Read-Only By Default

An app-level save policy cannot constrain arbitrary terminal commands inside a read-write mount. The default read-only `/config` mapping ensures shell and Codex access cannot silently bypass HA_Codex_UI write checks for the primary Home Assistant configuration folder.

## Local Execution Firewall

Generated scripts refuse local execution because this project intentionally delegates tests, builds, package installation, Docker, devcontainer operations, smoke checks, browser automation, and Home Assistant install attempts to GitHub Actions.
