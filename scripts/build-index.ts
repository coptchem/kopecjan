/**
 * Builds data/index.json from content/**\/*.md (docs/04-rag-spec.md).
 *
 * - documents with `draft: true` are skipped (they still contain [TODO] markers)
 * - embeddings are cached by sha256 of the embedded text in data/.embed-cache.json,
 *   so a rebuild only embeds chunks that changed
 *
 * Usage: pnpm index
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { chunkDocument, embeddingText, parseDocument, type RawChunk } from "../lib/rag/documents";
import { EMBED_DIMENSIONS, EMBED_MODEL, embedPassages } from "../lib/rag/embed";
import type { IndexChunk, IndexFile } from "../lib/rag/index";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");
const DATA = join(ROOT, "data");
const INDEX = join(DATA, "index.json");
const CACHE = join(DATA, ".embed-cache.json");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith(".md")) out.push(full);
  }
  return out.sort();
}

const round = (v: number) => Math.round(v * 1e5) / 1e5;

async function main() {
  const files = walk(CONTENT);
  const included: RawChunk[] = [];
  const skipped: string[] = [];
  const slugs = new Set<string>();

  for (const file of files) {
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    const doc = parseDocument(readFileSync(file, "utf8"), rel);
    if (slugs.has(doc.slug)) throw new Error(`${rel}: duplicate slug "${doc.slug}"`);
    slugs.add(doc.slug);
    if (doc.draft) {
      skipped.push(rel);
      continue;
    }
    if (/\[TODO/i.test(doc.body)) {
      throw new Error(`${rel}: contains [TODO] but is not marked draft: true`);
    }
    included.push(...chunkDocument(doc));
  }

  const cache: Record<string, number[]> = existsSync(CACHE)
    ? JSON.parse(readFileSync(CACHE, "utf8"))
    : {};
  const keyOf = (text: string) =>
    createHash("sha256").update(`${EMBED_MODEL}\n${text}`).digest("hex");

  const texts = included.map(embeddingText);
  const missing = [...new Set(texts.filter((t) => !cache[keyOf(t)]))];
  if (missing.length) {
    console.log(`build-index: embedding ${missing.length} new chunk(s)`);
    for (let i = 0; i < missing.length; i += 16) {
      const batch = missing.slice(i, i + 16);
      const vectors = await embedPassages(batch);
      batch.forEach((t, j) => (cache[keyOf(t)] = vectors[j]!.map(round)));
    }
  }

  const chunks: IndexChunk[] = included.map((c, i) => ({
    id: `${c.slug}#${i}`,
    ...c,
    embedding: cache[keyOf(texts[i]!)]!,
  }));

  // Keep only cache entries still in use, so the committed cache does not grow forever.
  const used = new Set(texts.map(keyOf));
  const prunedCache = Object.fromEntries(Object.entries(cache).filter(([k]) => used.has(k)));

  const index: IndexFile = {
    model: EMBED_MODEL,
    dimensions: EMBED_DIMENSIONS,
    builtAt: new Date().toISOString(),
    chunks,
  };
  mkdirSync(DATA, { recursive: true });
  writeFileSync(INDEX, JSON.stringify(index) + "\n");
  writeFileSync(CACHE, JSON.stringify(prunedCache) + "\n");

  console.log(
    `build-index: ${chunks.length} chunk(s) from ${slugs.size - skipped.length} document(s), ${skipped.length} draft(s) skipped`,
  );
  for (const s of skipped) console.log(`  draft: ${s}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
