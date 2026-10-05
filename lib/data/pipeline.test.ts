import { describe, expect, it } from "vitest";
import { dayKey, istMin } from "@/lib/clock";
import { kmPerLitre, truckByPlate } from "./fleet";
import { applyResolutions, buildDataset } from "./pipeline";
import { routeById } from "./routes";
import type { Flag, Trip } from "./types";

// A self-check that the data reaches §4.3's numbers. The full golden suite is TSK-02.7.
const ds = buildDataset();
const septDay = (k: string) => (k >= "2026-09-01" && k <= "2026-09-27" ? Number(k.slice(8)) : 0);
const sept = ds.trips.filter((t) => septDay(dayKey(t.end)) > 0);
const L = ds.ledgers;
const sum = (ts: Trip[], f: (id: string) => number) => ts.reduce((a, t) => a + f(t.id), 0);
const flag = (tripId: string, rule: string) => ds.flags.find((f) => f.tripId === tripId && f.rule === rule)!;

describe("pipeline self-check (§4.3)", () => {
  it("yesterday (27 Sep): 17 trips, ₹4,12,000 − ₹1,58,300 − ₹38,900 − ₹28,400 = ₹1,86,400", () => {
    const y = sept.filter((t) => dayKey(t.end) === "2026-09-27");
    expect([
      y.length,
      sum(y, (i) => L[i].freightInr),
      sum(y, (i) => L[i].dieselInr),
      sum(y, (i) => L[i].tollsInr),
      sum(y, (i) => L[i].allowanceInr + L[i].otherInr),
      sum(y, (i) => L[i].profitInr),
      sum(y, (i) => L[i].unaccountedInr),
      sum(y, (i) => L[i].unaccountedCl) / 100,
    ]).toEqual([17, 412_000, 158_300, 38_900, 28_400, 186_400, 11_430, 127]);
    expect(y.filter((t) => routeById(t.routeId).stretches.includes("udaipur"))).toHaveLength(6);
  });

  it("September: 212 trips, 23 flags (18 confirmed, 3 waiting, 2 wrong), ₹58,240 flagged, ₹21,600 recovered, 412 L of diesel", () => {
    expect(sept).toHaveLength(212);
    expect(ds.live).toHaveLength(11);
    const f = ds.flags;
    const n = (s: Flag["status"]) => f.filter((x) => x.status === s).length;
    expect([f.length, n("confirmed"), n("waiting"), n("wrong")]).toEqual([23, 18, 3, 2]);
    expect([f.reduce((a, x) => a + x.inr, 0), f.reduce((a, x) => a + x.recoveredInr, 0)]).toEqual([58_240, 21_600]);
    const diesel = f.filter((x) => x.rule === "R1" || x.rule === "R2" || x.rule === "R3");
    expect([diesel.length, diesel.reduce((a, x) => a + x.litres!, 0)]).toEqual([9, 412]);
  });

  it("detects exactly the injected anomalies, one to one (TC-011 completeness)", () => {
    const injected: string[] = [];
    for (const s of ds.scenario.trips) {
      for (const j of s.injections) {
        if (j.kind === "stationary-drop") injected.push(`${s.id} R1 ${j.litres}`);
        if (j.kind === "refuel-short") injected.push(`${s.id} R2 ${j.missingCl / 100}`);
        if (j.kind === "excess") injected.push(`${s.id} R3 ${j.litres}`);
        if (j.kind === "detour") injected.push(`${s.id} R4 ${Math.round((j.km * 90) / kmPerLitre(truckByPlate(s.plate), s.routeId) / 10) * 10}`);
        if (j.kind === "toll-claim") injected.push(`${s.id} R5 ${j.inr}`);
      }
    }
    const detected = ds.flags.map((f) => `${f.tripId} ${f.rule} ${f.rule === "R4" || f.rule === "R5" ? f.inr : f.litres}`);
    expect(detected.sort()).toEqual(injected.sort());
    expect(injected).toHaveLength(23);
  });

  it("never lets the rules see the injections", () => {
    for (const t of [...ds.trips, ...ds.live]) expect(Object.keys(t)).not.toContain("injections");
  });

  it("grades flag 1 High, flag 2 Likely, flag 3 Check", () => {
    expect([flag("0926-04", "R1").confidence, flag("0927-02", "R2").confidence, flag("0926-11", "R3").confidence]).toEqual(["high", "likely", "check"]);
  });

  it("explains flag 1 as the mockup does (2:14–2:40 AM, ±2 L, 19×)", () => {
    const f = flag("0926-04", "R1");
    expect([f.at, f.until, f.placeId, f.litres, f.inr]).toEqual([istMin(2026, 9, 27, 2, 14), istMin(2026, 9, 27, 2, 40), "behror", 38, 3420]);
    expect(f.evidence.map((e) => [e.text.en, e.source])).toEqual([
      ["Fuel fell 168 → 130 L in 26 minutes", "Fuel sensor"],
      ["Parked with ignition off, 2:08–2:44 AM", "GPS · ignition"],
      ["1.6 km off NH48; nearest pump is 3.1 km away", "Geofence"],
      ["Same stretch flagged 4 more times this month", "Fleet history"],
    ]);
    expect(f.whyConfidence.en).toBe("The fuel sensor stayed within ±2 L for the rest of the trip, so a 38 L drop is about 19× its normal noise.");
    expect(f.evidence.every((e) => e.text.hi.length > 0)).toBe(true);
  });

  it("applies the owner's resolutions (D1–D9, N7 and N14 wrong)", () => {
    expect([flag("0926-04", "R1").status, flag("0926-04", "R1").driverSide.state]).toEqual(["waiting", "not-asked"]);
    expect([flag("0927-02", "R2").driverSide.state, flag("0927-02", "R2").driverSide.text?.en]).toEqual(["replied", "The nozzle stopped early; I told the attendant."]);
    expect([flag("0923-02", "R1").status, flag("0923-02", "R1").recoveredInr]).toEqual(["confirmed", 1800]);
    const wrong = ds.flags.filter((f) => f.status === "wrong").map((f) => [f.rule, f.inr, f.driverSide.state]);
    expect(wrong.sort()).toEqual([["R4", 6780, "cleared"], ["R5", 1450, "cleared"]]);
  });

  it("dates flags by trip end (IST), and keeps every September flag on a September trip", () => {
    const ids = new Set(sept.map((t) => t.id));
    for (const f of ds.flags) {
      expect(ids.has(f.tripId)).toBe(true);
      expect(f.dayKey).toBe(dayKey(ds.trips.find((t) => t.id === f.tripId)!.end));
    }
  });

  it("charges whole litres of diesel on every trip but 27 Sep's balancer", () => {
    const fractional = ds.trips.filter((t) => L[t.id].dieselCl % 100 !== 0);
    expect(fractional.length).toBeLessThanOrEqual(1);
    for (const t of fractional) {
      expect(dayKey(t.end)).toBe("2026-09-27");
      expect(ds.flags.some((f) => f.tripId === t.id)).toBe(false);
    }
  });

  it("refuses a resolution that matches no flag", () => {
    const r = { flagId: "0101-01-R1", status: "confirmed" as const, driverSide: { state: "confirmed" as const }, recoveredInr: 0 };
    expect(() => applyResolutions(ds.flags, [r])).toThrow(/0101-01-R1/);
  });

  it("ledgers every finished trip and no live one", () => {
    expect(Object.keys(L).sort()).toEqual(ds.trips.map((t) => t.id).sort());
    for (const t of ds.live) expect(L[t.id]).toBeUndefined();
  });
});
