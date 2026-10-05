/**
 * TC-040..TC-043, TC-045 · /api/ask, called through the route's POST with a
 * mocked fetch. The key is a fake ('test-key-not-real') and never real.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AskResponse } from "@/lib/ask/contract";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAskContext } from "@/lib/ask/context";
import { CHECK_CAVEAT_LINE, REFUSAL, SAVED_MESSAGE, fallbackAnswer } from "@/lib/ask/fallback";
import { scoreCase, scoringContext, type EvalDataset } from "@/evals/scorers/ask-scorer";
import { createAnswerCache } from "@/lib/ask/answer-cache";
import { createModelCooldowns } from "@/lib/ask/cooldown";
import { createAskHandler, routeMemory } from "@/lib/ask/handler";
import { createRateLimiter } from "@/lib/ask/rate-limit";
import { POST, dynamic, runtime } from "./route";

const KEY = "test-key-not-real";
const RECOGNISED = "How much did we earn yesterday, and how much doesn't add up?";
/** In scope, but no fallback template answers it: the saved path. (The weather is off-topic: it gets a refusal.) */
const UNRECOGNISED = "Which driver drove the most kilometres in August?";

let ipSeq = 0;
function ask(body: unknown, ip = `198.51.100.${++ipSeq}`): Request {
  return new Request("http://localhost/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `${ip}, 10.0.0.1` },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function geminiJson(payload: unknown, status = 200): Response {
  const body = { candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] };
  return new Response(JSON.stringify(body), { status });
}

const MODEL_OK = {
  answer: "Yesterday you earned ₹1,86,400. ₹11,430 doesn't add up across 3 trips.",
  lang: "en",
  cited_trips: ["0926-04", "0927-02", "0926-11", "0999-99"],
  cited_trucks: ["RJ14 GB 4521"],
  out_of_scope: false,
};

let logs: string[];
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // EXE31: the route's answer cache and model cooldowns live as long as the instance; each test starts clean.
  routeMemory.cache.clear();
  routeMemory.cooldowns.clear();
  logs = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  });
  fetchMock = vi.fn(async () => geminiJson(MODEL_OK));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GEMINI_API_KEY", KEY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function read(res: Response) {
  const body = await res.json();
  return { status: res.status, body, headers: res.headers };
}

const lastLog = () => JSON.parse(logs.filter((l) => l.startsWith("{") && l.includes('"reqId"')).at(-1) ?? "{}");

describe("route config", () => {
  it("runs on Node, dynamically", () => {
    expect(runtime).toBe("nodejs");
    expect(dynamic).toBe("force-dynamic");
  });
});

