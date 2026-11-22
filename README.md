# kopecjan.cz

Personal website and online business card of Jan Kopecký. One page, EN + CS, light + dark, with an
"Ask about Jan" RAG assistant (switched on in step 2, see below).

Specification lives in `docs/`, rules for contributors (human or Claude Code) in `CLAUDE.md`.

## Run locally

```
corepack enable            # once, gives you pnpm
pnpm install
pnpm dev                   # http://localhost:3000 (EN) and /cs
```

Other commands:

```
pnpm lint                  # eslint + prettier --check + tsc --noEmit
pnpm test                  # vitest unit tests
pnpm test:e2e              # playwright smoke tests against a production build (run pnpm build first)
pnpm build                 # check-dashes + next build
pnpm start                 # serve the production build
pnpm check-dashes          # fails on em/en dashes in messages/ and content/
pnpm index                 # rebuild data/index.json for the assistant (needs OPENAI_API_KEY, step 2)
```

Node 22 LTS and pnpm (via corepack). On Windows, `pnpm build` produces a regular build; the
standalone output used by Docker is enabled with `NEXT_OUTPUT=standalone` (needs symlink rights on
Windows, so it is only set in the Dockerfile and in CI).

## Project layout

```
app/[locale]/        layout (fonts, theme, i18n, metadata), the one page, OG image, 404
app/api/health       container health check
components/          one folder per section, ui/ primitives, chat/ (placeholder until step 2)
lib/i18n/            next-intl routing, request config, navigation helpers
lib/site.ts          site constants (URL, e-mail, LinkedIn, CV paths)
lib/features.ts      feature flags (NEXT_PUBLIC_CHAT_ENABLED)
messages/            UI copy, en.json and cs.json (same keys, checked by a unit test)
public/cv/           the two CV PDFs; public/jan-kopecky.jpg the photo; public/fonts/ Inter (self-hosted)
scripts/             check-dashes.ts (and build-index.ts in step 2)
tests/unit, tests/e2e
docs/                specification and STATUS.md
```

## Editing copy

All UI text is in `messages/en.json` and `messages/cs.json`. Keep the keys identical in both files,
never use em or en dashes (`pnpm check-dashes` runs in the build and in CI) (a `[placeholder]` in a string
only produces a warning). The CV PDFs in `public/cv/`
are the source of truth for experience and skills.

## Step 2: the assistant

The chat panel is rendered as an inactive placeholder until the RAG pipeline lands
(`docs/04-rag-spec.md`, milestones M2 to M4 in `docs/05-implementation-plan.md`). It will be
switched on with `NEXT_PUBLIC_CHAT_ENABLED=true` once `/api/ask` exists. Content for the assistant
goes to `content/` (see `docs/06-content-guide.md`); `pnpm index` turns it into `data/index.json`.

## Deployment

Production runs on the Hetzner server (ssh alias `server`) in `/opt/kopecjan`: Docker Compose with
two services, `caddy` (TLS on 80/443, config in `deploy/Caddyfile`) and `web` (Next.js standalone).

```
ssh server
cd /opt/kopecjan && git pull && docker compose up -d --build
docker compose logs -f web
```

Build-time public variables (`NEXT_PUBLIC_*`) and runtime secrets (`ANTHROPIC_API_KEY`, limits) are read
from `/opt/kopecjan/.env`, which is not in git. Caddy passes the client IP in `X-Forwarded-For` for the
rate limit. The same code also runs on Vercel without changes.

Environment variables are listed with comments in `.env.example`.
