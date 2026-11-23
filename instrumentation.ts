/**
 * Runs once when the Next.js server starts. Loads the embedding model ahead of the first
 * question when the assistant is switched on, so the first visitor does not wait for it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PUBLIC_CHAT_ENABLED !== "true") return;
  if (process.platform === "win32") return; // see scripts/index-docker.sh
  const { warmUp } = await import("./lib/rag/embed");
  warmUp().catch((err) => console.error("[embed] warm-up failed", err));
}
