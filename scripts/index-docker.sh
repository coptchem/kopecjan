#!/usr/bin/env bash
# Builds data/index.json inside a Linux container. Use this on Windows, where the system
# onnxruntime.dll (Windows ML) shadows the one onnxruntime-node needs and the native model crashes.
#
# Usage: pnpm index:docker                 (scripts/build-index.ts)
#        bash scripts/index-docker.sh test-rag --verbose
SCRIPT="${1:-build-index}"; shift || true
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Git Bash on Windows: give Docker a Windows path and stop MSYS from rewriting /src, /models etc.
if pwd -W >/dev/null 2>&1; then
  ROOT="$(cd "$ROOT" && pwd -W)"
  export MSYS_NO_PATHCONV=1
fi
docker run --rm \
  -v "$ROOT:/src" \
  -v kopecjan-index-models:/models \
  -v kopecjan-index-pnpm:/pnpm \
  -e EMBED_CACHE_DIR=/models -e ONNXRUNTIME_NODE_INSTALL=skip -e PNPM_HOME=/pnpm \
  node:22-bookworm-slim bash -c '
    set -e
    corepack enable >/dev/null
    mkdir -p /app && cd /src
    tar --exclude=./node_modules --exclude=./.next --exclude=./.git --exclude=./.cache --exclude=./.env* --exclude=./.claude --exclude=./kopecjan-web.txt -cf - . | tar -xf - -C /app
    cd /app
    pnpm install --frozen-lockfile --silent
    pnpm exec tsx scripts/$0.ts "$@"
    cp data/index.json data/.embed-cache.json /src/data/
  ' "$SCRIPT" "$@"
