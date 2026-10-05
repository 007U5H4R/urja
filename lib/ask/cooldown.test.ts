/**
 * Stage 9 unit G · model cooldowns (EXE31): don't spend Gemini calls that
 * can't succeed. A 429 benches a model for its Retry-After (60 s without a
 * hint, at most 10 min); a 404 benches it for a long TTL.
 */
import { describe, expect, it } from "vitest";
import { createModelCooldowns, parseRetryAfterMs, parseRetryDelayMs } from "./cooldown";

function clock(start = 5_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("createModelCooldowns", () => {
  it("a 429 with a hint benches the model for exactly that long", () => {
    const c = clock();
    const cd = createModelCooldowns({ now: c.now });
    expect(cd.blocked("gemini-3.5-flash")).toBe(false);
    cd.busy("gemini-3.5-flash", 30_000);
    expect(cd.blocked("gemini-3.5-flash")).toBe(true);
    expect(cd.blocked("Gemini-3.5-Flash")).toBe(true);
    expect(cd.blocked("gemini-2.5-flash")).toBe(false);
    c.advance(29_999);
    expect(cd.blocked("gemini-3.5-flash")).toBe(true);
    c.advance(1);
    expect(cd.blocked("gemini-3.5-flash")).toBe(false);
  });

  it("defaults to 60 s without a hint, and caps a hint at 10 min", () => {
    const c = clock();
    const cd = createModelCooldowns({ now: c.now });
    cd.busy("a");
    cd.busy("b", 3_600_000);
    c.advance(60_000);
    expect(cd.blocked("a")).toBe(false);
    expect(cd.blocked("b")).toBe(true);
    c.advance(9 * 60_000);
    expect(cd.blocked("b")).toBe(false);
  });

  it("a later, shorter 429 never shortens a running cooldown", () => {
    const c = clock();
    const cd = createModelCooldowns({ now: c.now });
    cd.busy("a", 120_000);
    cd.busy("a", 1_000);
    c.advance(60_000);
    expect(cd.blocked("a")).toBe(true);
  });

  it("a 404 marks the model unavailable for 6 h", () => {
    const c = clock();
    const cd = createModelCooldowns({ now: c.now });
    cd.unavailable("gemini-2.5-flash");
    c.advance(6 * 3_600_000 - 1);
    expect(cd.blocked("gemini-2.5-flash")).toBe(true);
    c.advance(1);
    expect(cd.blocked("gemini-2.5-flash")).toBe(false);
  });

  it("unavailable() takes a shorter bench when given one (the primary's 404 is capped at 10 min)", () => {
    const c = clock();
    const cd = createModelCooldowns({ now: c.now });
    cd.unavailable("gemini-3.5-flash", 10 * 60_000);
    c.advance(10 * 60_000 - 1);
    expect(cd.blocked("gemini-3.5-flash")).toBe(true);
    c.advance(1);
    expect(cd.blocked("gemini-3.5-flash")).toBe(false);
  });

  it("Retry-After: 0 benches for 1 s, not the 60 s default", () => {
    const c = clock();
    const cd = createModelCooldowns({ now: c.now });
    cd.busy("a", 0);
    expect(cd.blocked("a")).toBe(true);
    c.advance(1_000);
    expect(cd.blocked("a")).toBe(false);
    expect(parseRetryAfterMs("0", 0)).toBe(0);
  });

  it("clear() lifts every cooldown", () => {
    const cd = createModelCooldowns({ now: () => 0 });
    cd.unavailable("a");
    cd.clear();
    expect(cd.blocked("a")).toBe(false);
  });
});

describe("parsing Gemini's retry hints", () => {
  it("reads Retry-After in seconds or as an HTTP date", () => {
    const now = Date.UTC(2026, 8, 28, 1, 42);
    expect(parseRetryAfterMs("37", now)).toBe(37_000);
    expect(parseRetryAfterMs(new Date(now + 90_000).toUTCString(), now)).toBe(90_000);
    expect(parseRetryAfterMs(null, now)).toBeUndefined();
    expect(parseRetryAfterMs("soon", now)).toBeUndefined();
    expect(parseRetryAfterMs("-5", now)).toBeUndefined();
  });

  it("reads google.rpc.RetryInfo retryDelay from the error body", () => {
    const body = JSON.stringify({
      error: {
        code: 429,
        status: "RESOURCE_EXHAUSTED",
        details: [
          { "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [] },
          { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "41s" },
        ],
      },
    });
    expect(parseRetryDelayMs(body)).toBe(41_000);
    expect(parseRetryDelayMs(JSON.stringify({ error: { details: [{ retryDelay: "1.5s" }] } }))).toBe(1_500);
    expect(parseRetryDelayMs("not json")).toBeUndefined();
    expect(parseRetryDelayMs(JSON.stringify({ error: { details: [] } }))).toBeUndefined();
    expect(parseRetryDelayMs(JSON.stringify({ error: { details: [{ retryDelay: "abc" }] } }))).toBeUndefined();
  });
});
