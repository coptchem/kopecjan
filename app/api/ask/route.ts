/**
 * POST /api/ask: the "Ask about Jan" assistant (docs/04-rag-spec.md, API contract).
 *
 * Order of checks: body and question, bot protection, rate limit, retrieval, threshold
 * fallback (no model call), then Claude streamed back as server-sent events.
 */
import { isSameOrigin, verifyProof } from "@/lib/bot-guard";
import { answer, isConfigured, type AnswerOutcome } from "@/lib/rag/answer";
import { embedQuery } from "@/lib/rag/embed";
import { loadIndex } from "@/lib/rag/index";
import { sanitizeQuestion } from "@/lib/rag/sanitize";
import { search, selectContext, type Hit } from "@/lib/rag/retrieve";
import { askLimiter, clientIp, type LimitResult } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 8 * 1024;

type Source = { title: string; url: string | null };
type Event =
  | { type: "token"; text: string }
  | { type: "sources"; items: Source[] }
  | { type: "fallback" }
  | { type: "done" }
  | { type: "error"; code: "upstream" | "timeout" | "unavailable" };

function json(status: number, body: unknown, limit?: LimitResult, extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "no-store");
  if (limit) {
    headers.set("X-RateLimit-Limit", String(limit.limit));
    headers.set("X-RateLimit-Remaining", String(limit.remaining));
  }
  return Response.json(body, { status, headers });
}

function sourcesFrom(hits: Hit[], numbers: number[] | null): Source[] {
  const picked = numbers?.length
    ? numbers.map((n) => hits[n - 1]).filter((h): h is Hit => Boolean(h))
    : hits.slice(0, 3);
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const h of picked) {
    if (seen.has(h.chunk.slug)) continue;
    seen.add(h.chunk.slug);
    out.push({ title: h.chunk.title, url: h.chunk.url ?? null });
  }
  return out;
}

function log(entry: Record<string, unknown>) {
  console.log(JSON.stringify({ at: new Date().toISOString(), route: "ask", ...entry }));
}

export async function POST(request: Request) {
  const started = Date.now();

  // 1. Origin, size and shape of the request
  if (!isSameOrigin(request.headers, site.url)) {
    log({ outcome: "forbidden_origin" });
    return json(403, { error: "forbidden" });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return json(413, { error: "too_large" });

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json(413, { error: "too_large" });
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json(400, { error: "invalid_question" });
  }

  const sanitized = sanitizeQuestion(body.question);
  if (!sanitized.ok) return json(400, { error: "invalid_question" });
  const locale = body.locale === "cs" ? "cs" : "en";

  // 2. Bot protection: honeypot and proof of work
  if (typeof body.website === "string" && body.website.trim() !== "") {
    log({ outcome: "honeypot" });
    return json(403, { error: "forbidden" });
  }
  if (!(await verifyProof(body.proof))) {
    log({ outcome: "bad_proof" });
    return json(403, { error: "invalid_proof" });
  }

  // 3. Rate limit
  const key = askLimiter.key(clientIp(request.headers));
  const limit = askLimiter.limit(key);
  if (!limit.allowed) {
    log({ outcome: limit.reason === "daily" ? "daily_cap" : "rate_limited" });
    if (limit.reason === "daily") {
      return json(503, { error: "daily_cap", retryAfterSeconds: limit.retryAfterSeconds }, limit, {
        "Retry-After": String(limit.retryAfterSeconds),
      });
    }
    return json(429, { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds }, limit, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  // 4. Retrieval
  let hits: Hit[];
  let topScore = 0;
  try {
    const all = search(await embedQuery(sanitized.question), loadIndex().chunks);
    topScore = all[0]?.similarity ?? 0;
    hits = selectContext(all);
  } catch (err) {
    console.error("[ask] retrieval failed", err);
    askLimiter.refund(key);
    return json(500, { error: "internal" }, limit);
  }

  const encoder = new TextEncoder();
  const headers = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    "X-Accel-Buffering": "no",
    "X-RateLimit-Limit": String(limit.limit),
    "X-RateLimit-Remaining": String(limit.remaining),
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: Event) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };
      const finish = () => {
        if (closed) return;
        closed = true;
        controller.close();
      };

      // 5. Below the threshold (or no key configured): fallback without calling the model
      if (!hits.length || !isConfigured()) {
        send({ type: "fallback" });
        send({ type: "done" });
        finish();
        log({
          locale,
          topScore,
          chunks: 0,
          outcome: hits.length ? "unconfigured" : "below_threshold",
          ms: Date.now() - started,
        });
        return;
      }

      // 6. Claude
      let outcome: AnswerOutcome;
      try {
        outcome = await answer(
          sanitized.question,
          hits,
          (text) => send({ type: "token", text }),
          request.signal,
        );
      } catch {
        log({
          locale,
          topScore,
          chunks: hits.length,
          outcome: "aborted",
          ms: Date.now() - started,
        });
        finish();
        return;
      }

      if (outcome.kind === "answer") {
        send({ type: "sources", items: sourcesFrom(hits, outcome.sources) });
        send({ type: "done" });
      } else if (outcome.kind === "fallback" || outcome.code === "unavailable") {
        send({ type: "fallback" });
        send({ type: "done" });
      } else {
        send({ type: "error", code: outcome.code });
      }
      finish();

      log({
        locale,
        topScore: Number(topScore.toFixed(3)),
        chunks: hits.length,
        outcome: outcome.kind === "error" ? `error_${outcome.code}` : outcome.kind,
        ...(outcome.kind !== "error" && {
          inputTokens: outcome.inputTokens,
          outputTokens: outcome.outputTokens,
          cachedTokens: outcome.cachedTokens,
        }),
        ms: Date.now() - started,
        ...(process.env.NODE_ENV !== "production" && { question: sanitized.question }),
      });
    },
  });

  return new Response(stream, { headers });
}
