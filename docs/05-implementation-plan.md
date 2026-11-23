# 05 Implementation plan

One milestone = one branch and one PR. Each milestone ends with the `qa` pass (lint, tests, acceptance criteria below, hard rules in `CLAUDE.md`) and an update of `docs/STATUS.md`.

## M0 Scaffold and tooling

- `pnpm create next-app` (TypeScript, App Router, Tailwind v4, ESLint, `src/` off), Prettier, Vitest, Playwright, `tsc --noEmit` script.
- `next-intl` with `[locale]` segment, `messages/` from this package, middleware, `as-needed` prefix.
- `next-themes` provider, `html.dark`, no flash on load (script in `<head>` as the library recommends).
- `app/globals.css` with the tokens from `docs/02-design-spec.md` and Inter via `next/font`.
- `scripts/check-dashes.ts` wired into `pnpm build` and CI. GitHub Actions: lint, unit tests, build on every PR.
- `.env.example`, `README.md` (how to run, how to add content, how to rebuild the index).
- Copy `cv/*.pdf` to `public/cv/`, photo to `public/jan-kopecky.jpg`.

Acceptance: `pnpm lint && pnpm test && pnpm build` green; `/` and `/cs` render a placeholder page in both themes; language switch and theme toggle work and persist.

## M1 Static page

- Components: Header (with MobileMenu), Hero, Projects, Skills, Experience (collapsibles), Contact, Footer, `ui/` primitives. Section "Ask about Jan" with the How-it-works card and a static placeholder where the chat will go.
- All copy from `messages/*.json`. Photo through `next/image`. Anchor navigation with smooth scroll and `scroll-margin-top`.
- Metadata, OG image, JSON-LD, sitemap, robots, favicon.

Acceptance: pixel-close to the design artboards at 1440 and 390 in both themes and both locales (QA compares screenshots side by side); Lighthouse mobile ≥ 95 in all four categories; keyboard navigation reaches every control; `check-dashes` passes.

## M2 Content and index

- `content/` structure from `docs/06-content-guide.md`; `content/cv/cv-en.md` and `cv-cs.md` written from the PDFs (verbatim structure, no additions). Other documents start as templates with `[TODO]` markers that Jan fills in.
- `scripts/build-index.ts` with chunking, caching, front matter validation (fail on missing `title`, `slug`, `lang`, `kind`).
- `lib/rag/index.ts` loads `data/index.json` once (module scope). `lib/rag/retrieve.ts` with cosine search, boost, dedupe, threshold.
- `tests/rag/questions.json` first version (at least 12 questions answerable from the CV alone) and `pnpm test:rag`.

Acceptance: index builds from the CV documents; retrieval test passes for CV questions in EN and CS; `[TODO]` documents are excluded from the index until filled (front matter `draft: true`).

## M3 Assistant API

- `app/api/ask/route.ts`: validation, rate limit, retrieval, threshold fallback, Claude streaming, SOURCES parsing, SSE framing, timeouts, abort handling, headers.
- `lib/rate-limit.ts` with the interface from `docs/04-rag-spec.md`; unit tests for the sliding window and the daily cap.
- Request log line (no question text in production) and `pnpm stats`.

Acceptance: `curl -N` shows streamed tokens, a `sources` event and `done`; an off-topic question returns `fallback` without an LLM call (verified in the log); the 11th question within an hour returns 429 with `Retry-After`; unit tests pass; `security` review signs off on injection handling, input limits and secret usage.

## M4 Chat UI

- `components/chat/`: reducer with the states from `docs/02-design-spec.md`, streaming reader with AbortController, chips, source chips, counter from headers, Stop, Retry, "Ask something else", auto-scroll, `aria-live`.
- Light and dark, EN and CS, mobile layout.
- Playwright: welcome → chip click → streamed answer with sources (mocked API), fallback, error, rate limit (each state driven by a mocked response).

Acceptance: every one of the 7 designed states is reachable and matches the artboards; the chat works with keyboard only; Lighthouse still ≥ 95; no console errors.

## M5 Deployment

- `Dockerfile` (multi-stage, `output: "standalone"`), `compose.yml` for the Hetzner server with the reverse proxy Jan already uses (Caddy or Traefik; document which) and `x-forwarded-for` passthrough, health check route `/api/health`.
- GitHub Actions: build and push the image on tag, deploy via SSH (or a Vercel project as the alternative; both must work from the same code).
- Env on the server: `ANTHROPIC_API_KEY`, `ALTCHA_HMAC_KEY`, `RAG_MODEL`, `RATE_LIMIT_PER_HOUR`, `DAILY_CAP`, `NEXT_PUBLIC_SITE_URL`.
- DNS for kopecjan.cz, HTTPS, HSTS, security headers (CSP without `unsafe-inline` where Next allows it, Referrer-Policy, X-Content-Type-Options).

Acceptance: production URL serves both locales over HTTPS with the headers above; a real question gets a sourced answer in under 5 s; logs show token usage; `pnpm stats` reports cost.

## M6 Content fill and tuning (Jan + Claude Code)

- Jan fills the `[TODO]` documents (see `docs/06`). Claude Code rebuilds the index, extends `tests/rag/questions.json`, tunes `k`, threshold and chunk size against the golden set, and reviews answers for the four suggested chips in both languages.
- Replace the IČO placeholder in `messages/*.json`.
- Optional: analytics, `llms.txt`, a `/cv` redirect to the PDF.

Acceptance: the four suggested questions produce correct, sourced answers in EN and CS; at least 90 % of the golden set passes retrieval; no `[TODO]` left in indexed content or in `messages/`.

## Later ideas (not in v1)

- Conversation memory (send the last two turns as context).
- Czech twins of the project documents if Czech answers feel off.
- pgvector when the corpus grows; hybrid search (BM25 + vectors) if recall drops on exact names.
- "Ask by e-mail" handoff: a button in the fallback that pre-fills a mailto with the question.
