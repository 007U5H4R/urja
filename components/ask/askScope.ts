/**
 * Server-only: the provenance scope and the saved-answer line, computed from
 * the same aggregates as the screens (never typed in). app/root-document.tsx passes
 * them to the client AskProvider as props, so no lib/data reaches the client.
 */
import "server-only";
import { SEPT_FIRST_DAY, SEPT_LAST_DAY, september, trucks } from "@/lib/data/aggregates";
import { SAVED_MESSAGE } from "@/lib/ask/fallback";
import { dayLabel } from "@/lib/ask/labels";
import { MONTHS_HI } from "@/lib/brief/dict";
import type { Bilingual } from "@/lib/data/types";

export interface AskShellData {
  /** '212 trips across 24 trucks, 1–27 Sep', and in Hindi '212 ट्रिप, 24 ट्रक, 1–27 सितंबर' (EXE23). */
  scope: Bilingual;
  /** The "your question is saved" line, in the answer's language. */
  saved: { hi: string; en: string };
}

export function askShellData(): AskShellData {
  const from = Number(SEPT_FIRST_DAY.slice(8));
  const [, month, to] = SEPT_LAST_DAY.split("-").map(Number);
  const tripCount = september().trips;
  const truckCount = trucks().length;
  return {
    scope: {
      en: `${tripCount} trips across ${truckCount} trucks, ${from}–${dayLabel(SEPT_LAST_DAY)}`,
      hi: `${tripCount} ट्रिप, ${truckCount} ट्रक, ${from}–${to} ${MONTHS_HI[month - 1]}`,
    },
    saved: { hi: SAVED_MESSAGE.hi, en: SAVED_MESSAGE.en },
  };
}
