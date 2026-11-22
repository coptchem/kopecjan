# 01 Overview

## What we are building

kopecjan.cz: a one-page personal website for Jan Kopecký. It is an online business card for recruiters and hiring managers (remote AI / full-stack roles, EU and US) and for Czech clients looking for custom software and automation. The key feature is "Ask about Jan", a small RAG assistant that answers questions about Jan's experience, skills and projects from his own documents, with sources.

## Goals (in priority order)

1. A visitor understands in 10 seconds who Jan is: name, title, one sentence, location, photo.
2. The visitor can try the AI assistant and gets a correct, sourced answer in under 5 seconds (first token under 1.5 s).
3. The visitor can download the CV (EN or CS) or contact Jan (e-mail, LinkedIn) from any section.
4. The site works in EN and CS, light and dark, desktop and mobile, and scores ≥ 95 in Lighthouse.
5. Running cost stays under roughly 5 USD per month at expected traffic (a few hundred questions per month).

## Non-goals (v1)

- No blog, no CMS, no admin UI. Content is markdown in the repo.
- No user accounts, no chat history persistence, no cookies beyond theme preference in localStorage.
- No vector database. The index is a committed JSON file.
- No contact form (mailto only), no newsletter.

## Audiences and the questions they ask

Recruiter / hiring manager:
- Is he a fit for a remote senior AI or full-stack engineer role?
- What AI tooling does he actually use day to day?
- What did he do at MSD / as a freelancer? For how long?
- Availability, time zone overlap, employment form, languages.

Czech client:
- Co umí postavit na míru, jak probíhá zakázka, reference.
- Co je Flatter.cz a TAO Real Estate.

Both groups should be able to get these answers from the assistant without scrolling, and the sources should let them verify.

## Deliverables of this package

| File | Purpose |
| --- | --- |
| `CLAUDE.md` | rules and conventions for Claude Code |
| `docs/01-overview.md` | this file |
| `docs/02-design-spec.md` | tokens, layout, components, responsive rules, chat states |
| `docs/03-content-i18n.md` | how copy and i18n work; dictionaries are in `messages/` |
| `docs/04-rag-spec.md` | the assistant: pipeline, API, prompt, guardrails, limits |
| `docs/05-implementation-plan.md` | milestones M0 to M6 with acceptance criteria |
| `docs/06-content-guide.md` | what Jan has to write into `content/` and templates for it |
| `messages/en.json`, `messages/cs.json` | UI copy taken from the design |
| `.env.example` | environment variables |

## Links

- Design (desktop, mobile, light, dark, EN, CS, all chat states): https://claude.ai/artifact/6x5SDzaVhc7gdNyLBYreJE
- CV PDFs: `cv/Jan_Kopecky_CV.pdf`, `cv/Jan_Kopecky_CV_CZ.pdf` in the repo (copy to `public/cv/` at build or by hand)
- Photo: `cv/jan-kopecky-1024.jpg` (copy to `public/jan-kopecky.jpg`)
