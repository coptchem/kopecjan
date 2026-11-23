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
pnpm index                 # rebuild data/index.json (local embedding model, no key; runs in pnpm build too)
pnpm index:docker          # the same inside a Linux container: use this on Windows (see below)
pnpm test:rag              # retrieval check: expected sources in the top 3, off-topic below the threshold
```

Node 22 LTS and pnpm (via corepack). On Windows, `pnpm build` produces a regular build; the
standalone output used by Docker is enabled with `NEXT_OUTPUT=standalone` (needs symlink rights on
Windows, so it is only set in the Dockerfile and in CI).

## Project layout

```
app/[locale]/        layout (fonts, theme, i18n, metadata), the one page, OG image, 404
app/api/             ask (assistant), challenge (proof of work), health
components/          one folder per section, ui/ primitives, chat/ (live chat and the placeholder)
lib/i18n/            next-intl routing, request config, navigation helpers
lib/site.ts          site constants (URL, e-mail, LinkedIn, CV paths)
lib/features.ts      feature flags (NEXT_PUBLIC_CHAT_ENABLED)
messages/            UI copy, en.json and cs.json (same keys, checked by a unit test)
lib/rag/             documents, embed, index, retrieve, prompt, parse, answer, sanitize
lib/rate-limit.ts, lib/bot-guard.ts   limits and proof of work for /api/ask
content/, data/      assistant documents and the generated index
public/cv/           the two CV PDFs; public/jan-kopecky.jpg the photo; public/fonts/ Inter (self-hosted)
scripts/             check-dashes, build-index, test-rag, fetch-model, index-docker.sh
tests/unit, tests/e2e
docs/                specification and STATUS.md
```

## Editing copy

All UI text is in `messages/en.json` and `messages/cs.json`. Keep the keys identical in both files,
never use em or en dashes (`pnpm check-dashes` runs in the build and in CI) (a `[placeholder]` in a string
only produces a warning). The CV PDFs in `public/cv/`
are the source of truth for experience and skills.

## The assistant ("Ask about Jan")

Content in `content/**/*.md` (see `docs/06-content-guide.md`; documents with `draft: true` are skipped) is
chunked and embedded locally by `pnpm index` into `data/index.json` (committed). `/api/ask` embeds the question
with the same local model, finds the closest chunks and streams an answer from Claude Haiku. Details in
`docs/04-rag-spec.md`. The chat is switched on with `NEXT_PUBLIC_CHAT_ENABLED=true` (build time); without it the
page shows the "Coming soon" placeholder.

After editing `content/`: run `pnpm index` (on Windows `pnpm index:docker`), then `pnpm test:rag`, and commit
`data/`.

Protection against abuse, in order: same-origin check, honeypot, proof of work (`/api/challenge`, self-hosted
ALTCHA), 10 questions per hour per hashed IP, 500 per day for the site, questions up to 500 characters,
answers up to 350 tokens, and the spend limit on the Anthropic workspace.

Windows: the native embedding model crashes because Windows ships an older `onnxruntime.dll` in System32. Use
`pnpm index:docker` for the index; `/api/ask` then answers locally with the fallback. Everything else works.

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
