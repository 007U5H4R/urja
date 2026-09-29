/**
 * In-memory limits per server instance (technical-plan §6.5, TP6):
 * - per IP, a token bucket of 5 a minute (one token back every 12 s);
 * - per IP, 40 a day; for everyone, 300 a day (IST days).
 * A refused request spends nothing. The real backstop is the Google-side quota.
 */
import { createHash } from "node:crypto";

export type RateDecision = { ok: true } | { ok: false; outcome: "rate_limited" | "cap"; retryAfterS: number };

export interface RateLimiterOptions {
  now?: () => number;
  perMinute?: number;
  perIpPerDay?: number;
  globalPerDay?: number;
  /** Past this many tracked IPs, buckets that have refilled completely are dropped. */
  maxTrackedIps?: number;
}

const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 330 * 60_000;

export function createRateLimiter({
  now = Date.now,
  perMinute = 5,
  perIpPerDay = 40,
  globalPerDay = 300,
  maxTrackedIps = 10_000,
}: RateLimiterOptions = {}) {
  const msPerToken = 60_000 / perMinute;
  const buckets = new Map<string, { tokens: number; at: number }>();
  const daily = new Map<string, number>();
  let day = -1;
  let global = 0;

  const istDay = (t: number) => Math.floor((t + IST_OFFSET_MS) / DAY_MS);
  const toMidnightS = (t: number) => Math.ceil(((istDay(t) + 1) * DAY_MS - IST_OFFSET_MS - t) / 1000);

  return {
    take(ip: string): RateDecision {
      const t = now();
      if (istDay(t) !== day) {
        day = istDay(t);
        global = 0;
        daily.clear();
      }
      if (global >= globalPerDay) return { ok: false, outcome: "cap", retryAfterS: toMidnightS(t) };
      if ((daily.get(ip) ?? 0) >= perIpPerDay) return { ok: false, outcome: "rate_limited", retryAfterS: toMidnightS(t) };

      const prev = buckets.get(ip) ?? { tokens: perMinute, at: t };
      const tokens = Math.min(perMinute, prev.tokens + (t - prev.at) / msPerToken);
      if (tokens < 1) {
        buckets.set(ip, { tokens, at: t });
        return { ok: false, outcome: "rate_limited", retryAfterS: Math.max(1, Math.ceil(((1 - tokens) * msPerToken) / 1000)) };
      }
      if (buckets.size >= maxTrackedIps && !buckets.has(ip)) {
        // A full bucket holds nothing a fresh one wouldn't; the daily count lives in `daily`.
        for (const [k, b] of buckets) if (b.tokens + (t - b.at) / msPerToken >= perMinute) buckets.delete(k);
      }
      buckets.set(ip, { tokens: tokens - 1, at: t });
      daily.set(ip, (daily.get(ip) ?? 0) + 1);
      global++;
      return { ok: true };
    },
    /** How many per-minute buckets are held (for tests and diagnostics). */
    trackedIps(): number {
      return buckets.size;
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

/**
 * The caller's IP: the first x-forwarded-for hop, else x-real-ip, else 'unknown'.
 * The leftmost hop is trustworthy only behind Vercel's edge, which overwrites
 * x-forwarded-for with the real client address. Anywhere else (next start on a
 * bare host, another proxy) a client can set the header and pick its own
 * bucket; the global daily cap and the Google-side quota still hold.
 */
export function clientIp(headers: Headers): string {
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || "unknown";
}

/** The IP as logs carry it: the first 16 hex of its SHA-256. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