describe("validation (Review focus #2)", () => {
  it.each([
    ["an empty question", { question: "" }],
    ["a blank question", { question: "   " }],
    ["a question over 500 characters", { question: "a".repeat(501) }],
    ["no question", { lang: "en" }],
    ["a bad lang", { question: "hi", lang: "fr" }],
    ["a non-JSON body", "{not json"],
  ])("returns 400 for %s, without calling the model", async (_label, body) => {
    const { status, body: json, headers } = await read(await POST(ask(body)));
    expect(status).toBe(400);
    expect(json.error).toBeTruthy();
    expect(headers.get("cache-control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts exactly 500 characters", async () => {
    const { status } = await read(await POST(ask({ question: "a".repeat(500) })));
    expect(status).toBe(200);
  });

  it("never echoes the question (or its HTML) back in a saved or fallback answer", async () => {
    fetchMock.mockImplementation(async () => new Response("nope", { status: 500 }));
    const saved = await read(await POST(ask({ question: "<script>alert(1)</script> zebra-99" })));
    expect(saved.body.mode).toBe("saved");
    expect(JSON.stringify(saved.body)).not.toMatch(/<script>|zebra-99/);
    const fb = await read(await POST(ask({ question: `${RECOGNISED} <img src=x onerror=alert(1)> zebra-99` })));
    expect(fb.body.mode).toBe("fallback");
    expect(JSON.stringify(fb.body)).not.toMatch(/<img|zebra-99/);
  });

  it("strips HTML the model echoes from the question, so answers stay plain text", async () => {
    fetchMock.mockImplementation(async () => geminiJson({ ...MODEL_OK, answer: `${MODEL_OK.answer} <script>alert(1)</script>` }));
    const { body } = await read(await POST(ask({ question: `${RECOGNISED} <script>alert(1)</script>` })));
    expect(body.mode).toBe("model");
    expect(body.answer).toBe(`${MODEL_OK.answer} alert(1)`);
    expect(JSON.stringify(body)).not.toContain("<script>");
  });

  it.each([
    ["with content-length", true],
    ["without content-length", false],
  ])("refuses a 9 KB body (%s) with 413 before parsing, without calling the model", async (_label, withLength) => {
    const raw = JSON.stringify({ question: "a", pad: "x".repeat(9 * 1024) });
    const req = new Request("http://localhost/api/ask", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `192.0.2.${++ipSeq}`,
        ...(withLength ? { "content-length": String(Buffer.byteLength(raw)) } : {}),
      },
      body: raw,
    });
    const { status, body, headers } = await read(await POST(req));
    expect(status).toBe(413);
    expect(body.error).toBe("payload_too_large");
    expect(headers.get("cache-control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(lastLog()).toMatchObject({ mode: null, outcome: "too_large" });
  });

  it("counts the body in bytes, not characters", async () => {
    // 3,000 Devanagari characters are 9,000 bytes in UTF-8.
    const raw = JSON.stringify({ question: "क".repeat(3000) });
    expect(raw.length).toBeLessThan(8 * 1024);
    const req = new Request("http://localhost/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: raw });
    expect((await POST(req)).status).toBe(413);
  });
});

describe("TC-040 · happy path (mocked model)", () => {
  it("returns mode model with validated cites and full provenance", async () => {
    const res = await POST(ask({ question: RECOGNISED }));
    const { status, body, headers } = await read(res);
    expect(status).toBe(200);
    expect(headers.get("cache-control")).toBe("no-store");
    expect(AskResponse.parse(body)).toBeTruthy();
    expect(body.mode).toBe("model");
    expect(body.answer).toBe(MODEL_OK.answer);
    expect(body.lang).toBe("en");
    expect(body.cites.map((c: { tripId: string }) => c.tripId)).toEqual(["0926-04", "0927-02", "0926-11"]);
    expect(body.cites[0].label).toContain("RJ14 GB 4521");
    // 0926-11 is a Check flag, cited beside a High (0926-04) and a Likely (0927-02): the caveat names it (DES-9).
    expect(body.caveat).toBe("Trip 0926-11 is a Check flag: the extra use can have other causes, such as a heavier load.");
    expect(body.provenance).toMatchObject({
      scope: "212 trips across 24 trucks, 1–27 Sep",
      model: "gemini-3.5-flash",
      promptVersion: "ask-v2",
    });
    expect(body.provenance.datasetHash).toMatch(/^[0-9a-f]{12}$/);
    expect(body.provenance.ms).toBeGreaterThanOrEqual(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastLog()).toMatchObject({ mode: "model", outcome: "ok", cites: ["0926-04", "0927-02", "0926-11"] });
  });

  it("adds the caveat and logs unsupported numbers when the model invents a figure", async () => {
    fetchMock.mockImplementation(async () => geminiJson({ ...MODEL_OK, answer: "You earned ₹1,86,400 and lost ₹99,999." }));
    const { body } = await read(await POST(ask({ question: RECOGNISED })));
    expect(body.mode).toBe("model");
    // The guard's caveat first; the cited Check flag (0926-11) keeps its own after it (DES-9).
    expect(body.caveat).toBe("Check the trips before acting. Trip 0926-11 is a Check flag: the extra use can have other causes, such as a heavier load.");
    expect(lastLog()).toMatchObject({ outcome: "ok", unsupportedNumbers: [99999] });
  });

  it("an invented figure with no Check flag cited carries the guard's caveat alone", async () => {
    fetchMock.mockImplementation(async () => geminiJson({ ...MODEL_OK, answer: "You lost ₹99,999.", cited_trips: ["0926-04", "0927-02"] }));
    const { body } = await read(await POST(ask({ question: RECOGNISED })));
    expect(body.caveat).toBe("Check the trips before acting");
  });

  it("passes an out-of-scope refusal through with no cites", async () => {
    fetchMock.mockImplementation(async () =>
      geminiJson({ answer: "I don't have weather data.", lang: "en", cited_trips: [], cited_trucks: [], out_of_scope: true }),
    );
    const { body } = await read(await POST(ask({ question: UNRECOGNISED })));
    expect(body).toMatchObject({ mode: "model", cites: [], answer: "I don't have weather data." });
  });
});

describe("DES-9 · a model answer that cites a Check flag carries the fallback's caveat", () => {
  const CHECK_TRIPS = ["0909-03", "0917-06", "0926-11"];
  const LEAST_EN = "Which truck earns least per km, and why?";
  const LEAST_HI = "कौन-सा ट्रक प्रति किलोमीटर सबसे कम कमाता है, और क्यों?";
  const modelSays = (answer: string, lang: "en" | "hi", cited: string[]) =>
    fetchMock.mockImplementation(async () => geminiJson({ answer, lang, cited_trips: cited, cited_trucks: ["RJ14 GC 3309"], out_of_scope: false }));

  it("en: only Check trips cited → the fallback's own sentence", async () => {
    modelSays("RJ14 GC 3309 earns the least per km: it used more diesel than its normal on three trips.", "en", CHECK_TRIPS);
    const { body } = await read(await POST(ask({ question: LEAST_EN })));
    expect(body.mode).toBe("model");
    expect(body.caveat).toBe(CHECK_CAVEAT_LINE.en);
    // The very sentence the no-AI path gives for the same question.
    expect(fallbackAnswer(LEAST_EN)?.answer).toContain(body.caveat);
  });

  it("hi: only Check trips cited → the fallback's Hindi sentence", async () => {
    modelSays("RJ14 GC 3309 प्रति किलोमीटर सबसे कम कमाता है: तीन ट्रिप में सामान्य से ज़्यादा डीज़ल लगा।", "hi", CHECK_TRIPS);
    const { body } = await read(await POST(ask({ question: LEAST_HI })));
    expect(body.mode).toBe("model");
    expect(body.caveat).toBe(CHECK_CAVEAT_LINE.hi);
    expect(fallbackAnswer(LEAST_HI)?.answer).toContain(body.caveat);
  });

  it("hi: a Check trip beside a High one → the caveat names it, in Hindi", async () => {
    modelSays("कल दो ट्रिप में डीज़ल का हिसाब नहीं मिल रहा।", "hi", ["0926-04", "0926-11"]);
    const { body } = await read(await POST(ask({ question: "कल का हिसाब बताइए" })));
    expect(body.mode).toBe("model");
    expect(body.caveat).toBe("ट्रिप 0926-11 ‘जाँचें’ वाला फ़्लैग है: भारी लोड जैसी दूसरी वजहें भी हो सकती हैं।");
  });

  it("en: an invented figure beside only Check trips → both caveats, joined", async () => {
    modelSays("RJ14 GC 3309 lost ₹99,999 on three trips.", "en", CHECK_TRIPS);
    const { body } = await read(await POST(ask({ question: LEAST_EN })));
    expect(body.mode).toBe("model");
    expect(body.caveat).toBe(`Check the trips before acting. ${CHECK_CAVEAT_LINE.en}`);
  });

  it("en: one Check trip, or a Check trip beside a clean one → the caveat names it, never the plural", async () => {
    modelSays("RJ14 GC 3309 used more diesel than its normal.", "en", ["0926-11"]);
    expect((await read(await POST(ask({ question: LEAST_EN })))).body.caveat).toBe(
      "Trip 0926-11 is a Check flag: the extra use can have other causes, such as a heavier load.",
    );
    modelSays("Two trips to compare.", "en", ["0926-11", "0926-07"]);
    expect((await read(await POST(ask({ question: LEAST_EN })))).body.caveat).toBe(
      "Trip 0926-11 is a Check flag: the extra use can have other causes, such as a heavier load.",
    );
  });

  it.each([
    ["en", "Two trips don't add up yesterday.", ["0926-04", "0927-02"]],
    ["hi", "कल दो ट्रिप का हिसाब नहीं मिल रहा।", ["0926-04", "0927-02"]],
    ["en", "Trip 0926-07 adds up.", ["0926-07"]],
  ] as const)("%s: only High or Likely flags (or none) cited → no caveat", async (lang, answer, cited) => {
    modelSays(answer, lang, [...cited]);
    const { body } = await read(await POST(ask({ question: RECOGNISED })));
    expect(body.mode).toBe("model");
    expect(body.caveat).toBeUndefined();
  });
});

describe("TC-041 · timeout → fallback", () => {
  const hang = (_url: string, init: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });

  it("answers a recognised question with the deterministic report after 8 s", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    fetchMock.mockImplementation(hang);
    const pending = POST(ask({ question: RECOGNISED }));
    await vi.advanceTimersByTimeAsync(8000);
    const { status, body } = await read(await pending);
    expect(status).toBe(200);
    expect(body.mode).toBe("fallback");
    expect(body.answer).toContain("₹1,86,400");
    expect(body.answer).toContain("₹11,430");
    expect(body.provenance.model).toBeNull();
    expect(body.cites.map((c: { tripId: string }) => c.tripId).sort()).toEqual(["0926-04", "0926-11", "0927-02"]);
    expect(lastLog()).toMatchObject({ mode: "fallback", outcome: "timeout" });
  });

  it("saves an unrecognised question", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    fetchMock.mockImplementation(hang);
    const pending = POST(ask({ question: UNRECOGNISED }));
    await vi.advanceTimersByTimeAsync(8000);
    const { status, body } = await read(await pending);
    expect(status).toBe(200);
    expect(body).toMatchObject({ mode: "saved", answer: "Your question is saved. Try again in a minute for a written answer.", cites: [] });
    expect(lastLog()).toMatchObject({ mode: "saved", outcome: "timeout" });
  });
});

describe("TC-042 · upstream errors → fallback or saved, never 500", () => {
  const cases: [string, () => Promise<Response> | Response, string][] = [
    ["a 429", () => new Response("{}", { status: 429 }), "http_429"],
    ["a 500", () => new Response("{}", { status: 500 }), "http_5xx"],
    ["a non-JSON body", () => new Response("<html>", { status: 200 }), "bad_json"],
    ["JSON that fails the schema", () => geminiJson({ answer: 1, lang: "xx" }), "schema"],
    ["a network error", () => Promise.reject(new TypeError("fetch failed")), "network"],
  ];

  it.each(cases)("%s → fallback for a recognised question", async (_label, reply, outcome) => {
    fetchMock.mockImplementation(async () => reply());
    const { status, body } = await read(await POST(ask({ question: RECOGNISED })));
    expect(status).toBe(200);
    expect(AskResponse.parse(body).mode).toBe("fallback");
    expect(body.answer).toContain("₹1,86,400");
    expect(lastLog()).toMatchObject({ mode: "fallback", outcome });
  });

  it.each(cases)("%s → saved for an unrecognised question", async (_label, reply, outcome) => {
    fetchMock.mockImplementation(async () => reply());
    const { status, body } = await read(await POST(ask({ question: UNRECOGNISED })));
    expect(status).toBe(200);
    expect(body.mode).toBe("saved");
    expect(lastLog()).toMatchObject({ mode: "saved", outcome });
  });

  it("a missing key → fallback / saved, without calling fetch", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const a = await read(await POST(ask({ question: RECOGNISED })));
    expect(a.body.mode).toBe("fallback");
    expect(lastLog()).toMatchObject({ outcome: "no_key" });
    const b = await read(await POST(ask({ question: UNRECOGNISED })));
    expect(b.body.mode).toBe("saved");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["a forbidden word", { answer: `Possible ${["th", "eft"].join("")}.` }],
    ["no valid cite on a data question", { cited_trips: ["0999-99"] }],
    ["a leaked canary", { answer: "URJA-SYS-7F3Q" }],
  ])("the guard sends %s to the fallback", async (_label, patch) => {
    fetchMock.mockImplementation(async () => geminiJson({ ...MODEL_OK, ...patch }));
    const { body } = await read(await POST(ask({ question: RECOGNISED })));
    expect(body.mode).toBe("fallback");
    expect(lastLog()).toMatchObject({ outcome: "guard" });
  });

  it.each([
    ["the canary in lowercase", { answer: "urja sys 7f3q" }],
    ["a system-prompt sentence", { answer: "My rules say: Answer only from the JSON fleet data below." }],
  ])("the guard sends %s to the fallback", async (_label, patch) => {
    fetchMock.mockImplementation(async () => geminiJson({ ...MODEL_OK, ...patch }));
    const { body } = await read(await POST(ask({ question: RECOGNISED })));
    expect(body.mode).toBe("fallback");
    expect(lastLog()).toMatchObject({ outcome: "guard", guard: "leak" });
  });

  it("an out-of-scope answer that quotes a figure is saved instead (oos_numbers)", async () => {
    fetchMock.mockImplementation(async () =>
      geminiJson({ answer: "I can't forecast; maybe ₹97 a litre.", lang: "en", cited_trips: [], cited_trucks: [], out_of_scope: true }),
    );
    const { body } = await read(await POST(ask({ question: UNRECOGNISED })));
    expect(body.mode).toBe("saved");
    expect(lastLog()).toMatchObject({ outcome: "guard", guard: "oos_numbers" });
  });

  it("leaves no timer behind after a model answer or an upstream error", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await POST(ask({ question: RECOGNISED }));
    expect(vi.getTimerCount()).toBe(0);
    fetchMock.mockImplementation(async () => new Response("{}", { status: 500 }));
    await POST(ask({ question: RECOGNISED }));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("answers a Hindi question's fallback in Hindi", async () => {
    fetchMock.mockImplementation(async () => new Response("{}", { status: 503 }));
    const { body } = await read(await POST(ask({ question: "पिछले हफ़्ते कितना डीज़ल गायब हुआ?" })));
    expect(body).toMatchObject({ mode: "fallback", lang: "hi" });
    expect(body.answer).toContain("217 लीटर");
  });
});

describe("TC-043 · rate limit and daily cap", () => {
  it("limits the 6th request from one IP in a minute: 429 with retryAfterS and a fallback answer, no model call", async () => {
    const ip = "203.0.113.77";
    for (let i = 0; i < 5; i++) expect((await POST(ask({ question: RECOGNISED }, ip))).status).toBe(200);
    fetchMock.mockClear();
    const { status, body, headers } = await read(await POST(ask({ question: RECOGNISED }, ip)));
    expect(status).toBe(429);
    expect(body.retryAfterS).toBeGreaterThan(0);
    expect(headers.get("retry-after")).toBe(String(body.retryAfterS));
    expect(body.mode).toBe("fallback");
    expect(body.answer).toContain("₹1,86,400");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(lastLog()).toMatchObject({ outcome: "rate_limited" });
    const saved = await read(await POST(ask({ question: UNRECOGNISED }, ip)));
    expect(saved).toMatchObject({ status: 429, body: { mode: "saved" } });
  });

  it("past the per-IP daily cap and the global cap, the model is never called", async () => {
    let t = Date.UTC(2026, 8, 28, 2, 0);
    const limiter = createRateLimiter({ now: () => t, perIpPerDay: 2, globalPerDay: 3 });
    // No answer cache: every request here must reach the daily budget (cached answers don't; see EXE31 below).
    const handler = createAskHandler({ limiter, fetchImpl: fetchMock as unknown as typeof fetch, env: { GEMINI_API_KEY: KEY }, cache: null });
    const at = (ip: string) => {
      t += 60_000;
      return handler(ask({ question: RECOGNISED }, ip));
    };
    expect((await at("a")).status).toBe(200);
    expect((await at("a")).status).toBe(200);
    const perIp = await read(await at("a"));
    expect(perIp.status).toBe(429);
    expect(lastLog()).toMatchObject({ outcome: "rate_limited" });
    expect((await at("b")).status).toBe(200);
    const global = await read(await at("c"));
    expect(global.status).toBe(429);
    expect(lastLog()).toMatchObject({ outcome: "cap" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("TC-045 · key and question hygiene in logs", () => {
  it("log lines carry neither the key nor the question, one JSON line per request", async () => {
    const secretQuestion = "Which driver cost me the most diesel this month, zebra-marker-42?";
    fetchMock.mockImplementation(async () => new Response("{}", { status: 500 }));
    await POST(ask({ question: secretQuestion }));
    fetchMock.mockImplementation(async () => geminiJson(MODEL_OK));
    await POST(ask({ question: secretQuestion }));
    await POST(ask({ question: "" }));
    const requestLines = logs.filter((l) => l.includes('"reqId"'));
    expect(requestLines).toHaveLength(3);
    for (const line of logs) {
      expect(line).not.toContain(KEY);
      expect(line).not.toContain("zebra-marker-42");
      expect(line).not.toContain("Which driver cost me");
      expect(line).not.toContain("URJA-SYS-7F3Q");
    }
    const entry = JSON.parse(requestLines[0]);
    expect(Object.keys(entry)).toEqual(
      expect.arrayContaining(["ts", "reqId", "mode", "outcome", "ms", "model", "promptVersion", "qHash", "qLen", "lang", "cites", "unsupportedNumbers", "ipHash"]),
    );
    expect(entry.qLen).toBe(secretQuestion.length);
    expect(entry.ipHash).toMatch(/^[0-9a-f]{16}$/);
    expect(JSON.stringify(entry)).not.toContain("198.51.100");
  });

  it("the key travels only in the x-goog-api-key header", async () => {
    await POST(ask({ question: RECOGNISED }));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain(KEY);
    expect(String(init.body)).not.toContain(KEY);
    expect(new Headers(init.headers).get("x-goog-api-key")).toBe(KEY);
  });
});

describe("never 500", () => {
  it("an unexpected throw inside the handler still answers 200", async () => {
    const handler = createAskHandler({
      limiter: { take: () => { throw new Error("boom"); } } as unknown as ReturnType<typeof createRateLimiter>,
      fetchImpl: fetchMock as unknown as typeof fetch,
      env: { GEMINI_API_KEY: KEY },
    });
    const a = await read(await handler(ask({ question: RECOGNISED })));
    expect(a).toMatchObject({ status: 200, body: { mode: "fallback" } });
    expect(lastLog()).toMatchObject({ outcome: "error" });
    const b = await read(await handler(ask({ question: UNRECOGNISED })));
    expect(b).toMatchObject({ status: 200, body: { mode: "saved" } });
  });
});

describe("x-ask-outcome diagnostic header (EXE24)", () => {
  it("says ok and names the model on a model answer", async () => {
    const res = await POST(ask({ question: RECOGNISED }));
    expect(res.headers.get("x-ask-outcome")).toBe("ok; model=gemini-3.5-flash");
  });

  it.each([
    [404, "http_4xx:404"],
    [400, "http_4xx:400"],
    [429, "http_429:429"],
    [503, "http_5xx:503"],
  ])("names the upstream status %i", async (code, expected) => {
    vi.stubEnv("ASK_FALLBACK_MODEL", "off");
    fetchMock.mockImplementation(async () => new Response("{}", { status: code }));
    const res = await POST(ask({ question: RECOGNISED }));
    expect(res.headers.get("x-ask-outcome")).toBe(`${expected}; model=gemini-3.5-flash`);
  });

  it("names the guard reason", async () => {
    fetchMock.mockImplementation(async () => geminiJson({ ...MODEL_OK, cited_trips: ["0999-99"] }));
    const res = await POST(ask({ question: RECOGNISED }));
    expect(res.headers.get("x-ask-outcome")).toBe("guard:no_cites; model=gemini-3.5-flash");
  });

  it("names a missing key, and never carries the key", async () => {
    fetchMock.mockImplementation(async () => new Response("{}", { status: 500 }));
    const res = await POST(ask({ question: RECOGNISED }));
    for (const [, v] of res.headers) expect(v).not.toContain(KEY);
    vi.stubEnv("GEMINI_API_KEY", "");
    expect((await POST(ask({ question: RECOGNISED }))).headers.get("x-ask-outcome")).toBe("no_key");
  });
});

describe("EXE26 · the fallback model answers when the primary is busy", () => {
  const busyThen = (primary: number, second: () => Response) =>
    fetchMock.mockImplementation(async (url: string) => (url.includes("/gemini-3.5-flash:") ? new Response("{}", { status: primary }) : second()));

  it.each([429, 503])("a %i from the primary → a model answer from gemini-2.5-flash, named everywhere", async (code) => {
    busyThen(code, () => geminiJson(MODEL_OK));
    const res = await POST(ask({ question: RECOGNISED }));
    const { body } = await read(res);
    expect(AskResponse.parse(body).mode).toBe("model");
    expect(body.provenance.model).toBe("gemini-2.5-flash");
    const first = code === 429 ? "http_429:429" : "http_5xx:503";
    expect(res.headers.get("x-ask-outcome")).toBe(`ok; model=gemini-2.5-flash; after=${first} gemini-3.5-flash`);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(lastLog()).toMatchObject({ mode: "model", outcome: "ok", model: "gemini-2.5-flash", firstAttempt: `gemini-3.5-flash ${first}` });
  });

  it("both busy → the deterministic fallback, as before, with both attempts named", async () => {
    busyThen(429, () => new Response("{}", { status: 503 }));
    const res = await POST(ask({ question: RECOGNISED }));
    const { body } = await read(res);
    expect(body.mode).toBe("fallback");
    expect(body.provenance.model).toBeNull();
    expect(res.headers.get("x-ask-outcome")).toBe("http_5xx:503; model=gemini-2.5-flash; after=http_429:429 gemini-3.5-flash");
    expect(lastLog()).toMatchObject({ mode: "fallback", outcome: "http_5xx", model: "gemini-2.5-flash" });
  });

  it("the guard still checks the fallback model's answer", async () => {
    busyThen(503, () => geminiJson({ ...MODEL_OK, cited_trips: ["0999-99"] }));
    const res = await POST(ask({ question: RECOGNISED }));
    expect((await read(res)).body.mode).toBe("fallback");
    expect(res.headers.get("x-ask-outcome")).toBe("guard:no_cites; model=gemini-2.5-flash; after=http_5xx:503 gemini-3.5-flash");
  });

  it("a primary timeout ends at 8 s with the deterministic fallback, naming the primary", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
    );
    const pending = POST(ask({ question: RECOGNISED }));
    await vi.advanceTimersByTimeAsync(8000);
    const res = await pending;
    expect(res.headers.get("x-ask-outcome")).toBe("timeout; model=gemini-3.5-flash");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ── Stage 9 · the baseline's failure classes, reproduced with mocked Gemini answers ──
const dataset = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "evals", "eval-dataset.json"), "utf8")) as EvalDataset;
const evalCase = (id: string) => dataset.cases.find((c) => c.id === id)!;
const scoreCtx = scoringContext(dataset, getAskContext());
const askCase = (id: string, ip?: string) => ask({ question: evalCase(id).input.question, ...(evalCase(id).input.lang ? { lang: evalCase(id).input.lang } : {}) }, ip);

describe("Stage 9 · correct model answers the guard used to reject (baseline EVAL-001/008/009 fell back)", () => {
  it.each([
    [
      "EVAL-001: the flag ids of the three Check trips",
      "EVAL-001",
      {
        answer:
          "Anil Bairwa (RJ14 GC 3309) cost you the most diesel this month: 125 L (₹11,250) more than normal on 3 trips. All 3 are Check flags, so the extra use can have other causes, such as a heavier load.",
        lang: "en",
        cited_trips: ["0926-11-R3", "0917-06-R3", "0909-03-R3"],
        cited_trucks: ["RJ14 GC 3309"],
        out_of_scope: false,
      },
    ],
    [
      "EVAL-008: the two flags marked wrong, by flag id",
      "EVAL-008",
      {
        answer: "Urja was wrong 2 of 23 times this month (9%), under the 10% limit: 0909-07 and 0920-06, both explained by the driver.",
        lang: "en",
        cited_trips: ["0909-07-R5", "0920-06-R4"],
        cited_trucks: [],
        out_of_scope: false,
      },
    ],
    [
      "EVAL-009: the best truck, which has no flagged trip, cited by plate",
      "EVAL-009",
      {
        answer: "सबसे ज़्यादा कमाई प्रति किलोमीटर RJ14 GC 7710 (महेश मीणा) की है: सितंबर में ₹31.8 प्रति किलोमीटर।",
        lang: "hi",
        cited_trips: [],
        cited_trucks: ["RJ14 GC 7710"],
        out_of_scope: false,
      },
    ],
  ])("%s → mode model, and the scorer passes it", async (_label, id, payload) => {
    fetchMock.mockImplementation(async () => geminiJson(payload));
    const res = await POST(askCase(id));
    const { body } = await read(res);
    expect(res.headers.get("x-ask-outcome")).toMatch(/^ok; model=gemini-3\.5-flash/);
    expect(AskResponse.parse(body).mode).toBe("model");
    const score = scoreCase(evalCase(id), body, scoreCtx);
    expect(score.notes).toEqual([]);
    expect(score.pass).toBe(true);
  });

  it("B1: a fleet plate the answer doesn't name grounds nothing: no_cites → fallback", async () => {
    // MODEL_OK's answer names no plate; its cited_trucks is ["RJ14 GB 4521"].
    fetchMock.mockImplementation(async () => geminiJson({ ...MODEL_OK, cited_trips: [], cited_trucks: ["RJ14 GB 4521"] }));
    const res = await POST(ask({ question: RECOGNISED }));
    expect((await read(res)).body.mode).toBe("fallback");
    expect(res.headers.get("x-ask-outcome")).toBe("guard:no_cites; model=gemini-3.5-flash");
  });

  it("a made-up truck still grounds nothing: no_cites → fallback", async () => {
    fetchMock.mockImplementation(async () => geminiJson({ ...MODEL_OK, cited_trips: [], cited_trucks: ["RJ14 ZZ 9999"] }));
    const res = await POST(ask({ question: RECOGNISED }));
    expect((await read(res)).body.mode).toBe("fallback");
    expect(res.headers.get("x-ask-outcome")).toBe("guard:no_cites; model=gemini-3.5-flash");
  });
});

describe("Stage 9 · off-topic questions are refused, never 'saved' (baseline EVAL-011/013)", () => {
  const hang = (_url: string, init: RequestInit) =>
    new Promise<Response>((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));

  it.each([
    ["a refusal the model didn't mark out_of_scope (no_cites)", () => geminiJson({ answer: "Sorry, I can only help with your fleet.", lang: "en", cited_trips: [], cited_trucks: [], out_of_scope: false }), "guard:no_cites; model=gemini-3.5-flash"],
    ["an upstream 503 on both models", () => new Response("{}", { status: 503 }), "http_5xx:503; model=gemini-2.5-flash; after=http_5xx:503 gemini-3.5-flash"],
    ["a blocked prompt (no candidates)", () => new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }), { status: 200 }), "bad_json:SAFETY; model=gemini-3.5-flash"],
  ])("EVAL-011, %s → the out-of-scope refusal, which the scorer passes", async (_label, reply, outcome) => {
    fetchMock.mockImplementation(async () => reply());
    const res = await POST(askCase("EVAL-011"));
    const { status, body } = await read(res);
    expect(status).toBe(200);
    expect(res.headers.get("x-ask-outcome")).toBe(outcome);
    expect(AskResponse.parse(body)).toMatchObject({ mode: "saved", answer: REFUSAL.out_of_scope.en, lang: "en", cites: [], refusal: "out_of_scope" });
    expect(scoreCase(evalCase("EVAL-011"), body, scoreCtx).pass).toBe(true);
  });

  it("EVAL-013 after a timeout → the injection refusal: no canary, no prompt, no key; the scorer passes it", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    fetchMock.mockImplementation(hang);
    const pending = POST(askCase("EVAL-013"));
    await vi.advanceTimersByTimeAsync(8000);
    const { body } = await read(await pending);
    expect(body).toMatchObject({ mode: "saved", answer: REFUSAL.injection.en, cites: [], refusal: "injection" });
    expect(scoreCase(evalCase("EVAL-013"), body, scoreCtx).pass).toBe(true);
  });

  it("EVAL-012 with no key → the Hindi refusal; the scorer passes it", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { body } = await read(await POST(askCase("EVAL-012")));
    expect(body).toMatchObject({ mode: "saved", answer: REFUSAL.out_of_scope.hi, lang: "hi" });
    expect(scoreCase(evalCase("EVAL-012"), body, scoreCtx).pass).toBe(true);
  });

  it("a rate-limited off-topic question is refused too, still 429 with retryAfterS", async () => {
    const ip = "203.0.113.150";
    for (let i = 0; i < 5; i++) await POST(ask({ question: UNRECOGNISED }, ip));
    const res = await POST(askCase("EVAL-011", ip));
    const { status, body } = await read(res);
    expect(status).toBe(429);
    expect(body).toMatchObject({ mode: "saved", answer: REFUSAL.out_of_scope.en, refusal: "out_of_scope" });
    expect(body.retryAfterS).toBeGreaterThan(0);
  });

  it("an in-scope question the templates can't answer is saved, with no refusal flag", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    for (const question of [UNRECOGNISED, "Did drivers follow instructions on the Behror trip?", "What diesel price do you use?"]) {
      const { body } = await read(await POST(ask({ question })));
      expect(body, question).toMatchObject({ mode: "saved", answer: SAVED_MESSAGE.en });
      expect(body.refusal, question).toBeUndefined();
    }
  });

  it("the model's own refusal still wins when it answers (mode model)", async () => {
    fetchMock.mockImplementation(async () => geminiJson({ answer: "I don't have weather data.", lang: "en", cited_trips: [], cited_trucks: [], out_of_scope: true }));
    const { body } = await read(await POST(askCase("EVAL-011")));
    expect(body).toMatchObject({ mode: "model", answer: "I don't have weather data." });
  });
});

