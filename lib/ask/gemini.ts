/**
 * The Gemini REST client (technical-plan §6.4). One POST per question:
 * - the key travels only in the `x-goog-api-key` header, never in the URL or body;
 * - the answer is JSON constrained by RESPONSE_SCHEMA, then validated with zod;
 * - an AbortController cuts the call at ASK_TIMEOUT_MS (8 s);
 * - on a 429 or 503, callGeminiWithFallback asks the fallback model once, inside
 *   the same 8 s (EXE26).
 * Every failure comes back as an outcome, never as a throw, so the route can
 * fall back.
 */
import "server-only";
import { askConfig, GEMINI_BASE_URL, thinkingFor, type AskConfig } from "./config";
import { ANSWER_RULES, SYSTEM_INSTRUCTION, userTurn } from "./prompt";
import { ModelAnswer, RESPONSE_SCHEMA } from "./schema";

/** `network`: the request never got an HTTP response (DNS, TLS, connection reset). */
export type GeminiFailure = "timeout" | "network" | "http_429" | "http_4xx" | "http_5xx" | "bad_json" | "schema";

export type GeminiResult =
  | { ok: true; answer: ModelAnswer; model: string }
  /** `detail`: for bad_json and schema, Gemini's block or finish reason ('SAFETY', 'MAX_TOKENS'), A–Z, 0–9 and _ only. */
  | { ok: false; outcome: GeminiFailure; status?: number; detail?: string };

export interface GeminiCall {
  apiKey: string;
  /** The context JSON (getAskContext().json). */
  context: string;
  question: string;
  config?: AskConfig;
  fetchImpl?: typeof fetch;
}

/** The request body; exported for the probe script. */
export function requestBody(context: string, question: string, config: AskConfig) {
  return {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }, { text: ANSWER_RULES }] },
    contents: [{ role: "user", parts: [{ text: userTurn(context, question) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      ...(config.thinking ? { thinkingConfig: config.thinking } : {}),
    },
  };
}

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

/**
 * Why Gemini's answer is unusable, as it says: the prompt's block reason, else
 * the first candidate's finish reason when it isn't a normal STOP. Uppercased
 * and reduced to A–Z, 0–9 and _ (max 40), so it is safe in a header.
 */
function reasonOf(body: GenerateContentResponse | undefined): string | undefined {
  const raw = body?.promptFeedback?.blockReason ?? body?.candidates?.[0]?.finishReason;
  if (typeof raw !== "string" || raw === "STOP") return undefined;
  const clean = raw.toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 40);
  return clean || undefined;
}

const failure = (outcome: GeminiFailure, detail?: string): GeminiResult => ({ ok: false, outcome, ...(detail ? { detail } : {}) });

/** The answer text: the first candidate's non-thought parts, joined. */
function answerText(body: GenerateContentResponse): string | null {
  const parts = body.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
  return text.length > 0 ? text : null;
}

function isAbort(e: unknown): boolean {
  return typeof e === "object" && e !== null && "name" in e && (e.name === "AbortError" || e.name === "TimeoutError");
}

export async function callGemini({ apiKey, context, question, config = askConfig(), fetchImpl = fetch }: GeminiCall): Promise<GeminiResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetchImpl(`${GEMINI_BASE_URL}/${encodeURIComponent(config.model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(requestBody(context, question, config)),
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (e) {
      return { ok: false, outcome: isAbort(e) || controller.signal.aborted ? "timeout" : "network" };
    }
    if (!res.ok) {
      // Free the connection: the error body is never read.
      void res.body?.cancel().catch(() => undefined);
      return { ok: false, outcome: res.status === 429 ? "http_429" : res.status >= 500 ? "http_5xx" : "http_4xx", status: res.status };
    }

    let body: GenerateContentResponse;
    try {
      body = (await res.json()) as GenerateContentResponse;
    } catch (e) {
      return { ok: false, outcome: isAbort(e) || controller.signal.aborted ? "timeout" : "bad_json" };
    }
    const text = body && typeof body === "object" ? answerText(body) : null;
    if (text === null) return failure("bad_json", reasonOf(body));
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return failure("bad_json", reasonOf(body));
    }
    const parsed = ModelAnswer.safeParse(raw);
    if (!parsed.success) return failure("schema", reasonOf(body));
    return { ok: true, answer: parsed.data, model: config.model };
  } finally {
    clearTimeout(timer);
  }
}

/** One call to one model, as the handler reports it (x-ask-outcome, the log). */
export type GeminiAttempt = { model: string; outcome: GeminiFailure | "ok"; status?: number; detail?: string };

/** Below this much of the budget, the fallback model isn't worth a call. */
export const MIN_RETRY_MS = 1000;

/**
 * EXE26: call the primary model; on an upstream 429 (quota) or 503 (busy), call
 * `config.fallbackModel` once with whatever is left of `config.timeoutMs`, so the
 * whole exchange still ends within the one budget. Any other failure is final.
 * `attempts` lists every call made, in order.
 */
export async function callGeminiWithFallback(
  call: GeminiCall & { now?: () => number },
): Promise<GeminiResult & { attempts: GeminiAttempt[] }> {
  const config = call.config ?? askConfig();
  const now = call.now ?? (() => performance.now());
  const t0 = now();
  const attempt = (r: GeminiResult, model: string): GeminiAttempt =>
    r.ok ? { model, outcome: "ok" } : { model, outcome: r.outcome, ...(r.status ? { status: r.status } : {}), ...(r.detail ? { detail: r.detail } : {}) };

  const first = await callGemini({ ...call, config: { ...config, thinking: thinkingFor(config.model, config.thinking) } });
  const attempts = [attempt(first, config.model)];
  const busy = !first.ok && (first.status === 429 || first.status === 503);
  const fallback = config.fallbackModel;
  const left = config.timeoutMs - (now() - t0);
  if (!busy || !fallback || fallback.toLowerCase() === config.model.toLowerCase() || left < MIN_RETRY_MS) return { ...first, attempts };

  const retryConfig: AskConfig = { ...config, model: fallback, thinking: thinkingFor(fallback, config.thinking), timeoutMs: Math.floor(left) };
  const second = await callGemini({ ...call, config: retryConfig });
  attempts.push(attempt(second, fallback));
  return { ...second, attempts };
}
