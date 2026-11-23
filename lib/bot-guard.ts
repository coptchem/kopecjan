/**
 * Bot protection for /api/ask, in front of the rate limit:
 *
 * 1. same-origin check (Origin / Sec-Fetch-Site), so other sites cannot post to the API
 * 2. honeypot field that people never fill in
 * 3. proof of work (ALTCHA, self-hosted, no cookies, no third party): /api/challenge hands out
 *    a signed SHA-256 challenge, the browser solves it in about half a second, and every
 *    solution can be used once within 5 minutes
 */
import { createChallenge, verifySolution, type Challenge, type Solution } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/sha";
import { randomBytes } from "node:crypto";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MIN_COUNTER = 20_000;
const MAX_COUNTER = 100_000;

function secrets(): { signature: string; key: string } {
  const base = process.env.ALTCHA_HMAC_KEY;
  if (base) return { signature: `${base}:challenge`, key: `${base}:key` };
  // Without a configured key (local dev), use a per-process random one.
  const g = globalThis as unknown as { __altchaKey?: string };
  g.__altchaKey ??= randomBytes(32).toString("hex");
  return { signature: `${g.__altchaKey}:challenge`, key: `${g.__altchaKey}:key` };
}

export async function newChallenge(): Promise<Challenge> {
  const { signature, key } = secrets();
  const counter = MIN_COUNTER + Math.floor(Math.random() * (MAX_COUNTER - MIN_COUNTER));
  return createChallenge({
    algorithm: "SHA-256",
    cost: 1,
    counter,
    deriveKey,
    hmacSignatureSecret: signature,
    hmacKeySignatureSecret: key,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
  });
}

export type ProofPayload = { challenge: Challenge; solution: Solution };

/** Signatures of solutions already used, kept until their challenge expires. */
const used = new Map<string, number>();

function sweep(now: number) {
  for (const [sig, expires] of used) if (expires < now) used.delete(sig);
}

export async function verifyProof(payload: unknown): Promise<boolean> {
  if (!payload || typeof payload !== "object") return false;
  const { challenge, solution } = payload as Partial<ProofPayload>;
  if (!challenge?.signature || !challenge.parameters || !solution) return false;
  if (challenge.parameters.algorithm !== "SHA-256") return false;

  const now = Date.now();
  sweep(now);
  if (used.has(challenge.signature)) return false;

  const { signature, key } = secrets();
  try {
    const result = await verifySolution({
      challenge,
      solution,
      deriveKey,
      hmacSignatureSecret: signature,
      hmacKeySignatureSecret: key,
    });
    if (!result.verified) return false;
  } catch {
    return false;
  }
  const expiresAt = (challenge.parameters.expiresAt ?? 0) * 1000 || now + CHALLENGE_TTL_MS;
  used.set(challenge.signature, expiresAt);
  return true;
}

/**
 * Accepts requests from the site itself only. Browsers send Sec-Fetch-Site and Origin on POST;
 * a request without both (curl, scripts) is rejected.
 */
export function isSameOrigin(headers: Headers, siteUrl: string): boolean {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  const origin = headers.get("origin");
  if (!origin) return false;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  try {
    const o = new URL(origin);
    if (o.origin === new URL(siteUrl).origin) return true;
    return !!host && o.host === host;
  } catch {
    return false;
  }
}
