/**
 * Calls Claude with the retrieved sources and streams the answer (docs/04-rag-spec.md).
 * Server only: this is the one module that reads ANTHROPIC_API_KEY.
 */
import Anthropic from "@anthropic-ai/sdk";
import { AnswerStream } from "./parse";
import { formatSources, RULES, userMessage } from "./prompt";
import type { Hit } from "./retrieve";

export const MAX_OUTPUT_TOKENS = 350;
const TIMEOUT_MS = 25_000;

export type AnswerOutcome =
  | {
      kind: "answer";
      sources: number[] | null;
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
    }
  | { kind: "fallback"; inputTokens: number; outputTokens: number; cachedTokens: number }
  /** unavailable: no credit, bad key or a refusal; the visitor gets the fallback with the e-mail */
  | { kind: "error"; code: "upstream" | "timeout" | "unavailable" };

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ maxRetries: 1, timeout: TIMEOUT_MS });
  return client;
}

export function isConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function answer(
  question: string,
  hits: Hit[],
  onText: (text: string) => void,
  signal: AbortSignal,
): Promise<AnswerOutcome> {
  const parser = new AnswerStream(onText);
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = AbortSignal.any([signal, timeout]);

  try {
    const stream = getClient().messages.stream(
      {
        model: process.env.RAG_MODEL || "claude-haiku-5-5",
        max_tokens: MAX_OUTPUT_TOKENS,
        // Short factual answers from given sources: no thinking, so all 350 tokens go to the answer.
        thinking: { type: "disabled" },
        output_config: { effort: "low" },
        system: [
          { type: "text", text: RULES, cache_control: { type: "ephemeral" } },
          { type: "text", text: formatSources(hits) },
        ],
        messages: [{ role: "user", content: userMessage(question) }],
      },
      { signal: combined },
    );
    stream.on("text", (delta) => parser.push(delta));
    const message = await stream.finalMessage();

    const usage = {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      cachedTokens: message.usage.cache_read_input_tokens ?? 0,
    };
    if (message.stop_reason === "refusal") return { kind: "error", code: "unavailable" };
    const result = parser.end();
    if (result.kind === "fallback") return { kind: "fallback", ...usage };
    return { kind: "answer", sources: result.sources, ...usage };
  } catch (err) {
    if (timeout.aborted) return { kind: "error", code: "timeout" };
    if (signal.aborted) throw err;
    if (
      err instanceof Anthropic.AuthenticationError ||
      err instanceof Anthropic.PermissionDeniedError ||
      (err instanceof Anthropic.APIError && err.status === 402)
    ) {
      console.error(`[ask] claude unavailable: ${err.status} ${err.message}`);
      return { kind: "error", code: "unavailable" };
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`[ask] claude error: ${err.status ?? "network"} ${err.message}`);
    } else {
      console.error("[ask] claude error", err);
    }
    return { kind: "error", code: "upstream" };
  }
}
