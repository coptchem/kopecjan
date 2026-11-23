/**
 * Browser side of /api/ask: solves the proof-of-work challenge and reads the SSE stream.
 * The ALTCHA solver is loaded on demand, so it does not weigh on the first page load.
 */
import type { Source } from "./reducer";

export type AskEvent =
  | { type: "token"; text: string }
  | { type: "sources"; items: Source[] }
  | { type: "fallback" }
  | { type: "done" }
  | { type: "error"; code: string };

export type AskResult =
  | { kind: "stream" }
  | { kind: "limited"; daily: boolean; retryAfterSeconds: number }
  | { kind: "invalid" }
  | { kind: "error" };

type Proof = { challenge: unknown; solution: unknown };

let pending: Promise<Proof | null> | null = null;

async function solve(signal?: AbortSignal): Promise<Proof | null> {
  const [{ solveChallenge }, { deriveKey }] = await Promise.all([
    import("altcha-lib"),
    import("altcha-lib/algorithms/web/sha"),
  ]);
  const res = await fetch("/api/challenge", { cache: "no-store", signal });
  if (!res.ok) return null;
  const challenge = await res.json();
  const controller = new AbortController();
  signal?.addEventListener("abort", () => controller.abort());
  const solution = await solveChallenge({ challenge, deriveKey, controller, timeout: 30_000 });
  return solution ? { challenge, solution } : null;
}

/** Starts solving the next challenge in the background (on focus or after an answer). */
export function prepareProof(): void {
  if (!pending) {
    pending = solve().catch(() => null);
  }
}

async function takeProof(signal: AbortSignal): Promise<Proof | null> {
  const proof = pending ? await pending : await solve(signal).catch(() => null);
  pending = null;
  return proof;
}

export async function ask(
  question: string,
  locale: string,
  website: string,
  signal: AbortSignal,
  onEvent: (event: AskEvent) => void,
  onQuota: (limit: number, remaining: number) => void,
): Promise<AskResult> {
  const proof = await takeProof(signal);
  if (!proof) return { kind: "error" };

  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, locale, website, proof }),
    signal,
  });

  const limit = Number(res.headers.get("X-RateLimit-Limit"));
  const remaining = Number(res.headers.get("X-RateLimit-Remaining"));
  if (
    res.headers.has("X-RateLimit-Limit") &&
    Number.isFinite(limit) &&
    Number.isFinite(remaining)
  ) {
    onQuota(limit, remaining);
  }

  if (res.status === 429 || res.status === 503) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      retryAfterSeconds?: number;
    };
    const retry = Number(body.retryAfterSeconds ?? res.headers.get("Retry-After") ?? 3600);
    return { kind: "limited", daily: body.error === "daily_cap", retryAfterSeconds: retry };
  }
  if (res.status === 400) return { kind: "invalid" };
  if (!res.ok || !res.body) return { kind: "error" };

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        try {
          onEvent(JSON.parse(line.slice(5).trim()) as AskEvent);
        } catch {
          // ignore a malformed frame
        }
      }
    }
  }
  return { kind: "stream" };
}
