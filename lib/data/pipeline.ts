/**
 * Builds the whole dataset from the scenario, deterministically:
 * scenario.json → per-minute telemetry → flags (R1–R5) → resolutions → ledgers.
 * It is not memoised here: lib/data/index.ts (TSK-02.6) wraps it as the
 * memoised getDataset().
 *
 * - `trips`: every trip that ended by DEMO_NOW, in scenario order.
 * - `live`: trips still on the road at DEMO_NOW, replayed up to DEMO_NOW.
 *   They carry no flags or ledger yet.
 * - Flags come from two passes: the second reruns only R1, to add the
 *   fleet-history line ("Same stretch flagged N more times this month").
 * - Every resolution must match a detected flag; the build throws otherwise.
 */
import { DEMO_NOW } from "@/lib/clock";
import { ledgerFor } from "./ledger";
import { detectFlags, detectR1 } from "./rules";
import scenarioJson from "./scenario/scenario.json";
import { type Resolution, type Scenario, scenarioSchema } from "./scenario/schema";
import { simulateTrip } from "./simulate";
import type { Flag, Trip, TripId, TripLedger } from "./types";

export interface Dataset {
  scenario: Scenario;
  trips: Trip[];
  live: Trip[];
  flags: Flag[];
  ledgers: Record<TripId, TripLedger>;
}

export function parseScenario(json: unknown): Scenario {
  return scenarioSchema.parse(json);
}

export function buildDataset(scenario: Scenario = parseScenario(scenarioJson)): Dataset {
  const done = scenario.trips.filter((s) => s.end <= DEMO_NOW);
  const trips = done.map((s) => simulateTrip(s));
  const live = scenario.trips
    .filter((s) => s.start <= DEMO_NOW && s.end > DEMO_NOW)
    .map((s) => simulateTrip(s, { until: DEMO_NOW }));

  const first = trips.map((t) => detectFlags(t));
  const fleetFlags = first.flat();
  const detected = trips.flatMap((t, i) =>
    first[i].some((f) => f.rule === "R1")
      ? [...detectR1(t, { fleetFlags }), ...first[i].filter((f) => f.rule !== "R1")]
      : first[i],
  );
  const flags = applyResolutions(detected, scenario.resolutions);

  const ledgers: Record<TripId, TripLedger> = {};
  for (const t of trips) ledgers[t.id] = ledgerFor(t, flags);
  return { scenario, trips, live, flags, ledgers };
}

/** Lays the owner's decisions (status, driver's side, recovered ₹) over detected flags. */
export function applyResolutions(flags: readonly Flag[], resolutions: readonly Resolution[]): Flag[] {
  const byId = new Map(resolutions.map((r) => [r.flagId, r]));
  const ids = new Set(flags.map((f) => f.id));
  const orphan = resolutions.find((r) => !ids.has(r.flagId));
  if (orphan) throw new Error(`Resolution for ${orphan.flagId} matches no detected flag`);
  return flags.map((f) => {
    const r = byId.get(f.id);
    if (!r) return { ...f, status: "waiting", driverSide: { state: "not-asked" }, recoveredInr: 0 };
    const driverSide: Flag["driverSide"] = r.driverSide.text
      ? { state: r.driverSide.state, text: r.driverSide.text }
      : { state: r.driverSide.state };
    return { ...f, status: r.status, driverSide, recoveredInr: r.recoveredInr };
  });
}
