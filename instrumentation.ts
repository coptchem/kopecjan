/**
 * Runs once when the Next.js server starts. Loads the embedding model ahead of the first
 * question when the assistant is switched on, so the first visitor does not wait for it.
 */
export async function register() {
  // Written as a direct NEXT_RUNTIME check so the edge build drops the Node-only import.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { warmUpIfEnabled } = await import("./lib/rag/warm");
    warmUpIfEnabled();
  }
}
