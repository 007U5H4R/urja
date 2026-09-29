/**
 * The Gemini REST client (technical-plan §6.4). One POST per question:
 * - the key travels only in the `x-goog-api-key` header, never in the URL or body;
 * - the answer is JSON constrained by RESPONSE_SCHEMA, then validated with zod;
 * - an AbortController cuts the call at ASK_TIMEOUT_MS (8 s).
 * Every failure comes back as an outcome, never as a throw, so the route can
 * fall back.
 */
import "server-only";
import { askConfig, GEMINI_BASE_URL, type AskConfig } from "./config";
import { SYSTEM_INSTRUCTION, userTurn } from "./prompt";
import { ModelAnswer, RESPONSE_SCHEMA } from "./schema";

/** `network`: the request never got an HTTP response (DNS, TLS, connection reset). */
export type GeminiFailure = "timeout" | "network" | "http_429" | "http_4xx" | "http_5xx" | "bad_json" | "schema";

export type GeminiResult = { ok: true; answer: ModelAnswer; model: string } | { ok: false; outcome: GeminiFailure; status?: number };

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
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
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
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
}

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
    const text = answerText(body);
    if (text === null) return { ok: false, outcome: "bad_json" };
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return { ok: false, outcome: "bad_json" };
    }
    const parsed = ModelAnswer.safeParse(raw);
    if (!parsed.success) return { ok: false, outcome: "schema" };
    return { ok: true, answer: parsed.data, model: config.model };
  } finally {
    clearTimeout(timer);
  }
}
