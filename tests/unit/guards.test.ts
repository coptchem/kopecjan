import { solveChallenge } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/sha";
import { describe, expect, it } from "vitest";
import { isSameOrigin, newChallenge, verifyProof } from "@/lib/bot-guard";
import { clientIp, RateLimiter } from "@/lib/rate-limit";

describe("RateLimiter", () => {
  it("allows 10 questions per hour per client, then reports when to retry", () => {
    let now = Date.UTC(2026, 10, 23, 10, 0, 0);
    const rl = new RateLimiter(10, 500, () => now);
    const key = rl.key("1.2.3.4");
    for (let i = 0; i < 10; i++) {
      expect(rl.limit(key).allowed).toBe(true);
      now += 60_000;
    }
    const blocked = rl.limit(key);
    expect(blocked).toMatchObject({ allowed: false, reason: "client", remaining: 0 });
    expect(blocked.retryAfterSeconds).toBe(50 * 60);

    now += 50 * 60_000 + 1000; // the first question leaves the window
    expect(rl.limit(key)).toMatchObject({ allowed: true, remaining: 0 });
    expect(rl.limit(rl.key("5.6.7.8")).allowed).toBe(true);
  });

  it("enforces the global daily cap and resets it at midnight UTC", () => {
    let now = Date.UTC(2026, 10, 23, 23, 0, 0);
    const rl = new RateLimiter(10, 3, () => now);
    for (let i = 0; i < 3; i++) expect(rl.limit(rl.key(`10.0.0.${i}`)).allowed).toBe(true);
    const capped = rl.limit(rl.key("10.0.0.9"));
    expect(capped).toMatchObject({ allowed: false, reason: "daily" });
    expect(capped.retryAfterSeconds).toBe(3600);

    now = Date.UTC(2026, 10, 24, 0, 0, 1);
    expect(rl.limit(rl.key("10.0.0.9")).allowed).toBe(true);
  });

  it("never stores the raw IP and gives a question back on refund", () => {
    const rl = new RateLimiter(2, 500);
    const key = rl.key("192.168.1.10");
    expect(key).not.toContain("192");
    rl.limit(key);
    rl.refund(key);
    expect(rl.peek(key).remaining).toBe(2);
  });

  it("takes the first X-Forwarded-For address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "8.8.8.8, 10.0.0.1" }))).toBe("8.8.8.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("proof of work", () => {
  it("accepts a solved challenge once and rejects replays and tampering", async () => {
    const challenge = await newChallenge();
    const solution = await solveChallenge({ challenge, deriveKey });
    expect(solution).not.toBeNull();

    const forgedKey = solution!.derivedKey.replace(/.$/, (c) => (c === "0" ? "1" : "0"));
    const tampered = { challenge, solution: { ...solution!, derivedKey: forgedKey } };
    expect(await verifyProof(tampered)).toBe(false);

    expect(await verifyProof({ challenge, solution })).toBe(true);
    expect(await verifyProof({ challenge, solution })).toBe(false);
    expect(await verifyProof(null)).toBe(false);
    expect(await verifyProof({ challenge: { parameters: challenge.parameters }, solution })).toBe(
      false,
    );
  }, 30_000);
});

describe("isSameOrigin", () => {
  const site = "https://kopecjan.cz";
  it("accepts the site itself", () => {
    const h = new Headers({ origin: "https://kopecjan.cz", "sec-fetch-site": "same-origin" });
    expect(isSameOrigin(h, site)).toBe(true);
    expect(
      isSameOrigin(new Headers({ origin: "http://localhost:3100", host: "localhost:3100" }), site),
    ).toBe(true);
  });

  it("rejects other sites and requests without an Origin", () => {
    expect(isSameOrigin(new Headers({ origin: "https://evil.example" }), site)).toBe(false);
    expect(isSameOrigin(new Headers({ origin: site, "sec-fetch-site": "cross-site" }), site)).toBe(
      false,
    );
    expect(isSameOrigin(new Headers(), site)).toBe(false);
  });
});
