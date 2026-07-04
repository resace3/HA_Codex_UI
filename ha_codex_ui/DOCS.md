# HA_Codex_UI Add-on Docs

## Architecture

HA_Codex_UI runs a Node.js backend on port `8107`, serves the React frontend, and exposes JSON API routes under `/api`. The frontend builds Ingress-aware HTTP and WebSocket URLs so it works behind Home Assistant path prefixes.

## API Reference

All JSON APIs return either:

```json
{"ok":true,"data":{}}
```

or:

```json
{"ok":false,"error":{"code":"SAFE_ERROR_CODE","message":"Safe message"}}
```

Main routes:

- `GET /api/health`
- `GET /api/diagnostics`
- `GET /api/workspaces`
- `GET /api/files/tree`
- `GET /api/files/read`
- `PUT /api/files/write`
- `POST /api/files/upload`
- `GET /api/files/download`
- `GET /api/files/download-zip`
- `POST /api/terminals`
- `GET /api/terminals/:id/ws`
- `GET /api/codex/status`
- `POST /api/codex/session`
- `GET /api/diff/status`
- `POST /api/diff/snapshot`
- `GET /api/ha/status`
- `POST /api/ha/check-yaml`

## WebSocket Protocol

Client messages are `input`, `resize`, and `ping`. Server messages are `output`, `status`, `exit`, `error`, and `pong`.

## Path Policy

Paths are resolved against configured workspace roots. Traversal, absolute escape, symlink escape, Codex state, SSH keys, GnuPG state, browser credential stores, token files, and `secrets.yaml` are blocked by default. `secrets.yaml.example` is allowed.

## Terminal Lifecycle

Shell and Codex sessions use `node-pty`, store metadata in `/data/ha_codex_ui/sessions`, and stream live output over WebSocket. Raw terminal logs are not persisted by default.

## Codex Lifecycle

Codex state is stored under `/data/ha_codex_ui/.codex` with `0700` permissions. Auth file contents are never returned or downloadable. Users sign in through the Codex CLI terminal flow.

## Snapshots And Diffs

Git workspaces use `git status` and `git diff`. Non-git workspaces can create filesystem snapshots under `/data/ha_codex_ui/snapshots`. Snapshots skip `.git`, `node_modules`, secrets, large files, binary files, and Codex state.

## Home Assistant Integration

The add-on uses Ingress and safe mapped volumes. YAML parsing is supported. Full config checks return `supported: false` unless a safe supported Home Assistant check is available.

## Testing And Release

For this project, execution is intentionally delegated to GitHub Actions. Workflows run dependency installation, lint, typecheck, unit tests, browser rendering, PTY tests, file manager tests, Docker builds, devcontainer smoke checks, Home Assistant install attempts, security scans, and release image publishing.
