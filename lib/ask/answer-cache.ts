/**
 * The answer cache (Stage 9, EXE31): a server-side, in-memory LRU of model
 * answers per instance, so a live demo that asks the same chip questions again
 * spends no Gemini call. Only answers that passed the guard with mode "model"
 * go in (the handler decides); fallback, saved, refusal and error answers never
 * do. The dataset is static and the key carries PROMPT_VERSION and the dataset
 * hash, so a cached answer is the model's own answer to the same prompt over
 * the same data.
 *
 * Time comes from an injected clock (Date.now by default, as in rate-limit.ts).
 */
import { normaliseDigits } from "./text";

export const ANSWER_CACHE_MAX_ENTRIES = 200;
export const ANSWER_CACHE_TTL_MS = 24 * 3_600_000;

/** Trim, collapse whitespace, case-fold Latin, unify digits: "  Which TRUCK  १२?" → "which truck 12?". */
export function normaliseQuestion(question: string): string {
  return normaliseDigits(question.normalize("NFC")).trim().replace(/\s+/g, " ").toLowerCase();
}

export interface CacheKeyParts {
  question: string;
  /** The language the request resolves to (intents.ts copyLang): the script, or the lang hint for Hinglish. */
  lang: string;
  promptVersion: string;
  datasetHash: string;
}

export function cacheKey({ question, lang, promptVersion, datasetHash }: CacheKeyParts): string {
  return JSON.stringify([promptVersion, datasetHash, lang, normaliseQuestion(question)]);
}

export interface AnswerCacheOptions {
  now?: () => number;
  maxEntries?: number;
  ttlMs?: number;
}

export function createAnswerCache<V>({ now = Date.now, maxEntries = ANSWER_CACHE_MAX_ENTRIES, ttlMs = ANSWER_CACHE_TTL_MS }: AnswerCacheOptions = {}) {
  // A Map keeps insertion order: the first key is the least recently used.
  const entries = new Map<string, { value: V; expires: number }>();
  return {
    get(key: string): V | undefined {
      const e = entries.get(key);
      if (!e) return undefined;
      entries.delete(key);
      if (now() >= e.expires) return undefined;
      entries.set(key, e);
      return e.value;
    },
    set(key: string, value: V): void {
      entries.delete(key);
      entries.set(key, { value, expires: now() + ttlMs });
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value as string);
    },
    size(): number {
      return entries.size;
    },
    clear(): void {
      entries.clear();
    },
  };
}

export type AnswerCache<V> = ReturnType<typeof createAnswerCache<V>>;
