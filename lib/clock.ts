/**
 * The demo clock (technical-plan §1). Time is `Min`: minutes since
 * EPOCH = 2026-08-29T00:00+05:30. The real current date is never read.
 */
import type { Min } from "@/lib/data/types";
import { EPOCH_UTC_MS, minToISTParts } from "@/lib/format";

export const MIN_PER_DAY = 1440;

const IST_OFFSET_MIN = 5 * 60 + 30;

/** Minutes since EPOCH for an IST wall-clock time. `month` is 1–12. */
export function istMin(year: number, month: number, day: number, hour = 0, minute = 0): Min {
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MIN * 60_000;
  return (utcMs - EPOCH_UTC_MS) / 60_000;
}

/** Mon 28 Sep 2026, 7:12 AM IST. */
export const DEMO_NOW: Min = istMin(2026, 9, 28, 7, 12);

/** 1 Sep 2026, 00:00 IST: start of "September so far". */
export const SEPT_START: Min = istMin(2026, 9, 1);

/** 28 Sep 2026, 00:00 IST (exclusive): "September so far" is trips that ended 1–27 Sep. */
export const SEPT_END_EXCL: Min = istMin(2026, 9, 28);

/** The IST calendar date of `t`, as 'YYYY-MM-DD'. */
export function dayKey(t: Min): string {
  const { year, month, day } = minToISTParts(t);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
