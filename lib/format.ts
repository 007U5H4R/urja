/**
 * Display formatting for Urja. Every displayed time is IST (UTC+05:30),
 * whatever the host TZ: IST is computed with a fixed offset and read back
 * through UTC getters, never through the host's local-time APIs.
 */

import type { Min } from "@/lib/data/types";

/** Minutes since EPOCH (2026-08-29T00:00+05:30); owned by lib/data/types.ts. */
export type { Min };

/** 2026-08-29T00:00+05:30 as a UTC timestamp. */
export const EPOCH_UTC_MS = Date.UTC(2026, 7, 28, 18, 30);

const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;
const MINUS = "−";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const INR_GROUPING = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const LITRES_0 = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const LITRES_2 = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `₹1,86,400`; negatives as `−₹10,620` (U+2212) unless `sign: 'never'`. */
export function formatINR(n: number, opts?: { sign?: "auto" | "never" }): string {
  if (!Number.isFinite(n)) throw new RangeError(`formatINR: not a finite number: ${n}`);
  // Round the magnitude so halves go away from zero on both sides.
  const abs = Math.round(Math.abs(n));
  const body = `₹${INR_GROUPING.format(abs)}`;
  const negative = n < 0 && abs !== 0;
  return negative && opts?.sign !== "never" ? `${MINUS}${body}` : body;
}

/** `38 L`, or `104.89 L` with `decimals = 2`; negatives as `−12 L` (U+2212). */
export function formatLitres(l: number, decimals: 0 | 2 = 0): string {
  const scale = 10 ** decimals;
  const abs = Math.round(Math.abs(l) * scale) / scale;
  const body = `${(decimals === 2 ? LITRES_2 : LITRES_0).format(abs)} L`;
  // No sign when the value rounds to zero, so "−0 L" never appears.
  return l < 0 && abs !== 0 ? `${MINUS}${body}` : body;
}

export interface ISTParts {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
  /** 0–23 */
  hour: number;
  minute: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

/** Calendar parts of `t` in IST. */
export function minToISTParts(t: Min): ISTParts {
  const shifted = new Date(EPOCH_UTC_MS + Math.floor(t) * 60_000 + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

/** `2:14 AM`, `12:00 PM`. */
export function formatTimeIST(t: Min): string {
  const { hour, minute } = minToISTParts(t);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

/** `Sun 27 Sep` or `27 Sep`. */
export function formatDateIST(
  t: Min,
  style: "weekday-day-month" | "day-month",
): string {
  const { day, month, weekday } = minToISTParts(t);
  const dayMonth = `${day} ${MONTHS[month - 1]}`;
  return style === "weekday-day-month" ? `${WEEKDAYS[weekday]} ${dayMonth}` : dayMonth;
}
