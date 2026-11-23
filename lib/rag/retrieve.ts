/**
 * Brute-force cosine search over the in-memory index (docs/04-rag-spec.md, Retrieval).
 * Vectors are normalised, so cosine similarity is the dot product.
 */
import type { IndexChunk } from "./index";

export type Hit = { chunk: IndexChunk; score: number; similarity: number };

export const DEFAULT_K = 6;
export const MAX_PER_DOC = 3;
export const PRIORITY_BOOST = 0.01;
/**
 * Tuned for multilingual-e5-small on tests/rag/questions.json: answerable questions score
 * 0.787 and up, clearly off-topic ones 0.781 and below (2026-11-23, CV only). Re-tune with
 * `pnpm test:rag --verbose` when content grows. Borderline questions that pass go to the
 * model, which answers NO_ANSWER when the sources do not cover them.
 */
export const DEFAULT_THRESHOLD = 0.784;

export function threshold(): number {
  const fromEnv = Number(process.env.RAG_SCORE_THRESHOLD);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_THRESHOLD;
}

export function dot(a: number[], b: number[]): number {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) sum += a[i]! * b[i]!;
  return sum;
}

export function search(
  query: number[],
  chunks: IndexChunk[],
  k = DEFAULT_K,
  maxPerDoc = MAX_PER_DOC,
): Hit[] {
  const scored = chunks
    .map((chunk) => {
      const similarity = dot(query, chunk.embedding);
      return { chunk, similarity, score: similarity + chunk.priority * PRIORITY_BOOST };
    })
    .sort((a, b) => b.score - a.score);

  const perDoc = new Map<string, number>();
  const hits: Hit[] = [];
  for (const hit of scored) {
    const count = perDoc.get(hit.chunk.slug) ?? 0;
    if (count >= maxPerDoc) continue;
    perDoc.set(hit.chunk.slug, count + 1);
    hits.push(hit);
    if (hits.length >= k) break;
  }
  return hits;
}

/**
 * Applies the threshold to the best raw similarity (without the priority boost) and trims
 * the hits to a context budget of roughly 2500 tokens.
 */
export function selectContext(hits: Hit[], min = threshold(), budgetTokens = 2500): Hit[] {
  const best = hits[0];
  if (!best || best.similarity < min) return [];
  const out: Hit[] = [];
  let used = 0;
  for (const hit of hits) {
    const cost = Math.ceil(hit.chunk.text.length / 4);
    if (out.length && used + cost > budgetTokens) break;
    out.push(hit);
    used += cost;
  }
  return out;
}
