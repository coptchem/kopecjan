/**
 * Downloads the embedding model into EMBED_CACHE_DIR and embeds one test query.
 * Used by the Dockerfile so the running container never downloads anything.
 *
 * Usage: EMBED_CACHE_DIR=/app/models tsx scripts/fetch-model.ts
 */
import { EMBED_DIMENSIONS, embedQuery } from "../lib/rag/embed";

async function main() {
  const vector = await embedQuery("What did Jan do at MSD?");
  if (vector.length !== EMBED_DIMENSIONS) {
    throw new Error(`expected ${EMBED_DIMENSIONS} dimensions, got ${vector.length}`);
  }
  console.log(`fetch-model: OK (${vector.length} dimensions)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
