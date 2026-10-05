import { describe, expect, it } from "vitest";
import { DEMO_NOW, dayKey } from "@/lib/clock";
import { FLEET } from "../fleet";
import { isLocalRoute, routeById } from "../routes";
import scenarioJson from "./scenario.json";
import { scenarioSchema } from "./schema";

const scenario = scenarioSchema.parse(scenarioJson);
const septEnded = scenario.trips.filter((t) => {
  const k = dayKey(t.end);
  return k >= "2026-09-01" && k <= "2026-09-27";
});

describe("scenario.json (TSK-02.3)", () => {
  it("parses against the schema", () => {
    expect(scenarioSchema.safeParse(scenarioJson).success).toBe(true);
    expect(scenario.version).toBe(1);
  });

  it("has unique trip ids, numbered by start date", () => {
    const ids = scenario.trips.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of scenario.trips) {
      const k = dayKey(t.start);
      expect(t.id.slice(0, 4)).toBe(k.slice(5, 7) + k.slice(8, 10));
    }
    // Sequence numbers are contiguous within each start day.
    const byDay = new Map<string, number[]>();
    for (const t of scenario.trips) byDay.set(t.id.slice(0, 4), [...(byDay.get(t.id.slice(0, 4)) ?? []), Number(t.id.slice(5))]);
    for (const nums of byDay.values()) expect([...nums].sort((a, b) => a - b)).toEqual(nums.map((_, i) => i + 1));
  });

  it("has 212 trips that end 1–27 Sep, and none that end on 28 Sep before 7:12 AM", () => {
    expect(septEnded).toHaveLength(212);
    expect(scenario.trips.filter((t) => dayKey(t.end) === "2026-09-28" && t.end <= DEMO_NOW)).toEqual([]);
  });

  it("never overlaps two trips of one truck, and chains each truck's locations", () => {
    for (const truck of FLEET) {
      const trips = scenario.trips.filter((t) => t.plate === truck.plate).sort((a, b) => a.start - b.start);
      for (let i = 1; i < trips.length; i++) {
        expect(trips[i].start).toBeGreaterThan(trips[i - 1].end);
        expect(routeById(trips[i].routeId).from).toBe(routeById(trips[i - 1].routeId).to);
      }
    }
  });

  it("has 11 trips on the road at DEMO_NOW, matching the now-positions (11 moving, 12 yard, 1 workshop)", () => {
    const live = scenario.trips.filter((t) => t.start <= DEMO_NOW && t.end > DEMO_NOW);
    expect(live).toHaveLength(11);
    const states = scenario.now.trucks.reduce<Record<string, number>>((a, n) => ({ ...a, [n.state]: (a[n.state] ?? 0) + 1 }), {});
    expect(states).toEqual({ moving: 11, yard: 12, workshop: 1 });
    expect(new Set(live.map((t) => t.plate))).toEqual(new Set(scenario.now.trucks.filter((n) => n.state === "moving").map((n) => n.plate)));
    expect(scenario.trips.every((t) => t.start <= DEMO_NOW)).toBe(true);
    expect(scenario.now.at).toBe(DEMO_NOW);
  });

  it("keeps the balancer values plausible (TC-013)", () => {
    for (const t of scenario.trips) {
      for (const p of t.tolls.plazas) {
        expect(p.inr).toBeGreaterThanOrEqual(100);
        expect(p.inr).toBeLessThanOrEqual(1500);
      }
      expect(t.otherInr).toBeGreaterThanOrEqual(200);
      expect(t.otherInr).toBeLessThanOrEqual(4000);
      if (isLocalRoute(t.routeId)) {
        const km = t.legs.reduce((a, l) => a + l.km, 0);
        expect(km).toBeGreaterThanOrEqual(20);
        expect(km).toBeLessThanOrEqual(150);
      }
    }
  });

  it("has one leg plan per trip that spans it: legs and stops tile [start, end]", () => {
    for (const t of scenario.trips) {
      const spans = [...t.legs.map((l) => [l.from, l.to]), ...t.stops.map((s) => [s.from, s.to])].sort((a, b) => a[0] - b[0]);
      expect(spans[0][0]).toBe(t.start);
      expect(spans[spans.length - 1][1]).toBe(t.end);
      for (let i = 1; i < spans.length; i++) expect(spans[i][0]).toBe(spans[i - 1][1]);
      expect(t.legs.reduce((a, l) => a + l.fuelCl, 0)).toBe(t.fuelUsedCl);
    }
  });

  it("keeps whole litres everywhere except 27 Sep's day-balancer trip (§4.9 #4, TP2)", () => {
    const fractional = scenario.trips.filter(
      (t) => t.fuelUsedCl % 100 !== 0 || t.startFuelCl % 100 !== 0 || t.refuels.some((r) => r.tankRiseCl % 100 !== 0 || r.billedCl % 100 !== 0),
    );
    expect(fractional.length).toBeLessThanOrEqual(1);
    for (const t of fractional) {
      expect(dayKey(t.end)).toBe("2026-09-27");
      expect(t.injections).toEqual([]);
    }
    for (const t of scenario.trips) for (const j of t.injections) if (j.kind === "stationary-drop") expect(Number.isInteger(j.litres)).toBe(true);
  });

  it("rejects malformed trips (strict keys, ordered times, valid refuel index)", () => {
    const t = scenario.trips.find((x) => x.injections.some((j) => j.kind === "refuel-short"))!;
    const trip = (patch: object) => scenarioSchema.shape.trips.element.safeParse({ ...t, ...patch }).success;
    expect(trip({})).toBe(true);
    expect(trip({ extra: 1 })).toBe(false);
    expect(trip({ end: t.start })).toBe(false);
    expect(trip({ legs: [{ ...t.legs[0], to: t.legs[0].from }] })).toBe(false);
    expect(trip({ refuels: [] })).toBe(false);
  });

  it("injects exactly the 23 §4.3 anomalies, all on trips that ended 1–27 Sep", () => {
    const ids = new Set(septEnded.map((t) => t.id));
    const injected = scenario.trips.flatMap((t) => t.injections.map(() => t.id));
    expect(injected).toHaveLength(23);
    expect(injected.every((id) => ids.has(id))).toBe(true);
    expect(scenario.resolutions).toHaveLength(23);
  });
});
