---
title: Pivo v akci (levne.pitpivo.cz)
slug: pivo-v-akci
lang: en
kind: project
url: https://levne.pitpivo.cz
priority: 1
draft: true
---

## What it is

Pivo v akci (https://levne.pitpivo.cz) tracks beer deals in Czech supermarket chains (Kaufland, Lidl, Penny, Albert, Billa, Tesco, Globus and COOP) and lists them from the cheapest, with the shop and how long the deal lasts. Visitors can filter by shop and brand, search, and sort by price per litre or per piece. It is a side project of Pit Pivo. The source code is public: https://github.com/coptchem/pivo-v-akci

[TODO: why you built it, since when, who uses it]

## What Jan built

- A Python scraper that runs every morning in GitHub Actions and saves the deals as JSON, with daily snapshots kept for comparison.
- One module per chain: Kaufland (server-rendered JSON), Lidl (JSON API), Billa (product discovery API), Tesco (GraphQL API), Globus (internal API for all 16 hypermarkets).
- Albert publishes image-only PDF leaflets: the pages are rendered and Claude Haiku reads the beer deals from them with structured JSON output. Results are cached per leaflet, so the API is called only for new leaflets.
- Deals limited to some stores carry an availability note.
- A static web page that loads the JSON, deployed over FTP from GitHub Actions.
- E-mail alerts: a small PHP API with SQLite handles double opt-in subscriptions and one-click unsubscribe; after each scrape new deals are matched to subscribers' chains and brands and sent over SMTP, at most once a day.

## Numbers

[TODO: optional, e.g. deals tracked per day, subscribers, cost of the Claude API per month]

## Hard parts and lessons

[TODO: 2 to 4 short paragraphs, e.g. chains without a usable source, leaflets as images, anti-bot protection]

## Typical questions

### Q: How does Pivo v akci get the prices?

A: Every morning a Python scraper in GitHub Actions reads the chains' own APIs and websites. For Albert, whose leaflets are only images, it renders the PDF pages and the Claude API extracts the beer deals as structured JSON, cached per leaflet.
