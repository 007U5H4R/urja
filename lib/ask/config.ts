/**
 * Ask's model configuration (TKT-07 DoD: "prompt version and model
 * configuration recorded in lib/ask/config.ts"). Read on the server only.
 *
 * Thinking: §6.4 asks for the lowest-latency thinking setting the model
 * accepts that still keeps the eval ≥ 9/10; TSK-07.1's probe decides it and
 * records it as TP5. No key exists in the build VM (decisions.md EXE3), so the
 * default below — Gemini 3's `thinkingLevel: "minimal"` — is UNVERIFIED until
 * `pnpm tsx --conditions=react-server scripts/probe-gemini.ts` runs with a key. Override with
 * ASK_THINKING_LEVEL=minimal|low|medium|high, or `off` to send no
 * thinkingConfig at all.
 *
 * Prompt version: 'ask-v2' covers the §6.3 system instruction, the ask-v2
 * answer rules and the user turn in prompt.ts. Any change bumps
 * PROMPT_VERSION (evaluation-plan §6).
 *
 * maxOutputTokens: 1024 (Stage 9; §6.4 said 600). Answers run 60–250 tokens, so
 * the cap costs no latency; it only stops a long Hindi answer (Devanagari takes
 * more tokens) plus Gemini 3's minimal thinking from being cut off into bad_json
 * ('bad_json:MAX_TOKENS' in x-ask-outcome).
 */
import "server-only";

export { PROMPT_VERSION } from "./prompt";

export const DEFAULT_ASK_MODEL = "gemini-3.5-flash";
/** EXE26: asked once when the primary answers 429 or 503; `ASK_FALLBACK_MODEL=off` disables it. */
export const DEFAULT_FALLBACK_MODEL = "gemini-2.5-flash";
export const ASK_TIMEOUT_MS = 8000;
export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const THINKING_LEVELS = ["minimal", "low", "medium", "high"] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
export const DEFAULT_THINKING_LEVEL: ThinkingLevel = "minimal";

/** Gemini 3 models take a thinking level; 2.x models take a token budget (0 = off on Flash). */
export type ThinkingConfig = { thinkingLevel: ThinkingLevel } | { thinkingBudget: number };

export interface AskConfig {
  model: string;
  /** Tried once, inside the same timeout, after a 429 or 503 from `model`; null = never. */
  fallbackModel: string | null;
  temperature: number;
  maxOutputTokens: number;
  thinking: ThinkingConfig | null;
  timeoutMs: number;
}

type Env = { ASK_MODEL?: string; ASK_FALLBACK_MODEL?: string; ASK_THINKING_LEVEL?: string; ASK_DAILY_MODEL_BUDGET?: string; [name: string]: string | undefined };

/** The model settings. `env` defaults to process.env; tests pass their own. Never reads the key. */
export function askConfig(env: Env = process.env): AskConfig {
  const level = env.ASK_THINKING_LEVEL?.trim().toLowerCase();
  const thinking =
    level === "off"
      ? null
      : { thinkingLevel: (THINKING_LEVELS as readonly string[]).includes(level ?? "") ? (level as ThinkingLevel) : DEFAULT_THINKING_LEVEL };
  return {
    model: env.ASK_MODEL?.trim() || DEFAULT_ASK_MODEL,
    fallbackModel: fallbackModel(env.ASK_FALLBACK_MODEL),
    temperature: 0.2,
    maxOutputTokens: 1024,
    thinking,
    timeoutMs: ASK_TIMEOUT_MS,
  };
}

/**
 * EXE31 · the global daily Gemini budget per instance (rate-limit.ts globalPerDay):
 * ASK_DAILY_MODEL_BUDGET, a whole number ≥ 1; anything else keeps the default 300.
 * Only requests that reach Gemini spend it (cached answers and cooldown skips don't).
 */
export const DEFAULT_DAILY_MODEL_BUDGET = 300;

export function dailyModelBudget(env: Env = process.env): number {
  const raw = env.ASK_DAILY_MODEL_BUDGET?.trim() ?? "";
  const n = /^\d+$/.test(raw) ? Number(raw) : NaN;
  return Number.isSafeInteger(n) && n >= 1 ? n : DEFAULT_DAILY_MODEL_BUDGET;
}

function fallbackModel(raw: string | undefined): string | null {
  const v = raw?.trim();
  if (!v) return DEFAULT_FALLBACK_MODEL;
  return v.toLowerCase() === "off" ? null : v;
}

/**
 * The thinking config `model` accepts. 2.x models reject `thinkingLevel`: 2.x Flash
 * gets a zero budget (the lowest-latency setting, as "minimal" is for Gemini 3);
 * other 2.x models (Pro can't turn thinking off) get none and keep their default.
 */
export function thinkingFor(model: string, thinking: ThinkingConfig | null): ThinkingConfig | null {
  if (!/^gemini-2\./i.test(model)) return thinking;
  return /flash/i.test(model) ? { thinkingBudget: 0 } : null;
}
