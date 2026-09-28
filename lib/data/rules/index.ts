/**
 * detectFlags runs R1–R5 on one trip's telemetry. It never reads the
 * scenario's injections, and depends on nothing in scenario/ (resolutions
 * are laid over the flags by lib/data/pipeline.ts).
 */
import type { Flag, Trip } from "../types";
import type { RuleContext } from "./common";
import { detectR1 } from "./r1-stationary-drop";
import { detectR2 } from "./r2-refuel-mismatch";
import { detectR3 } from "./r3-excess";
import { detectR4, extraKmCl, measureDeviation } from "./r4-route";
import { detectR5 } from "./r5-toll";

export type { RuleContext } from "./common";
export { CONFIDENCE_WORD, grade } from "./confidence";
export { detectR1 } from "./r1-stationary-drop";

export function detectFlags(trip: Trip, ctx: RuleContext = {}): Flag[] {
  const r1 = detectR1(trip, ctx);
  const r2 = detectR2(trip);
  const dev = measureDeviation(trip);
  const r4 = detectR4(trip, dev);
  // EXE4: R3 nets out the litres R1 already flagged and the diesel an R4 detour explains.
  const r3 = detectR3(trip, {
    r1Cl: r1.reduce((a, f) => a + (f.litres ?? 0) * 100, 0),
    r4Cl: dev ? extraKmCl(trip, dev.extraKm) : 0,
  });
  const r5 = detectR5(trip);
  return [...r1, ...r2, ...r3, ...r4, ...r5];
}
