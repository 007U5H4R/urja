import { describe, expect, it } from "vitest";
import { ledgerFor } from "./ledger";
import { detectFlags } from "./rules";
import scenarioJson from "./scenario/scenario.json";
import { scenarioSchema } from "./scenario/schema";
import { simulateTrip } from "./simulate";

const scenario = scenarioSchema.parse(scenarioJson);
const trip = (id: string) => simulateTrip(scenario.trips.find((t) => t.id === id)!);

describe("ledgerFor (§4.5)", () => {
  it("0926-04: ₹28,000 − ₹10,620 (118 L, of which 38 L unaccounted) − ₹2,140 − ₹1,200 − ₹800 = ₹13,240", () => {
    const t = trip("0926-04");
    expect(ledgerFor(t, detectFlags(t))).toEqual({
      freightInr: 28_000,
      dieselCl: 11_800,
      dieselInr: 10_620,
      unaccountedCl: 3_800,
      unaccountedInr: 3_420,
      tollsInr: 2_140,
      allowanceInr: 1_200,
      otherInr: 800,
      profitInr: 13_240,
    });
  });

  it("charges a short-filled bill's missing litres as diesel, once (0927-02)", () => {
    const t = trip("0927-02");
    const flags = detectFlags(t);
    const l = ledgerFor(t, flags);
    const tank = t.tank.startCl + t.refuels.reduce((a, r) => a + r.tankRiseCl, 0) - t.tank.endCl;
    expect(l.dieselCl).toBe(tank + 5_000);
    expect([l.unaccountedCl, l.unaccountedInr]).toEqual([5_000, 4_500]);
    expect(l.profitInr).toBe(l.freightInr - l.dieselInr - l.tollsInr - l.allowanceInr - l.otherInr);
  });

  it("uses FASTag, not the claim, for tolls", () => {
    const s = scenario.trips.find((t) => t.injections.some((j) => j.kind === "toll-claim"))!;
    const t = simulateTrip(s);
    expect(ledgerFor(t, detectFlags(t)).tollsInr).toBe(s.tolls.plazas.reduce((a, p) => a + p.inr, 0));
    expect(t.claims.tollsInr).toBeGreaterThan(ledgerFor(t, []).tollsInr);
  });

  it("leaves flags marked wrong out of unaccounted (the diesel stays)", () => {
    const t = trip("0926-04");
    const flags = detectFlags(t).map((f) => ({ ...f, status: "wrong" as const }));
    const l = ledgerFor(t, flags);
    expect([l.dieselCl, l.unaccountedCl, l.unaccountedInr, l.profitInr]).toEqual([11_800, 0, 0, 13_240]);
  });

  it("ignores other trips' flags", () => {
    const t = trip("0926-04");
    const other = detectFlags(trip("0927-02"));
    expect(ledgerFor(t, other).unaccountedCl).toBe(0);
  });
});
