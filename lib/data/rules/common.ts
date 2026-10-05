/** What every rule shares: its context and the flag skeleton. */
import { dayKey } from "@/lib/clock";
import type { Bilingual, Confidence, Evidence, Flag, Min, RuleId, Trip } from "../types";

export interface RuleContext {
  /**
   * Flags already detected across the fleet (a first pass over every trip),
   * for the "Same stretch flagged N more times this month" line. Omit it on a
   * first pass; the line then counts nothing.
   */
  fleetFlags?: readonly Flag[];
}

export interface Detection {
  at: Min;
  until?: Min;
  placeId?: string;
  litres?: number;
  inr: number;
  confidence: Confidence;
  evidence: Evidence[];
  whyConfidence: Bilingual;
}

/** A flag as a rule emits it: waiting, not asked, nothing recovered (resolutions come later). */
export function toFlag(trip: Trip, rule: RuleId, d: Detection, n = 1): Flag {
  const flag: Flag = {
    id: n === 1 ? `${trip.id}-${rule}` : `${trip.id}-${rule}-${n}`,
    tripId: trip.id,
    plate: trip.plate,
    rule,
    at: d.at,
    inr: d.inr,
    confidence: d.confidence,
    evidence: d.evidence,
    whyConfidence: d.whyConfidence,
    status: "waiting",
    driverSide: { state: "not-asked" },
    recoveredInr: 0,
    dayKey: dayKey(trip.end),
  };
  if (d.until !== undefined) flag.until = d.until;
  if (d.placeId !== undefined) flag.placeId = d.placeId;
  if (d.litres !== undefined) flag.litres = d.litres;
  return flag;
}
