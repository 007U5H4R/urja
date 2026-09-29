import { describe, expect, it } from "vitest";

import { haversineM } from "../geo";
import { getDataset } from "../index";
import { BEHROR_PARKING_0926_04 } from "../places";
import { routeById } from "../routes";
import type { LngLat } from "../types";
import { getTripMapView, simplifyPath } from "./trip-map";

// TSK-10.4: the trip route map's geometry (map.js tripMap()), computed from the trip's GPS samples.

const near = (a: readonly number[], b: readonly number[], m: number) => haversineM(a as LngLat, b as LngLat) <= m;

describe("simplifyPath", () => {
  it("drops collinear and repeated points, keeps the ends and real corners", () => {
    const line: LngLat[] = [
      [75, 26], [75, 26], [75.5, 26], [76, 26], [76, 26.5], [76, 26.5], [76, 27],
    ];
    expect(simplifyPath(line, 50)).toEqual([[75, 26], [76, 26], [76, 27]]);
  });

  it("keeps a 1.6 km detour at a 50 m tolerance, and rounds to 5 decimals", () => {
    const line: LngLat[] = [[76, 27], [76.2, 27.0144], [76.3, 27], [76.35, 27.0000001], [76.4, 27]];
    expect(simplifyPath(line, 50)).toEqual([[76, 27], [76.2, 27.0144], [76.3, 27], [76.4, 27]]);
    expect(simplifyPath([[76.123456789, 27.987654321], [76.5, 28]], 50)).toEqual([[76.12346, 27.98765], [76.5, 28]]);
  });

  it("handles 0, 1 and 2 points", () => {
    expect(simplifyPath([], 50)).toEqual([]);
    expect(simplifyPath([[1, 2]], 50)).toEqual([[1, 2]]);
    expect(simplifyPath([[1, 2], [1, 2]], 50)).toEqual([[1, 2]]);
  });
});

describe("getTripMapView · 0926-04 (R1, the mocked trip)", () => {
  const v = getTripMapView("0926-04")!;

  it("draws the plan as the route's path and the actual route from the samples", () => {
    expect(v.plan).toEqual(routeById("JAI-OKH").path.map((p) => [...p]));
    expect(v.actual[0]).toEqual([75.787, 26.912]);
    expect(v.actual[v.actual.length - 1]).toEqual([77.27, 28.53]);
    // The detour to the parking spot survives simplification.
    expect(v.actual.some((p) => near(p, BEHROR_PARKING_0926_04, 50))).toBe(true);
    expect(v.actual.length).toBeLessThan(80);
    expect(v.lit).toBeNull();
  });

  it("lights the parking spot and lists the trip's events in order", () => {
    expect(near(v.focus, BEHROR_PARKING_0926_04, 50)).toBe(true);
    expect(v.events.map((e) => [e.kind, e.label])).toEqual([
      ["end", "Jaipur · 9:05 PM"],
      ["ok", "Shahpura dhaba · fuel steady"],
      ["bad", "Parked near Behror · −38 L"],
      ["fuel", "Neemrana pump · bill matches"],
      ["end", "Okhla · 6:40 AM"],
    ]);
  });

  it("describes the map in words (TC-031)", () => {
    expect(v.ariaLabel).toBe(
      "Route map: planned NH48 route from Jaipur to Okhla, Delhi, and the actual route, which leaves the highway for 1.6 km near Behror where fuel dropped",
    );
  });

  it("bounds every drawn point", () => {
    const [[w, s], [e, n]] = v.bounds;
    for (const [x, y] of [...v.plan, ...v.actual]) {
      expect(x).toBeGreaterThanOrEqual(w);
      expect(x).toBeLessThanOrEqual(e);
      expect(y).toBeGreaterThanOrEqual(s);
      expect(y).toBeLessThanOrEqual(n);
    }
  });
});

describe("getTripMapView · other variants", () => {
  it("R2 lights the pump whose bill doesn't match the tank", () => {
    const v = getTripMapView("0927-02")!;
    expect(v.focus).toEqual([74.86, 26.58]);
    const bad = v.events.filter((e) => e.kind === "bad");
    expect(bad.map((e) => e.label)).toEqual(["Kishangarh pump · bill 250 L, tank +200 L"]);
    expect(v.ariaLabel).toContain("the short refuel was at Kishangarh pump");
  });

  it("R3 has no single spot: the lamp sits on the route's stretch (Udaipur)", () => {
    const v = getTripMapView("0926-11")!;
    expect(v.focus).toEqual([73.71, 24.58]);
    expect(v.events.some((e) => e.kind === "bad")).toBe(false);
    expect(v.ariaLabel).toContain("spread across the whole trip");
  });

  it("R4 lights the extra-km segment, which lies off the plan", () => {
    const f = getDataset().flags.find((x) => x.rule === "R4" && x.status !== "wrong" && x.until !== undefined)!;
    const v = getTripMapView(f.tripId)!;
    expect(v.lit).not.toBeNull();
    expect(v.lit!.length).toBeGreaterThanOrEqual(2);
    expect(v.ariaLabel).toMatch(/off the plan/);
  });

  it("a live trip ends at its last reading, on the road", () => {
    const id = getDataset().live[0].id;
    const v = getTripMapView(id)!;
    expect(v.events[v.events.length - 1].label).toMatch(/on the road$/);
  });

  it("an unknown trip is null", () => {
    expect(getTripMapView("0999-99")).toBeNull();
  });
});
