---
title: The kopecjan.cz assistant (Ask about Jan)
slug: ask-about-jan
lang: en
kind: project
url: /#ask
priority: 0
---

## What it is

Ask about Jan is the assistant on Jan's website kopecjan.cz. It answers questions about Jan's experience, skills and projects only from Jan's own documents and shows the sources it used. If the documents do not contain the answer, it says so and points to info@kopecjan.cz instead of guessing.

## How it works

The assistant uses retrieval augmented generation (RAG). Jan's documents are markdown files split into short chunks. Each chunk is turned into an embedding by a small multilingual model (multilingual-e5-small) that runs on the website's own server, so Czech questions also find English text. A question is embedded the same way and compared with every chunk by cosine similarity. When nothing is similar enough, the assistant replies with the fallback without calling a language model at all. Otherwise the best chunks go to Claude Haiku by Anthropic, which writes a short answer and names the sources it used.

## Stack

Next.js with the App Router and TypeScript, Tailwind CSS, next-intl for English and Czech, transformers.js for local embeddings, the Anthropic API with streaming responses, Docker and Caddy on a Hetzner server, Vitest and Playwright tests and GitHub Actions. There is no vector database: the index is a JSON file and the search runs in memory.

## Cost and abuse protection

Each visitor can ask 10 questions per hour and the whole site has a daily limit. Questions are limited to 500 characters and answers to a few sentences. Every question needs a small proof of work computed by the browser, which makes automated abuse expensive for bots and is invisible to people. Visitor IP addresses are kept only as a daily salted hash.

## Typical questions

### Q: How was this assistant built?

A: It is a small RAG pipeline: local multilingual embeddings, cosine search over a JSON index and Claude Haiku for the answer, all inside a Next.js app on Jan's own server.

### Q: Can the assistant make things up?

A: It is instructed to answer only from the retrieved documents and to say when it does not know. Answers can still contain mistakes, the CV is the source of truth.
