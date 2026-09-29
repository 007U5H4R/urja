/** Small bilingual text helpers for evidence lines (IST times, Indian grouping). */
import { formatINR, formatTimeIST, minToISTParts } from "@/lib/format";
import type { Min } from "../types";

/** `2:14 AM` (en) / `रात 2:14` (hi). */
export function timeEn(t: Min): string {
  return formatTimeIST(t);
}

export function timeHi(t: Min): string {
  const { hour, minute } = minToISTParts(t);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  // §5.3: रात 9 PM–4 AM, सुबह 4 AM–12 PM, दोपहर 12–4 PM, शाम 4–9 PM.
  const part = hour < 4 ? "रात" : hour < 12 ? "सुबह" : hour < 16 ? "दोपहर" : hour < 21 ? "शाम" : "रात";
  return `${part} ${h12}:${String(minute).padStart(2, "0")}`;
}

/** `2:08–2:44 AM`, or `11:50 PM–12:30 AM` across the meridiem. */
export function rangeEn(a: Min, b: Min): string {
  const x = timeEn(a);
  const y = timeEn(b);
  const [xt, xm] = x.split(" ");
  const [yt, ym] = y.split(" ");
  return xm === ym ? `${xt}–${yt} ${ym}` : `${x}–${y}`;
}

/** `रात 2:08–2:44`, or `शाम 8:40–रात 9:20` when the part of day changes. */
export function rangeHi(a: Min, b: Min): string {
  const [ap] = timeHi(a).split(" ");
  const [bp, bt] = timeHi(b).split(" ");
  return `${timeHi(a)}–${ap === bp ? bt : `${bp} ${bt}`}`;
}

/** ₹ with Indian grouping, never signed. */
export const inr = (n: number) => formatINR(n, { sign: "never" });

/** Whole km with Indian grouping (`1,412`), as the trip-plan line shows distances. */
const KM_GROUPING = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
export const kmWhole = (n: number) => KM_GROUPING.format(Math.round(n));

/** One decimal, as evidence shows distances (`1.6 km`). */
export const km1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

/** Whole litres from centilitres. */
export const litres = (cl: number) => Math.round(cl / 100);
