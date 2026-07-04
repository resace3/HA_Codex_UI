# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS frontend-build
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --package-lock-only && npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim AS backend-build
WORKDIR /build/backend
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    g++ \
    make \
    python3 \
  && rm -rf /var/lib/apt/lists/*
COPY backend/package.json backend/package-lock.json ./
RUN npm install --package-lock-only && npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

LABEL org.opencontainers.image.title="HA_Codex_UI" \
  org.opencontainers.image.description="Home Assistant add-on for secure browser file management, terminals, and Codex CLI sessions." \
  org.opencontainers.image.source="https://github.com/resace3/HA_Codex_UI" \
  org.opencontainers.image.licenses="MIT"

ARG CODEX_STUB=0
ENV NODE_ENV=production \
  PORT=8107 \
  HA_CODEX_UI_DATA=/data/ha_codex_ui \
  CODEX_HOME=/data/ha_codex_ui/.codex \
  HOME=/data/ha_codex_ui

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    gzip \
    jq \
    openssh-client \
    python3 \
    tar \
    unzip \
    zip \
  && rm -rf /var/lib/apt/lists/*

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN if [ "${CODEX_STUB}" = "1" ]; then \
      printf '%s\n' '#!/usr/bin/env bash' 'echo "Codex stub ready"' > /usr/local/bin/codex \
      && chmod 0755 /usr/local/bin/codex; \
    else \
      mkdir -p "${HOME}" \
      && curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh \
      && if ! command -v codex >/dev/null 2>&1 && [ -x "${HOME}/.local/bin/codex" ]; then ln -s "${HOME}/.local/bin/codex" /usr/local/bin/codex; fi \
      && codex --version; \
    fi

WORKDIR /opt/ha-codex-ui
COPY --from=backend-build /build/backend/dist ./backend/dist
COPY --from=backend-build /build/backend/node_modules ./backend/node_modules
COPY --from=backend-build /build/backend/package.json ./backend/package.json
COPY --from=frontend-build /build/frontend/dist ./frontend
COPY run.sh /run.sh

RUN mkdir -p /data/ha_codex_ui/.codex /data/ha_codex_ui/sessions /data/ha_codex_ui/snapshots /share/ha_codex_ui_workspace /share/ha_codex_ui_uploads \
  && chmod 0700 /data/ha_codex_ui/.codex \
  && chmod 0755 /run.sh

EXPOSE 8107
ENTRYPOINT ["/run.sh"]
