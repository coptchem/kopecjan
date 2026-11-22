# 03 Content and i18n

## Two kinds of text

1. **UI copy** (headings, buttons, chat strings, project cards, skills, experience): lives in `messages/en.json` and `messages/cs.json`, consumed through `next-intl`. The two files in this package are the full dictionaries taken from the approved design. Keys are stable; do not rename them without updating both files.
2. **Assistant knowledge**: markdown documents in `content/`, used only by the RAG. The UI never reads `content/`. See `docs/04-rag-spec.md` and `docs/06-content-guide.md`.

The CV PDFs are the ground truth for both. When the CV changes, update `messages/*.json` (experience, skills) and `content/cv/*.md` together.

## Routing

- `/` = English (default locale, no prefix). `/cs` = Czech. Use `next-intl` middleware with `localePrefix: "as-needed"`.
- `<html lang>` follows the locale. `hreflang` alternates (`en`, `cs`, `x-default` → `/`) in `<head>`.
- Language switch in the header links to the same page in the other locale (not a cookie-only toggle, so both URLs are indexable). Remember the choice in a cookie (`NEXT_LOCALE`) so a returning visitor lands on their language.
- Anchor ids are the same in both locales: `#ask`, `#projects`, `#skills`, `#experience`, `#contact`.

## Rules for copy

- No em dash (`—`) or en dash (`–`) anywhere. Ranges: "2018 to 2024" / "2018 až 2024". `scripts/check-dashes.ts` enforces this on `messages/` and `content/` and runs in `pnpm build` and CI.
- Middle dot `·` is allowed (title, footer).
- Keep the CV wording. Translations in `cs.json` are approved; change them only on Jan's request.
- Placeholders Jan still has to fill: `footer.copyright` IČO. Keep the `[YOUR IČO]` / `[VAŠE IČO]` text until Jan replaces it; the build should warn (not fail) if a `[` placeholder remains in `messages/`.
- Interpolations: `{used}`, `{limit}`, `{minutes}`, `{year}` are ICU arguments. `{year}` = current year from the server.

## Metadata and SEO

- `generateMetadata` per locale from `messages.meta`. Canonical per locale. OG image from `app/[locale]/opengraph-image.tsx` (name, title, photo, `--bg` background, no gradients).
- JSON-LD `Person` on the page: name, jobTitle, url, sameAs (LinkedIn), email, address country CZ, knowsLanguage.
- `sitemap.ts` lists `/` and `/cs`. `robots.ts` allows all, disallows `/api/`.

## Analytics (optional, off by default)

If Jan wants numbers: Plausible or Umami script, loaded only when `NEXT_PUBLIC_ANALYTICS_URL` is set. Track page view, CV download, chat question sent (no question text), chat state reached (`answered`, `fallback`, `error`, `ratelimit`). No Google Analytics / GTM, so no cookie banner.
