/**
 * Feature flags. Public flags are inlined at build time.
 * The chat stays inactive (placeholder panel) until the RAG milestone ships.
 */
export const features = {
  chatEnabled: process.env.NEXT_PUBLIC_CHAT_ENABLED === "true",
} as const;
