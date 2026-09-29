/**
 * Server-only: the provenance scope and the saved-answer line, computed from
 * the same aggregates as the screens (never typed in). app/layout.tsx passes
 * them to the client AskProvider as props, so no lib/data reaches the client.
 */
import "server-only";
import { SEPT_FIRST_DAY, SEPT_LAST_DAY, september, trucks } from "@/lib/data/aggregates";
import { SAVED_MESSAGE } from "@/lib/ask/fallback";
import { dayLabel } from "@/lib/ask/labels";

export interface AskShellData {
  /** '212 trips across 24 trucks, 1–27 Sep' */
  scope: string;
  /** The "your question is saved" line, in the answer's language. */
  saved: { hi: string; en: string };
}

export function askShellData(): AskShellData {
  const from = Number(SEPT_FIRST_DAY.slice(8));
  return {
    scope: `${september().trips} trips across ${trucks().length} trucks, ${from}–${dayLabel(SEPT_LAST_DAY)}`,
    saved: { hi: SAVED_MESSAGE.hi, en: SAVED_MESSAGE.en },
  };
}
