# 06 Content guide: what to write for the assistant

The assistant can only say what is in `content/`. The CV alone answers "what" and "where", not "how", "why", "how well" or "is he a fit". This file lists the documents to write, in priority order, with templates. Write in English unless marked otherwise (the embedding model is multilingual, Czech questions still find English text). Keep paragraphs short with a heading each; one idea per paragraph. Q&A pairs retrieve best.

Front matter for every file (see `docs/04-rag-spec.md`): `title`, `slug`, `lang`, `kind`, optional `url`, `priority`, `draft: true` while a `[TODO]` remains.

Never include: family, health, exact home address, salary history, client names without permission, anything you would not say in a job interview.

## Folder layout

```
content/
  cv/cv-en.md              priority 2, the CV as markdown (Claude Code writes this from the PDF)
  cv/cv-cs.md              lang cs
  about/profile.md         who Jan is in 10 lines, how he describes himself, what he wants next
  how-i-work/claude-code.md
  how-i-work/process.md
  projects/flatter.md
  projects/tao-real-estate.md
  projects/ask-about-jan.md
  experience/freelance.md
  experience/msd.md
  experience/ceska-pojistovna.md
  experience/ministry.md
  faq/recruiters-en.md
  faq/clients-cs.md        lang cs
  faq/boundaries.md        what the assistant should redirect (used as content, not as prompt)
```

## 1. Projects (highest value)

Template `content/projects/<slug>.md`:

```markdown
---
title: Flatter.cz
slug: flatter
lang: en
kind: project
url: https://flatter.cz
priority: 1
---

## What it is
One paragraph: the problem, for whom, since when, current status (live / beta), how it is sold (subscription tiers if public).

## What Jan built
Bullet or short paragraphs: data pipeline (sources, frequency, volume you are willing to share), backend, frontend, notifications, admin, billing. Say what is yours and what is a library or service.

## Architecture and stack
Hosting, languages, frameworks, database, queues, cron, monitoring. One paragraph per layer.

## Numbers
Only what you are happy to publish: listings monitored, users, uptime, e-mails per month, build time. If nothing, delete the section.

## Hard parts and lessons
2 to 4 short paragraphs: what was difficult, what you would do differently, what you are proud of.

## Typical questions
### Q: How does Flatter collect data?
A: ...
### Q: Is Flatter profitable / how many users?
A: ... (or "Jan shares this on request")
```

Write the same for `tao-real-estate.md` (public scope only: cadastre check, AI photo editing, viewings, indicative price from a price map, contracts, land registry documents; stack Flutter, NestJS, PostgreSQL + PostGIS, Gemini and ChatGPT models, ČÚZK REST API; status beta) and for `ask-about-jan.md` (this site: Next.js, embeddings, cosine search, Claude API, rate limiting; Claude Code can draft this one from `docs/04`).

## 2. Experience, one file per job

Template `content/experience/<slug>.md`:

```markdown
---
title: MSD IT Global Innovation Center
slug: msd
lang: en
kind: experience
priority: 1
---

## Role and team
Title, years, team size, who you reported to (role, not name), how the team was distributed, sprint cadence.

## What Jan was responsible for
3 to 6 concrete deliverables with the technology used. Markets, scale (number of sites, traffic if known).

## Tools and process
Tridion, WordPress VIP, Akamai Identity Cloud, Tealium, GTM, JIRA, Confluence, GitHub: what you did with each.

## Why Jan moved on
One honest paragraph.

## Typical questions
### Q: What did Jan do at MSD?
A: ...
### Q: Did Jan work with international teams?
A: ...
```

The freelance file should also cover: types of clients, typical engagement (fixed scope vs. retainer), how you estimate and invoice (IČO, VAT status if you want), typical deliverables (automations, scrapers, integrations, apps).

## 3. How Jan works

`how-i-work/claude-code.md`: your Claude Code setup as an agile team: which subagents (planning, development, QA, security), what the hooks check, project rules, how you review generated code, what you never let the agent do, which other tools (OpenAI Codex, Google Antigravity) you use for what.

`how-i-work/process.md`: discovery and specification writing, communication cadence with clients and managers, testing and CI habits, documentation habits, remote work setup (hours, overlap with US time zones, tools).

## 4. FAQ for recruiters (`faq/recruiters-en.md`, Q&A only)

Answer each as you would in a first call. Suggested questions:

- Is Jan open to new roles right now, and from when? Notice period?
- Employment form: contract via IČO (B2B), employee, both? Which countries' employers?
- Remote only, or hybrid in Prague possible? Travel?
- Time zone and overlap: CET, usual working hours, overlap with UK / US East / US West?
- Rate or salary expectation: a range, or "shared on request" (then say that).
- Seniority: years, largest systems owned, people led or mentored.
- What roles does Jan want (AI engineer, full-stack, automation, solution engineer) and which does he not want?
- Languages: Czech native, English C1 (used daily at MSD), German A2.
- Education and certifications.
- Can Jan share code samples or references?

## 5. FAQ for Czech clients (`faq/clients-cs.md`, lang cs, Q&A only)

- Co Jan dělá na zakázku (weby, aplikace, automatizace, scraping a datové pipeline, integrace, AI asistenti).
- Jak probíhá spolupráce: úvodní hovor, specifikace, odhad, milníky, fakturace, předání a provoz.
- Orientační ceny nebo "na vyžádání".
- Technologie, které preferuje, a kdy doporučí něco jiného.
- Reference a ukázky (Flatter.cz, TAO Real Estate).
- Dostupnost a kapacita.

## 6. Boundaries (`faq/boundaries.md`)

Short list of topics the assistant should hand off to Jan by e-mail, phrased as Q&A so the fallback stays polite and consistent: private life, exact salary history, client names under NDA, legal or pricing commitments. Also the sentence the assistant should use to redirect, in EN and CS.

## Quality checklist before `pnpm index`

- Every file has valid front matter and no `[TODO]` (else `draft: true`).
- No em or en dashes.
- Headings are questions or nouns, not clever titles; a chunk should make sense on its own.
- Numbers have units and dates ("since 2024", "about 40 000 listings per day").
- Nothing in `content/` contradicts the CV or the website copy.
