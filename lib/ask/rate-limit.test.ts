import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter, hashIp } from "./rate-limit";

const MIN = 60_000;
const T0 = Date.UTC(2026, 8, 28, 1, 42); // 7:12 AM IST

function clock(start = T0) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("TC-043 · rate limit and daily cap", () => {
  it("allows 5 requests a minute per IP and limits the 6th with retryAfterS", () => {
    const c = clock();
    const rl = createRateLimiter({ now: c.now });
    for (let i = 0; i < 5; i++) expect(rl.take("1.1.1.1")).toEqual({ ok: true });
    const sixth = rl.take("1.1.1.1");
    expect(sixth).toMatchObject({ ok: false, outcome: "rate_limited" });
    expect(sixth.ok === false && sixth.retryAfterS).toBe(12);
    expect(rl.take("2.2.2.2")).toEqual({ ok: true });
  });

  it("refills one token every 12 s", () => {
    const c = clock();
    const rl = createRateLimiter({ now: c.now });
    for (let i = 0; i < 5; i++) rl.take("ip");
    c.advance(11_000);
    expect(rl.take("ip").ok).toBe(false);
    c.advance(1_000);
    expect(rl.take("ip").ok).toBe(true);
    expect(rl.take("ip").ok).toBe(false);
  });

  it("caps one IP at 40 a day, until IST midnight", () => {
    const c = clock();
    const rl = createRateLimiter({ now: c.now });
    for (let i = 0; i < 40; i++) {
      expect(rl.take("ip").ok, `request ${i + 1}`).toBe(true);
      c.advance(MIN / 5);
    }
    c.advance(10 * MIN);
    const r = rl.take("ip");
    expect(r).toMatchObject({ ok: false, outcome: "rate_limited" });
    // 7:12 AM + 8 min of requests + 10 min → 7:30 AM IST; midnight is 16.5 h away.
    expect(r.ok === false && r.retryAfterS).toBe(16.5 * 3600);
    c.advance(16.5 * 3600 * 1000);
    expect(rl.take("ip").ok).toBe(true);
  });

  it("caps everyone at 300 a day", () => {
    const c = clock();
    const rl = createRateLimiter({ now: c.now });
    for (let i = 0; i < 300; i++) expect(rl.take(`10.0.${Math.floor(i / 5)}.${i % 5}`).ok).toBe(true);
    expect(rl.take("fresh-ip")).toMatchObject({ ok: false, outcome: "cap" });
  });

  it("a refused request does not spend quota", () => {
    const c = clock();
    const rl = createRateLimiter({ now: c.now, perMinute: 1, perIpPerDay: 2, globalPerDay: 100 });
    expect(rl.take("ip").ok).toBe(true);
    expect(rl.take("ip").ok).toBe(false);
    c.advance(MIN);
    expect(rl.take("ip").ok).toBe(true);
    c.advance(MIN);
    expect(rl.take("ip").ok).toBe(false);
  });
});

describe("client IP", () => {
  it("takes the first x-forwarded-for hop, then x-real-ip", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": " 203.0.113.9 , 10.0.0.1" }))).toBe("203.0.113.9");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("hashes it with SHA-256 for logs", () => {
    expect(hashIp("203.0.113.9")).toMatch(/^[0-9a-f]{16}$/);
    expect(hashIp("203.0.113.9")).not.toContain("203");
    expect(hashIp("203.0.113.9")).toBe(hashIp("203.0.113.9"));
  });
});

describe("fix round 1 · bucket eviction", () => {
  it("past maxTrackedIps, drops only buckets that have refilled completely", () => {
    const c = clock();
    const rl = createRateLimiter({ now: c.now, maxTrackedIps: 2 });
    rl.take("a");
    rl.take("b");
    expect(rl.trackedIps()).toBe(2);
    rl.take("c"); // a and b are still refilling: nothing to drop
    expect(rl.trackedIps()).toBe(3);
    c.advance(60_000); // everyone full again
    rl.take("d");
    expect(rl.trackedIps()).toBe(1);
    // An evicted IP starts from a full bucket, and its daily count is kept.
    for (let i = 0; i < 5; i++) expect(rl.take("a").ok).toBe(true);
    expect(rl.take("a").ok).toBe(false);
  });
});
