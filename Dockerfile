# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js standalone output.
# Debian slim (glibc) instead of Alpine: onnxruntime-node, which runs the local embedding
# model for the assistant, ships glibc binaries only.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone \
    ONNXRUNTIME_NODE_INSTALL=skip
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
ARG NEXT_PUBLIC_SITE_URL=https://kopecjan.cz
ARG NEXT_PUBLIC_ANALYTICS_URL=
ARG NEXT_PUBLIC_ANALYTICS_SITE_ID=
ARG NEXT_PUBLIC_CHAT_ENABLED=false
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ANALYTICS_URL=$NEXT_PUBLIC_ANALYTICS_URL \
    NEXT_PUBLIC_ANALYTICS_SITE_ID=$NEXT_PUBLIC_ANALYTICS_SITE_ID \
    NEXT_PUBLIC_CHAT_ENABLED=$NEXT_PUBLIC_CHAT_ENABLED \
    EMBED_CACHE_DIR=/app/models
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Download the embedding model (about 120 MB) into the image and check that it runs.
RUN pnpm exec tsx scripts/fetch-model.ts
RUN pnpm build

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    EMBED_CACHE_DIR=/app/models EMBED_ALLOW_DOWNLOAD=false
WORKDIR /app
RUN groupadd --system nextjs && useradd --system --gid nextjs --no-create-home nextjs
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/data ./data
COPY --from=build --chown=nextjs:nextjs /app/models ./models
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "server.js"]
