/**
 * Model cooldowns (Stage 9, EXE31): don't spend Gemini calls that can't succeed.
 * - A 429 benches the model for Gemini's own hint (the Retry-After header, else
 *   the error body's google.rpc.RetryInfo retryDelay), 60 s without one, and
 *   never more than 10 min.
 * - A 404 means the key doesn't have the model; it will 404 again, so the model
 *   is benched for 6 h (a redeploy, e.g. after an ASK_*_MODEL change, resets it).
 *   gemini.ts caps the primary model's 404 bench at 10 min, so a primary that
 *   404s for a passing reason comes back soon; the fallback model keeps 6 h.
 * - Retry-After: 0 benches for 1 s (MIN), so a "retry now" hint doesn't become
 *   the 60 s default.
 * In memory, per instance. Time comes from an injected clock (Date.now by
 * default, as in rate-limit.ts).
 */
export const COOLDOWN_DEFAULT_MS = 60_000;
export const COOLDOWN_MAX_MS = 10 * 60_000;
export const COOLDOWN_MIN_MS = 1_000;
export const UNAVAILABLE_MS = 6 * 3_600_000;

export interface CooldownOptions {
  now?: () => number;
  defaultMs?: number;
  maxMs?: number;
  unavailableMs?: number;
}

export function createModelCooldowns({
  now = Date.now,
  defaultMs = COOLDOWN_DEFAULT_MS,
  maxMs = COOLDOWN_MAX_MS,
  unavailableMs = UNAVAILABLE_MS,
}: CooldownOptions = {}) {
  const until = new Map<string, number>();
  const bench = (model: string, ms: number) => {
    const id = model.toLowerCase();
    // A later, shorter hint never shortens a running cooldown.
    until.set(id, Math.max(until.get(id) ?? 0, now() + ms));
  };
  return {
    /** True while `model` is cooling down: skip the call. */
    blocked(model: string): boolean {
      const id = model.toLowerCase();
      const t = until.get(id);
      if (t === undefined) return false;
      if (now() < t) return true;
      until.delete(id);
      return false;
    },
    /** After a 429: bench for `retryAfterMs` (default 60 s without a hint; clamped to 1 s – 10 min). */
    busy(model: string, retryAfterMs?: number): void {
      const ms = retryAfterMs !== undefined && Number.isFinite(retryAfterMs) && retryAfterMs >= 0 ? retryAfterMs : defaultMs;
      bench(model, Math.min(Math.max(ms, COOLDOWN_MIN_MS), maxMs));
    },
    /** After a 404: the key doesn't have this model. `ms` shortens the bench (the primary's is capped at 10 min). */
    unavailable(model: string, ms: number = unavailableMs): void {
      bench(model, Math.min(ms, unavailableMs));
    },
    clear(): void {
      until.clear();
    },
  };
}

export type ModelCooldowns = ReturnType<typeof createModelCooldowns>;

/** Retry-After as delay-seconds or an HTTP date, in ms from `now`; undefined when absent or unusable. */
export function parseRetryAfterMs(header: string | null | undefined, now: number): number | undefined {
  const v = header?.trim();
  if (!v) return undefined;
  if (/^\d+(\.\d+)?$/.test(v)) return Math.round(Number(v) * 1000);
  const at = Date.parse(v);
  if (Number.isNaN(at) || !/[a-z]/i.test(v)) return undefined;
  const ms = at - now;
  return ms > 0 ? ms : undefined;
}

/** The first google.rpc.RetryInfo `retryDelay` ("41s", "1.5s") in a Gemini error body, in ms. */
export function parseRetryDelayMs(body: string): number | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return undefined;
  }
  const details = (parsed as { error?: { details?: unknown } } | null)?.error?.details;
  if (!Array.isArray(details)) return undefined;
  for (const d of details) {
    const delay = (d as { retryDelay?: unknown } | null)?.retryDelay;
    const m = typeof delay === "string" ? /^(\d+(?:\.\d+)?)s$/.exec(delay.trim()) : null;
    if (m) return Math.round(Number(m[1]) * 1000);
  }
  return undefined;
}