describe("Stage 9 · missing decisive facts are named in x-ask-outcome (baseline EVAL-002/005/006)", () => {
  it.each([
    ["EVAL-002 without the trip count", "EVAL-002", { answer: "पिछले हफ़्ते 217 L डीज़ल हिसाब नहीं मिल रहा है, जिसकी कीमत ₹19,530 है।", lang: "hi", cited_trips: ["0921-09", "0923-02", "0926-04", "0927-02", "0926-11"], cited_trucks: [], out_of_scope: false }, "missing=count"],
    ["EVAL-005 without the trip count", "EVAL-005", { answer: "Yesterday we earned a profit of ₹1,86,400, and ₹11,430 (127 L of diesel) is unaccounted.", lang: "en", cited_trips: ["0926-04", "0927-02", "0926-11"], cited_trucks: [], out_of_scope: false }, "missing=count"],
    ["EVAL-006 without the place and time", "EVAL-006", { answer: "Ramesh Kumar's truck RJ14 GB 4521 had 38 L of unaccounted diesel worth ₹3,420 during a stationary fuel drop on trip 0926-04.", lang: "en", cited_trips: ["0926-04"], cited_trucks: [], out_of_scope: false }, "missing=place,time"],
  ])("%s → still the model's answer, flagged %s", async (_label, id, payload, missing) => {
    fetchMock.mockImplementation(async () => geminiJson(payload));
    const res = await POST(askCase(id));
    const { body } = await read(res);
    expect(body.mode).toBe("model");
    expect(body.answer).toBe(payload.answer);
    expect(res.headers.get("x-ask-outcome")).toBe(`ok; model=gemini-3.5-flash; ${missing}`);
    expect(lastLog()).toMatchObject({ outcome: "ok", missing: missing.slice("missing=".length).split(",") });
  });

  it("a complete answer carries no missing= part", async () => {
    fetchMock.mockImplementation(async () =>
      geminiJson({ answer: "RJ14 GB 4521 lost 38 L (₹3,420) while parked near Behror at 2:14 AM on trip 0926-04.", lang: "en", cited_trips: ["0926-04"], cited_trucks: [], out_of_scope: false }),
    );
    const res = await POST(askCase("EVAL-006"));
    expect(res.headers.get("x-ask-outcome")).toBe("ok; model=gemini-3.5-flash");
  });
});

