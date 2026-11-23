/**
 * Embeddings, computed locally with multilingual-e5-small (transformers.js, ONNX on CPU).
 * No API key and no per-request cost. Switching provider happens only in this file.
 *
 * e5 expects a "passage: " prefix for documents and a "query: " prefix for questions.
 * Vectors are mean-pooled and L2-normalised, so cosine similarity is a dot product.
 */
import type { FeatureExtractionPipeline } from "@huggingface/transformers";
import path from "node:path";

export const EMBED_MODEL = "Xenova/multilingual-e5-small";
export const EMBED_DIMENSIONS = 384;

let extractor: Promise<FeatureExtractionPipeline> | null = null;

function load(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.cacheDir = process.env.EMBED_CACHE_DIR ?? path.join(process.cwd(), ".cache", "models");
      // In production the model is baked into the image; never download at request time.
      env.allowRemoteModels = process.env.EMBED_ALLOW_DOWNLOAD !== "false";
      return pipeline("feature-extraction", EMBED_MODEL, { dtype: "q8" });
    })();
    extractor.catch(() => {
      extractor = null;
    });
  }
  return extractor;
}

async function embed(texts: string[]): Promise<number[][]> {
  const run = await load();
  const output = await run(texts, { pooling: "mean", normalize: true });
  return output.tolist() as number[][];
}

export async function embedPassages(texts: string[]): Promise<number[][]> {
  return embed(texts.map((t) => `passage: ${t}`));
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embed([`query: ${text}`]);
  if (!vector) throw new Error("embedding failed");
  return vector;
}

/** Loads the model ahead of the first question (called once at server start). */
export function warmUp(): Promise<unknown> {
  return load();
}
