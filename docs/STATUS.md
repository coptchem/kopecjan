# Status

Last update: 2026-11-20. Work is split in two steps: step 1 = the website (M0, M1, Docker from M5),
step 2 = the assistant (M2, M3, M4, rest of M5, M6). Until step 2 ships, the chat panel is an
inactive placeholder with a "Coming soon" badge and a disabled composer.

| Milestone | State | Notes |
| --- | --- | --- |
| M0 Scaffold | done | Next 15.5, Tailwind v4 tokens, next-intl (as-needed prefix, NEXT_LOCALE cookie), next-themes, Vitest, Playwright, ESLint 9 + Prettier, check-dashes in build and CI, GitHub Actions |
| M1 Static page | done | All sections from the design; metadata, hreflang, OG image, JSON-LD Person, sitemap, robots, favicon; chat placeholder behind `NEXT_PUBLIC_CHAT_ENABLED` |
| M2 Content and index | open | step 2 |
| M3 Assistant API | open | step 2 |
| M4 Chat UI | open | step 2, replaces `components/chat/ChatPlaceholder.tsx` |
| M5 Deployment | partly | Dockerfile (standalone), compose.yml, `/api/health`, security headers in next.config. Open: deploy workflow, DNS, HSTS at the proxy, CSP |
| M6 Content fill | open | Jan writes content/ per docs/06 |

## Checks run on 2026-11-20

- `pnpm lint`, `pnpm test` (8 unit tests), `pnpm build`, `pnpm test:e2e` (13 Playwright tests, desktop + mobile) all green.
- Not verified: `docker build` (Docker Desktop was not running on the dev machine). The Dockerfile follows the standard Next.js standalone recipe; CI builds with `NEXT_OUTPUT=standalone` on Linux, which covers the standalone output itself.
- Screenshots at 1440 and 390 in light and dark, EN and CS, compared with the design artboards.
- Lighthouse 12 (mobile preset) against `next start` on localhost: Accessibility 100, Best Practices 100, SEO 100, Performance 93 to 94 (simulated throttling; LCP 2.8 s is driven by the simulated 450 ms TTFB plus the Next.js runtime, 103 kB shared JS). The 95 target for Performance must be confirmed on the deployed URL with PageSpeed Insights; locally it is 1 to 2 points short.

## Assumptions and deviations

- `Experience` uses native `<details>` and is a server component (no JavaScript needed for the collapsibles); CLAUDE.md listed it among client components.
- Standalone output is opt-in via `NEXT_OUTPUT=standalone` because Windows needs symlink rights for it; the Dockerfile and CI set it.
- Added UI keys not in the design: `chat.inactiveBadge`, `chat.inactiveTitle`, `chat.inactiveBody`, `chat.inactivePlaceholder` (placeholder state) and `notFound.*` (404 page).
- Analytics: optional Plausible or Umami script, only when `NEXT_PUBLIC_ANALYTICS_URL` is set.
- Fonts: Inter is self-hosted from `public/fonts` with hand-written `@font-face` rules (latin and latin-ext subsets, metric-compatible fallback) and explicit preload links instead of `next/font/google`. Reason: on this Windows checkout `next/font` produced an empty font manifest, so no preload links were emitted and Lighthouse put the fonts on the critical path. The result is deterministic on every platform and `docker build` no longer needs Google Fonts.
- Sections below the fold use `content-visibility: auto` (`lazy` prop on `Section`) to cut layout work on mobile.

## Open placeholders

None. IČO filled in on 2026-11-22.
