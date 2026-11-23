/**
 * Loads data/index.json once per server instance.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { RawChunk } from "./documents";

export type IndexChunk = RawChunk & { id: string; embedding: number[] };

export type IndexFile = {
  model: string;
  dimensions: number;
  builtAt: string;
  chunks: IndexChunk[];
};

let cached: IndexFile | null = null;

export function loadIndex(): IndexFile {
  if (!cached) {
    const file = path.join(process.cwd(), "data", "index.json");
    cached = JSON.parse(readFileSync(file, "utf8")) as IndexFile;
  }
  return cached;
}
