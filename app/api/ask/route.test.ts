/**
 * TC-040..TC-043, TC-045 · /api/ask, called through the route's POST with a
 * mocked fetch. The key is a fake ('test-key-not-real') and never real.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AskResponse } from "@/lib/ask/contract";
import { CHECK_CAVEAT_LINE, fallbackAnswer } from "@/lib/ask/fallback";
import { createAskHandler } from "@/lib/ask/handler";
import { createRateLimiter } from "@/lib/ask/rate-limit";
import { POST, dynamic, runtime } from "./route";

const KEY = "test-key-not-real";
const RECOGNISED = "How much did we earn yesterday, and how much doesn't add up?";
const UNRECOGNISED = "What's the weather in Jaipur tomorrow?";

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
      promptVersion: "ask-v1",
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
    const handler = createAskHandler({ limiter, fetchImpl: fetchMock as unknown as typeof fetch, env: { GEMINI_API_KEY: KEY } });
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
