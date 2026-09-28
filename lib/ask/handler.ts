/**
 * The /api/ask request handler (technical-plan §6.1, §6.5). app/api/ask/route.ts
 * wraps it; tests build their own with injected fetch, env and limiter.
 *
 * 400 for a body that fails AskRequest; 413 for a body over 8 KB; 429 when rate-limited (with
 * retryAfterS, and a fallback answer if the question is recognised); 200 for
 * every model, fallback and saved answer. Never 500: any error becomes a
 * fallback or saved answer.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { askConfig, type AskConfig } from "./config";
import { AskRequest, type AskLang, type AskResponse } from "./contract";
import { getAskContext } from "./context";
import { fallbackAnswer, SAVED_MESSAGE } from "./fallback";
import { callGemini } from "./gemini";
import { guardAnswer } from "./guard";
import { detectLang } from "./intents";
import { tripLabel } from "./labels";
import { consoleSink, hashQuestion, writeAskLog, type AskOutcome, type LogSink } from "./log";
import { PROMPT_VERSION } from "./prompt";
import { clientIp, createRateLimiter, hashIp, type RateLimiter } from "./rate-limit";

/**
 * Bodies past this size get 413 before parsing (a 500-character question is
 * at most ~1.5 KB even in Devanagari). 413 rather than §6.1's 400: the body
 * isn't malformed, it's oversized, and only a non-UI client can send one, so
 * the UI's contract (200/400/429) is unchanged.
 */
const MAX_BODY_BYTES = 8 * 1024;

export interface AskDeps {
  limiter?: RateLimiter;
  fetchImpl?: typeof fetch;
  /** Where GEMINI_API_KEY, ASK_MODEL and ASK_THINKING_LEVEL are read; process.env by default. */
  env?: Partial<Record<string, string | undefined>>;
  sink?: LogSink;
}

const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } as const;

function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });
}

export function createAskHandler(deps: AskDeps = {}) {
  const limiter = deps.limiter ?? createRateLimiter();
  const sink = deps.sink ?? consoleSink;
  let contextLogged = false;

  return async function handle(req: Request): Promise<Response> {
    const t0 = performance.now();
    const reqId = randomUUID().slice(0, 8);
    const ipHash = hashIp(clientIp(req.headers));
    const env = deps.env ?? process.env;
    const config: AskConfig = askConfig(env);
    const elapsed = () => Math.round(performance.now() - t0);

    const log = (e: {
      mode: AskResponse["mode"] | null;
      outcome: AskOutcome;
      model?: string | null;
      question?: string;
      lang?: string | null;
      cites?: string[];
      unsupported?: number[];
      guard?: string;
    }) =>
      writeAskLog(
        {
          ts: new Date().toISOString(),
          reqId,
          mode: e.mode,
          outcome: e.outcome,
          ms: elapsed(),
          model: e.model ?? null,
          promptVersion: PROMPT_VERSION,
          qHash: e.question ? hashQuestion(e.question) : null,
          qLen: e.question?.length ?? 0,
          lang: e.lang ?? null,
          cites: e.cites ?? [],
          unsupportedNumbers: e.unsupported ?? [],
          ipHash,
          ...(e.guard ? { guard: e.guard } : {}),
        },
        sink,
      );

    // ── Size, then parse ─────────────────────────────────────────────────
    const tooLarge = () => {
      log({ mode: null, outcome: "too_large" });
      return json(413, { error: "payload_too_large", message: `The body must be at most ${MAX_BODY_BYTES} bytes.` });
    };
    const declared = Number(req.headers.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return tooLarge();
    let parsed: ReturnType<typeof AskRequest.safeParse> | null = null;
    try {
      const raw = await req.text();
      if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return tooLarge();
      parsed = AskRequest.safeParse(JSON.parse(raw));
    } catch {
      parsed = null;
    }
    if (!parsed?.success) {
      log({ mode: null, outcome: "invalid" });
      return json(400, { error: "invalid_request", message: "Send JSON {question} with 1 to 500 characters." });
    }
    const { question } = parsed.data;
    const qLang: AskLang = detectLang(question);

    // ── Answers that don't come from the model ───────────────────────────
    const degrade = (outcome: AskOutcome, status = 200, extra: { retryAfterS?: number; guard?: string; model?: string | null } = {}) => {
      let body: AskResponse;
      let cites: string[] = [];
      let scope = "";
      let datasetHash = "";
      try {
        const bundle = getAskContext();
        scope = bundle.scope;
        datasetHash = bundle.hash;
      } catch {
        // No context: the saved answer below still goes out with empty provenance.
      }
      let fb: ReturnType<typeof fallbackAnswer> = null;
      try {
        fb = fallbackAnswer(question);
      } catch {
        fb = null;
      }
      const provenance = { scope, model: null, ms: elapsed(), promptVersion: PROMPT_VERSION, datasetHash };
      if (fb) {
        cites = fb.cites;
        body = { mode: "fallback", answer: fb.answer, lang: fb.lang, cites: fb.cites.map((id) => ({ tripId: id, label: tripLabel(id, fb.lang) })), provenance };
      } else {
        const lang = qLang === "hi" ? "hi" : "en";
        body = { mode: "saved", answer: SAVED_MESSAGE[lang], lang, cites: [], provenance };
      }
      if (extra.retryAfterS) body.retryAfterS = extra.retryAfterS;
      log({ mode: body.mode, outcome, model: extra.model ?? null, question, lang: body.lang, cites, guard: extra.guard });
      return json(status, body, extra.retryAfterS ? { "retry-after": String(extra.retryAfterS) } : {});
    };

    try {
      const limit = limiter.take(clientIp(req.headers));
      if (!limit.ok) return degrade(limit.outcome, 429, { retryAfterS: limit.retryAfterS });

      const bundle = getAskContext();
      if (!contextLogged) {
        contextLogged = true;
        sink(JSON.stringify({ event: "ask_context", buildMs: bundle.buildMs, chars: bundle.json.length, datasetHash: bundle.hash }));
      }

      const apiKey = env.GEMINI_API_KEY?.trim();
      if (!apiKey) return degrade("no_key");

      const result = await callGemini({ apiKey, context: bundle.json, question, config, fetchImpl: deps.fetchImpl ?? fetch });
      if (!result.ok) return degrade(result.outcome, 200, { model: config.model });

      const g = guardAnswer(result.answer, { question, allowed: bundle.allowed, tripIds: bundle.tripIds });
      if (!g.ok) return degrade("guard", 200, { guard: g.reason, model: result.model });

      const lang = result.answer.lang;
      const body: AskResponse = {
        mode: "model",
        answer: g.answer,
        lang,
        cites: g.cites.map((id) => ({ tripId: id, label: tripLabel(id, lang === "hi" ? "hi" : "en") })),
        ...(g.caveat ? { caveat: g.caveat } : {}),
        provenance: { scope: bundle.scope, model: result.model, ms: elapsed(), promptVersion: PROMPT_VERSION, datasetHash: bundle.hash },
      };
      log({ mode: "model", outcome: "ok", model: result.model, question, lang, cites: g.cites, unsupported: g.unsupported });
      return json(200, body);
    } catch {
      try {
        return degrade("error");
      } catch {
        // Last resort, still not a 500: the saved answer with empty provenance.
        const lang = qLang === "hi" ? "hi" : "en";
        const provenance = { scope: "", model: null, ms: elapsed(), promptVersion: PROMPT_VERSION, datasetHash: "" };
        return json(200, { mode: "saved", answer: SAVED_MESSAGE[lang], lang, cites: [], provenance } satisfies AskResponse);
      }
    }
  };
}