describe("Stage 9 · Gemini's finish or block reason names a bad_json outcome", () => {
  it("a MAX_TOKENS cut-off → bad_json:MAX_TOKENS", async () => {
    const body = { candidates: [{ content: { parts: [{ text: '{"answer":"Yesterday you ear' }] }, finishReason: "MAX_TOKENS" }] };
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(body), { status: 200 }));
    const res = await POST(ask({ question: RECOGNISED }));
    expect(res.headers.get("x-ask-outcome")).toBe("bad_json:MAX_TOKENS; model=gemini-3.5-flash");
  });

  it("an odd reason is reduced to safe characters", async () => {
    const body = { candidates: [{ content: { parts: [] }, finishReason: "weird reason <script>" }] };
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(body), { status: 200 }));
    const res = await POST(ask({ question: RECOGNISED }));
    expect(res.headers.get("x-ask-outcome")).toBe("bad_json:WEIRDREASONSCRIPT; model=gemini-3.5-flash");
  });
});

describe("CR-1 · the request's lang picks the language of deterministic copy for a Latin-script question", () => {
  const HINGLISH_UNRECOGNISED = "mere trucks ka haal batao";

  it("lang 'hi' + an unrecognised Hinglish question → the Hindi saved message", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { body } = await read(await POST(ask({ question: HINGLISH_UNRECOGNISED, lang: "hi" })));
    expect(body).toMatchObject({ mode: "saved", answer: SAVED_MESSAGE.hi, lang: "hi" });
  });

  it("lang 'en' (or none) + the same question → the English saved message", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    for (const req of [{ question: HINGLISH_UNRECOGNISED, lang: "en" }, { question: HINGLISH_UNRECOGNISED }]) {
      const { body } = await read(await POST(ask(req)));
      expect(body).toMatchObject({ mode: "saved", answer: SAVED_MESSAGE.en, lang: "en" });
    }
  });

  it("lang 'hi' + a recognised Hinglish question → the Hindi fallback answer", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { body } = await read(await POST(ask({ question: "Vikram ki kal wali trip mein kya gadbad hai?", lang: "hi" })));
    expect(body).toMatchObject({ mode: "fallback", lang: "hi" });
    expect(body.answer).toContain("किशनगढ़");
  });

  it("a clearly English question stays English on the Hindi screen, and Devanagari stays Hindi on the English one", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect((await read(await POST(ask({ question: UNRECOGNISED, lang: "hi" })))).body).toMatchObject({ answer: SAVED_MESSAGE.en, lang: "en" });
    expect((await read(await POST(ask({ question: "मेरे ट्रकों का हाल बताओ", lang: "en" })))).body).toMatchObject({ answer: SAVED_MESSAGE.hi, lang: "hi" });
  });
});


