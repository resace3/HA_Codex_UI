# HA_Codex_UI

HA_Codex_UI is a Home Assistant add-on that opens through Ingress and provides a browser workspace for file browsing, text editing, uploads, downloads, live terminals, Codex CLI sessions, diffs, snapshots, diagnostics, and Home Assistant-focused checks.

The default configuration keeps sensitive Home Assistant folders read-only. Writable work happens in `/share/ha_codex_ui_workspace` and `/share/ha_codex_ui_uploads`.

## Safety

Terminals and Codex sessions can run commands. Any workspace mounted read-write can be modified by terminal commands. The default add-on mapping keeps `/config`, `/addons`, and `/backup` read-only so terminal access cannot silently bypass app write policy for those folders.

## Ingress

The add-on listens internally on port `8107` and is intended to be opened from the Home Assistant sidebar through Ingress. Direct access is for CI and test mode only.

## Configuration

Edit options from the Home Assistant add-on UI. The important defaults are:

| Option | Default |
| --- | --- |
| `default_workspace` | `/share/ha_codex_ui_workspace` |
| `upload_workspace` | `/share/ha_codex_ui_uploads` |
| `allowed_workspaces` | Workspace, uploads, and `/config` |
| `allow_config_write` | `false` |
| `allow_shell` | `true` |
| `allow_codex` | `true` |
| `max_upload_mb` | `50` |
| `max_terminal_sessions` | `8` |
| `codex_home` | `/data/ha_codex_ui/.codex` |

## Known Limits

- Codex authentication must be completed by the user in a terminal.
- PTY sessions survive browser refresh while the add-on process is running, but old sessions are marked exited after an add-on restart.
- Full Home Assistant config checks depend on safe Supervisor or Core support from the add-on context.
- `/config` is read-only by default. Direct editing requires a documented unsafe variant or a patch workflow.
- This project delegates tests, builds, Docker, devcontainer checks, and smoke checks to GitHub Actions.
