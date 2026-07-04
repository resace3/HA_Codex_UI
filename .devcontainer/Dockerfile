FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    jq \
    python3 \
    python3-pip \
    shellcheck \
    unzip \
    zip \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g @devcontainers/cli

WORKDIR /workspaces/HA_Codex_UI
