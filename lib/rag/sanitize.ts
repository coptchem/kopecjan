/**
 * Input guardrails for /api/ask (docs/04-rag-spec.md, Guardrails).
 */
export const MAX_QUESTION_CHARS = 500;

/** Control characters, zero-width and bidi formatting characters. */
const INVISIBLE = new RegExp(
  "[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]",
  "g",
);

export type SanitizeResult = { ok: true; question: string } | { ok: false };

export function sanitizeQuestion(input: unknown): SanitizeResult {
  if (typeof input !== "string") return { ok: false };
  const question = input.replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
  if (!question || question.length > MAX_QUESTION_CHARS) return { ok: false };

  // Cheap junk filter: more than 20 % characters that are neither letters, digits nor spaces.
  const other = question.replace(/[\p{L}\p{N}\s]/gu, "").length;
  if (other / question.length > 0.2) return { ok: false };
  if (!/\p{L}/u.test(question)) return { ok: false };

  return { ok: true, question };
}