// ── Stage 9 unit G · frugal on the Gemini free tier (EXE31) ──
describe("EXE31 · the answer cache: a repeated question is the model's own answer, without a Gemini call", () => {
  const T0 = Date.UTC(2026, 8, 28, 1, 42);

  it("a repeat (any spacing or case) returns the same body, mode model, the original model, and x-ask-outcome ok; cached", async () => {
    const first = await read(await POST(ask({ question: RECOGNISED })));
    expect(first.headers.get("x-ask-outcome")).toBe("ok; model=gemini-3.5-flash");
    fetchMock.mockClear();
    const res = await POST(ask({ question: `  ${RECOGNISED.toUpperCase().replace(/ /g, "   ")}  ` }));
    const again = await read(res);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(again.status).toBe(200);
    expect(res.headers.get("x-ask-outcome")).toBe("ok; cached; model=gemini-3.5-flash");
    const { provenance: p1, ...rest1 } = first.body;
    const { provenance: p2, ...rest2 } = again.body;
    expect(rest2).toEqual(rest1);
    expect(AskResponse.parse(again.body).mode).toBe("model");
    expect({ ...p2, ms: 0 }).toEqual({ ...p1, ms: 0 });
    expect(p2.ms).toBeGreaterThanOrEqual(0);
    expect(lastLog()).toMatchObject({ mode: "model", outcome: "ok", cached: true, model: "gemini-3.5-flash", cites: ["0926-04", "0927-02", "0926-11"] });
    for (const line of logs) expect(line).not.toContain("How much did we earn");
  });

  it("keeps the fallback model's name on a cached answer it wrote, and keeps missing= diagnostics", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.includes("/gemini-3.5-flash:")
        ? new Response("{}", { status: 503 })
        : geminiJson({ answer: "Yesterday we earned a profit of ₹1,86,400, and ₹11,430 (127 L of diesel) is unaccounted.", lang: "en", cited_trips: ["0926-04", "0927-02", "0926-11"], cited_trucks: [], out_of_scope: false }),
    );
    await POST(askCase("EVAL-005"));
    fetchMock.mockClear();
    const res = await POST(askCase("EVAL-005"));
    const { body } = await read(res);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(body.provenance.model).toBe("gemini-2.5-flash");
    expect(res.headers.get("x-ask-outcome")).toBe("ok; cached; model=gemini-2.5-flash; missing=count");
  });

  it.each([
    ["a guard rejection (fallback)", () => geminiJson({ ...MODEL_OK, cited_trips: ["0999-99"] }), RECOGNISED],
    ["an upstream 500 (fallback)", () => new Response("{}", { status: 500 }), RECOGNISED],
    ["an upstream 500 (saved)", () => new Response("{}", { status: 500 }), UNRECOGNISED],
    ["an upstream 500 (off-topic refusal)", () => new Response("{}", { status: 500 }), "What will the weather be in Jaipur tomorrow?"],
    ["bad JSON", () => new Response("<html>", { status: 200 }), RECOGNISED],
  ])("never caches %s: the next ask calls Gemini again", async (_label, reply, question) => {
    fetchMock.mockImplementation(async () => reply());
    vi.stubEnv("ASK_FALLBACK_MODEL", "off");
    const first = await read(await POST(ask({ question })));
    expect(first.body.mode).not.toBe("model");
    fetchMock.mockImplementation(async () => geminiJson(MODEL_OK));
    fetchMock.mockClear();
    const res = await POST(ask({ question }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.headers.get("x-ask-outcome")).not.toContain("cached");
  });

  it("never caches without a key, and a cached answer is keyed by its copy language", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await POST(ask({ question: RECOGNISED }));
    vi.stubEnv("GEMINI_API_KEY", KEY);
    await POST(ask({ question: RECOGNISED }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // A Hinglish question follows the request's lang (CR-1): each language is its own entry.
    const hinglish = "kal kitna kamaya aur kitna hisaab nahi mila?";
    await POST(ask({ question: hinglish, lang: "en" }));
    await POST(ask({ question: hinglish, lang: "hi" }));
    await POST(ask({ question: hinglish, lang: "hi" }));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("ASK_DAILY_MODEL_BUDGET sets the handler's global daily Gemini budget", async () => {
    const handler = createAskHandler({ fetchImpl: fetchMock as unknown as typeof fetch, env: { GEMINI_API_KEY: KEY, ASK_DAILY_MODEL_BUDGET: "1" } });
    expect((await handler(ask({ question: RECOGNISED }))).status).toBe(200);
    expect((await handler(ask({ question: UNRECOGNISED }))).status).toBe(429);
    expect(lastLog()).toMatchObject({ outcome: "cap" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a cache hit spends no daily Gemini budget, but still takes the per-IP minute token", async () => {
    const t = T0;
    const limiter = createRateLimiter({ now: () => t, globalPerDay: 1 });
    const handler = createAskHandler({ limiter, fetchImpl: fetchMock as unknown as typeof fetch, env: { GEMINI_API_KEY: KEY }, now: () => t });
    expect((await read(await handler(ask({ question: RECOGNISED }, "a")))).body.mode).toBe("model");
    // The one-call budget is spent, yet a repeat from anyone is still the model's answer.
    for (const ip of ["b", "c", "a"]) {
      const res = await handler(ask({ question: RECOGNISED }, ip));
      expect(res.status, ip).toBe(200);
      expect(res.headers.get("x-ask-outcome")).toBe("ok; cached; model=gemini-3.5-flash");
    }
    // A new question needs Gemini: the global budget refuses it.
    const fresh = await handler(ask({ question: "Which truck earns least per km, and why?" }, "d"));
    expect(fresh.status).toBe(429);
    expect(lastLog()).toMatchObject({ outcome: "cap" });
    // The minute bucket still applies to cached answers: "a" has used 2 of 5; the 6th in the minute is refused.
    for (let i = 0; i < 3; i++) expect((await handler(ask({ question: RECOGNISED }, "a"))).status).toBe(200);
    const limited = await handler(ask({ question: RECOGNISED }, "a"));
    expect(limited.status).toBe(429);
    expect(lastLog()).toMatchObject({ outcome: "rate_limited" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("x-ask-cache: bypass skips the cache read (a live call), still writes the fresh answer, and still spends the budget", async () => {
    const t = T0;
    const limiter = createRateLimiter({ now: () => t, globalPerDay: 2 });
    const handler = createAskHandler({ limiter, fetchImpl: fetchMock as unknown as typeof fetch, env: { GEMINI_API_KEY: KEY }, now: () => t });
    const bypass = (ip: string) => {
      const r = ask({ question: RECOGNISED }, ip);
      r.headers.set("x-ask-cache", "bypass");
      return r;
    };
    await handler(ask({ question: RECOGNISED }, "a"));
    const live = await handler(bypass("b"));
    expect(live.headers.get("x-ask-outcome")).toBe("ok; model=gemini-3.5-flash");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // The budget (2) is spent: a bypassing request is refused like any uncached one…
    expect((await handler(bypass("c"))).status).toBe(429);
    expect(lastLog()).toMatchObject({ outcome: "cap" });
    // …while a normal repeat is still served from the cache the bypass refreshed.
    expect((await handler(ask({ question: RECOGNISED }, "d"))).headers.get("x-ask-outcome")).toBe("ok; cached; model=gemini-3.5-flash");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("x-ask-cache: bypass still takes the per-IP minute token", async () => {
    const handler = createAskHandler({ fetchImpl: fetchMock as unknown as typeof fetch, env: { GEMINI_API_KEY: KEY } });
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = ask({ question: RECOGNISED }, "same-ip");
      r.headers.set("x-ask-cache", "bypass");
      statuses.push((await handler(r)).status);
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("expires after 24 h (injected clock)", async () => {
    let t = T0;
    const handler = createAskHandler({ fetchImpl: fetchMock as unknown as typeof fetch, env: { GEMINI_API_KEY: KEY }, now: () => t, cache: createAnswerCache({ now: () => t }) });
    await handler(ask({ question: RECOGNISED }));
    t += 24 * 3_600_000 - 1;
    await handler(ask({ question: RECOGNISED }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    t += 1;
    await handler(ask({ question: RECOGNISED }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("EXE31 · cooldowns: no Gemini call that can't succeed", () => {
  const T0 = Date.UTC(2026, 8, 28, 1, 42);
  const quota429 = () => new Response(JSON.stringify({ error: { code: 429, details: [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "30s" }] } }), { status: 429 });

  it("primary 429 + fallback 404 → every later question skips both, straight to the deterministic answer, outcome cooldown", async () => {
    fetchMock.mockImplementation(async (url: string) => (url.includes("/gemini-3.5-flash:") ? quota429() : new Response("{}", { status: 404 })));
    const first = await POST(ask({ question: RECOGNISED }));
    expect(first.headers.get("x-ask-outcome")).toBe("http_4xx:404; model=gemini-2.5-flash; after=http_429:429 gemini-3.5-flash");
    fetchMock.mockClear();
    const res = await POST(ask({ question: "Show every flag on the Behror stretch" }));
    const { status, body } = await read(res);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(status).toBe(200);
    expect(body.mode).toBe("fallback");
    expect(body.provenance.model).toBeNull();
    expect(res.headers.get("x-ask-outcome")).toBe("cooldown; model=gemini-2.5-flash; after=cooldown gemini-3.5-flash");
    expect(lastLog()).toMatchObject({ mode: "fallback", outcome: "cooldown", firstAttempt: "gemini-3.5-flash cooldown" });
  });

  it("a cooldown skip spends no daily budget, and the primary is asked again once its retry hint has passed", async () => {
    let t = T0;
    const limiter = createRateLimiter({ now: () => t, globalPerDay: 2 });
    const cooldowns = createModelCooldowns({ now: () => t });
    const handler = createAskHandler({ limiter, cooldowns, fetchImpl: fetchMock as unknown as typeof fetch, env: { GEMINI_API_KEY: KEY, ASK_FALLBACK_MODEL: "off" }, now: () => t });
    fetchMock.mockImplementation(async () => quota429());
    expect((await handler(ask({ question: RECOGNISED }))).headers.get("x-ask-outcome")).toBe("http_429:429; model=gemini-3.5-flash");
    for (let i = 0; i < 5; i++) {
      const res = await handler(ask({ question: RECOGNISED }));
      expect(res.status).toBe(200);
      expect(res.headers.get("x-ask-outcome")).toBe("cooldown; model=gemini-3.5-flash");
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
    t += 30_000;
    fetchMock.mockImplementation(async () => geminiJson(MODEL_OK));
    const back = await handler(ask({ question: RECOGNISED }));
    expect(back.headers.get("x-ask-outcome")).toBe("ok; model=gemini-3.5-flash");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("a benched primary sends the question straight to the fallback model", async () => {
    fetchMock.mockImplementation(async (url: string) => (url.includes("/gemini-3.5-flash:") ? quota429() : geminiJson(MODEL_OK)));
    await POST(ask({ question: RECOGNISED }));
    fetchMock.mockClear();
    const res = await POST(ask({ question: UNRECOGNISED }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/gemini-2.5-flash:");
    expect(res.headers.get("x-ask-outcome")).toBe("ok; model=gemini-2.5-flash; after=cooldown gemini-3.5-flash");
  });
});
