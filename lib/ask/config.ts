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
 * Prompt version: 'ask-v1' covers the §6.3 system instruction plus the user
 * turn in prompt.ts (the question JSON-encoded and marked as data, added in
 * review before any eval baseline existed). Any change after the first
 * baseline run bumps PROMPT_VERSION (evaluation-plan §6).
 */
import "server-only";

export { PROMPT_VERSION } from "./prompt";

export const DEFAULT_ASK_MODEL = "gemini-3.5-flash";
export const ASK_TIMEOUT_MS = 8000;
export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const THINKING_LEVELS = ["minimal", "low", "medium", "high"] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
export const DEFAULT_THINKING_LEVEL: ThinkingLevel = "minimal";

export interface AskConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  thinking: { thinkingLevel: ThinkingLevel } | null;
  timeoutMs: number;
}

type Env = { ASK_MODEL?: string; ASK_THINKING_LEVEL?: string; [name: string]: string | undefined };

/** The model settings. `env` defaults to process.env; tests pass their own. Never reads the key. */
export function askConfig(env: Env = process.env): AskConfig {
  const level = env.ASK_THINKING_LEVEL?.trim().toLowerCase();
  const thinking =
    level === "off"
      ? null
      : { thinkingLevel: (THINKING_LEVELS as readonly string[]).includes(level ?? "") ? (level as ThinkingLevel) : DEFAULT_THINKING_LEVEL };
  return {
    model: env.ASK_MODEL?.trim() || DEFAULT_ASK_MODEL,
    temperature: 0.2,
    maxOutputTokens: 600,
    thinking,
    timeoutMs: ASK_TIMEOUT_MS,
  };
}
