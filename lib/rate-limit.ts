/**
 * Rate limits for /api/ask (docs/04-rag-spec.md, Rate limiting and cost).
 *
 * - per client: sliding window of RATE_LIMIT_PER_HOUR questions (default 10), keyed by
 *   sha256(ip + daily salt), so raw IP addresses are never stored
 * - global: DAILY_CAP questions per UTC day (default 500)
 *
 * State lives in process memory: the site runs as a single container. If it ever runs on more
 * than one instance, put Redis behind the same `limit()` interface.
 */
import { createHash, randomBytes } from "node:crypto";

export type LimitResult = {
  allowed: boolean;
  /** "client" = per-IP window, "daily" = global cap */
  reason?: "client" | "daily";
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

const HOUR_MS = 60 * 60 * 1000;

function envInt(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isInteger(v) && v > 0 ? v : fallback;
}

export class RateLimiter {
  private windows = new Map<string, number[]>();
  private day = "";
  private dayCount = 0;
  private salt = "";

  constructor(
    private readonly perHour = envInt("RATE_LIMIT_PER_HOUR", 10),
    private readonly dailyCap = envInt("DAILY_CAP", 500),
    private readonly now: () => number = Date.now,
  ) {}

  /** Hashes the client IP with a salt that rotates every UTC day. */
  key(ip: string): string {
    this.rollDay();
    return createHash("sha256").update(`${this.salt}:${ip}`).digest("hex").slice(0, 32);
  }

  /** Reads the state without counting a question (for the counter shown in the chat). */
  peek(key: string): LimitResult {
    this.rollDay();
    const hits = this.recent(key);
    return this.result(true, hits);
  }

  /** Counts one question if allowed. */
  limit(key: string): LimitResult {
    this.rollDay();
    const hits = this.recent(key);
    if (hits.length >= this.perHour) {
      const oldest = hits[0] ?? this.now();
      return {
        ...this.result(false, hits),
        reason: "client",
        retryAfterSeconds: Math.max(1, Math.ceil((oldest + HOUR_MS - this.now()) / 1000)),
      };
    }
    if (this.dayCount >= this.dailyCap) {
      const tomorrow = new Date(this.now());
      tomorrow.setUTCHours(24, 0, 0, 0);
      return {
        ...this.result(false, hits),
        reason: "daily",
        retryAfterSeconds: Math.ceil((tomorrow.getTime() - this.now()) / 1000),
      };
    }
    hits.push(this.now());
    this.windows.set(key, hits);
    this.dayCount++;
    return this.result(true, hits);
  }

  /** Gives a question back, for requests that failed before reaching the model. */
  refund(key: string): void {
    const hits = this.windows.get(key);
    if (hits?.length) hits.pop();
    if (this.dayCount > 0) this.dayCount--;
  }

  private result(allowed: boolean, hits: number[]): LimitResult {
    return {
      allowed,
      limit: this.perHour,
      remaining: Math.max(0, this.perHour - hits.length),
      retryAfterSeconds: 0,
    };
  }

  private recent(key: string): number[] {
    const cutoff = this.now() - HOUR_MS;
    const hits = (this.windows.get(key) ?? []).filter((t) => t > cutoff);
    if (hits.length) this.windows.set(key, hits);
    else this.windows.delete(key);
    return hits;
  }

  private rollDay(): void {
    const day = new Date(this.now()).toISOString().slice(0, 10);
    if (day !== this.day) {
      this.day = day;
      this.dayCount = 0;
      this.salt = randomBytes(16).toString("hex");
      // Keys from yesterday were hashed with the old salt and can no longer match.
      this.windows.clear();
    }
  }
}

const globalForLimiter = globalThis as unknown as { __askLimiter?: RateLimiter };
export const askLimiter = (globalForLimiter.__askLimiter ??= new RateLimiter());

/**
 * Rate-limit identity of the client: the first address in X-Forwarded-For (Caddy overwrites the
 * header with the real peer, so it cannot be spoofed). IPv6 addresses are reduced to their /64
 * prefix, because one visitor usually controls a whole /64 and could rotate through it.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip")?.trim() || "unknown";
  return ip.includes(":") ? ipv6Prefix64(ip) : ip;
}

export function ipv6Prefix64(ip: string): string {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapped) return mapped[1]!;
  const addr = ip
    .replace(/^\[|\]$/g, "")
    .split("%")[0]!
    .toLowerCase();
  const [head = "", tail = ""] = addr.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = addr.includes("::")
    ? [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right]
    : left;
  return `${groups
    .slice(0, 4)
    .map((g) => (parseInt(g, 16) || 0).toString(16))
    .join(":")}::/64`;
}
