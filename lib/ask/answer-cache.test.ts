/**
 * Stage 9 unit G · the answer cache (EXE31): model answers only, keyed by the
 * normalised question, its copy language, PROMPT_VERSION and the dataset hash;
 * LRU-bounded, with a TTL on an injected clock.
 */
import { describe, expect, it } from "vitest";
import { cacheKey, createAnswerCache, normaliseQuestion } from "./answer-cache";

const HOUR = 3_600_000;

function clock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("normaliseQuestion", () => {
  it("trims, collapses whitespace, case-folds Latin and unifies Devanagari digits", () => {
    expect(normaliseQuestion("  Which TRUCK\n earns   least?  ")).toBe("which truck earns least?");
    expect(normaliseQuestion("ट्रक १२ ने कितना")).toBe(normaliseQuestion("ट्रक 12 ने  कितना"));
    expect(normaliseQuestion("RJ14 GB 4521")).toBe("rj14 gb 4521");
  });

  it("keeps distinct questions distinct", () => {
    expect(normaliseQuestion("diesel last week")).not.toBe(normaliseQuestion("diesel this week"));
  });
});

describe("cacheKey", () => {
  const base = { question: "Show every flag on the Behror stretch", lang: "en" as const, promptVersion: "ask-v2", datasetHash: "abc" };
  it("matches the same question asked with different spacing or case", () => {
    expect(cacheKey(base)).toBe(cacheKey({ ...base, question: "  show every FLAG on the behror   stretch " }));
  });
  it.each([
    ["language", { lang: "hi" as const }],
    ["prompt version", { promptVersion: "ask-v3" }],
    ["dataset hash", { datasetHash: "def" }],
  ])("differs by %s", (_label, change) => {
    expect(cacheKey(base)).not.toBe(cacheKey({ ...base, ...change }));
  });
});

describe("createAnswerCache", () => {
  it("returns what was stored, until the TTL (24 h by default) runs out", () => {
    const c = clock();
    const cache = createAnswerCache<string>({ now: c.now });
    cache.set("k", "v");
    c.advance(24 * HOUR - 1);
    expect(cache.get("k")).toBe("v");
    c.advance(1);
    expect(cache.get("k")).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it("evicts the least recently used entry past maxEntries (200 by default)", () => {
    const cache = createAnswerCache<number>({ now: () => 0 });
    for (let i = 0; i < 200; i++) cache.set(`k${i}`, i);
    expect(cache.get("k0")).toBe(0); // k0 is now the most recently used
    cache.set("k200", 200);
    expect(cache.size()).toBe(200);
    expect(cache.get("k0")).toBe(0);
    expect(cache.get("k1")).toBeUndefined();
    expect(cache.get("k200")).toBe(200);
  });

  it("re-setting a key refreshes its value and its TTL", () => {
    const c = clock();
    const cache = createAnswerCache<string>({ now: c.now, ttlMs: HOUR });
    cache.set("k", "a");
    c.advance(HOUR - 10);
    cache.set("k", "b");
    c.advance(HOUR - 10);
    expect(cache.get("k")).toBe("b");
  });

  it("clear() empties it", () => {
    const cache = createAnswerCache<string>({ now: () => 0 });
    cache.set("k", "v");
    cache.clear();
    expect(cache.get("k")).toBeUndefined();
  });
});
