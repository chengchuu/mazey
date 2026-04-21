FROM node:22-bookworm

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

# Match ubuntu-latest style tooling needed by your workflow
RUN apt-get update && apt-get install -y --no-install-recommends \
    dos2unix \
    git \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy repo
COPY . .

# Simulate workflow env
ENV NODE_VERSION=22
ENV PROJECT_NAME=mazey
ENV GITHUB_ACTOR=local-dev

# Default command runs "test job" behavior
CMD bash -lc '\
  set -euo pipefail; \
  echo "== Install dependencies =="; \
  npm install; \
  echo "== Build package =="; \
  npm run build --if-present; \
  echo "== Run tests =="; \
  npm test \
'
