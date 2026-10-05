import { describe, expect, it } from "vitest";
import { distanceToPathM, haversineM, pathLengthM } from "./geo";
import { BEHROR_PARKING_0926_04, placeById } from "./places";
import {
  INTERCITY_ROUTE_IDS,
  LOCAL_KM_MAX,
  LOCAL_KM_MIN,
  ROUTES,
  STRETCHES,
  isLocalRoute,
  isOnStretch,
  kmAlongRoute,
  localRoute,
  pointAtKm,
  routeById,
  routeName,
  routeScale,
} from "./routes";

const PLANNED: Record<string, number> = {
  "JAI-OKH": 286, "OKH-JAI": 286,
  "JAI-MAN": 230, "MAN-JAI": 230,
  "JAI-AHM": 662, "AHM-JAI": 662,
  "JAI-BHW": 1150, "BHW-JAI": 1150,
  "JAI-KSG": 105, "KSG-JAI": 105,
};

describe("route library (§4.7)", () => {
  it("has the ten intercity routes with unique ids and contract km", () => {
    const ids = ROUTES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(Object.keys(PLANNED).sort());
    expect([...INTERCITY_ROUTE_IDS].sort()).toEqual([...ids].sort());
    for (const r of ROUTES) expect(r.plannedKm, r.id).toBe(PLANNED[r.id]);
  });

  it("JAI-OKH is 286 km", () => {
    expect(routeById("JAI-OKH").plannedKm).toBe(286);
  });

  it("every plaza and pump names a real place of the right kind", () => {
    for (const r of ROUTES) {
      for (const pl of r.plazas) expect(placeById(pl.placeId).kind, `${r.id} ${pl.placeId}`).toBe("plaza");
      for (const id of r.pumps) expect(placeById(id).kind, `${r.id} ${id}`).toBe("pump");
      placeById(r.from);
      placeById(r.to);
    }
  });

  it("plazas are ordered, inside the route, and where their place is on the path", () => {
    for (const r of ROUTES) {
      let prev = 0;
      for (const pl of r.plazas) {
        expect(pl.atKm).toBeGreaterThan(prev);
        expect(pl.atKm).toBeLessThan(r.plannedKm);
        expect(pl.tariffInr).toBeGreaterThanOrEqual(100);
        expect(pl.tariffInr).toBeLessThanOrEqual(1500);
        const { km, offPathM } = kmAlongRoute(r, placeById(pl.placeId).lngLat);
        expect(offPathM, `${r.id} ${pl.placeId}`).toBeLessThan(100);
        expect(Math.abs(km - pl.atKm), `${r.id} ${pl.placeId}`).toBeLessThanOrEqual(0.5);
        prev = pl.atKm;
      }
    }
  });

  it("pumps lie on their route path", () => {
    for (const r of ROUTES) {
      for (const id of r.pumps) {
        expect(distanceToPathM(placeById(id).lngLat, r.path), `${r.id} ${id}`).toBeLessThan(100);
      }
    }
  });

  it("paths start at `from` and end at `to`", () => {
    for (const r of ROUTES) {
      expect(haversineM(r.path[0], placeById(r.from).lngLat), r.id).toBeLessThan(10);
      expect(haversineM(r.path[r.path.length - 1], placeById(r.to).lngLat), r.id).toBeLessThan(10);
    }
  });

  it("reverse routes mirror their forward route", () => {
    for (const id of ["JAI-OKH", "JAI-MAN", "JAI-AHM", "JAI-BHW", "JAI-KSG"]) {
      const f = routeById(id);
      const [a, b] = id.split("-");
      const r = routeById(`${b}-${a}`);
      expect(r.path).toEqual([...f.path].reverse());
      expect(r.from).toBe(f.to);
      expect(r.to).toBe(f.from);
      expect(r.pumps).toEqual([...f.pumps].reverse());
      expect(r.stretches).toEqual(f.stretches);
      expect(r.plazas).toEqual(
        [...f.plazas].reverse().map((p) => ({ ...p, atKm: f.plannedKm - p.atKm })),
      );
    }
  });

  it("0926-04's plazas: Manoharpur ₹705, Shahjahanpur ₹725, Kherki Daula ₹710 (₹2,140)", () => {
    const r = routeById("JAI-OKH");
    expect(r.plazas.map((p) => [p.placeId, p.tariffInr])).toEqual([
      ["manoharpur-plaza", 705],
      ["shahjahanpur-plaza", 725],
      ["kherki-daula-plaza", 710],
    ]);
    expect(r.plazas.reduce((s, p) => s + p.tariffInr, 0)).toBe(2140);
    // Timeline order: Shahpura dhaba (t95–145) < Manoharpur (t163) < Behror (t303)
    // < Neemrana refuel (3:10 AM) < Shahjahanpur (t386) < Kherki Daula (t527).
    const km = (id: string) => kmAlongRoute(r, placeById(id).lngLat).km;
    const parking = kmAlongRoute(r, BEHROR_PARKING_0926_04).km;
    expect(km("shahpura-dhaba")).toBeLessThan(r.plazas[0].atKm);
    expect(r.plazas[0].atKm).toBeLessThan(parking);
    expect(parking).toBeLessThan(km("neemrana-hp"));
    expect(km("neemrana-hp")).toBeLessThan(r.plazas[1].atKm);
    expect(r.plazas[1].atKm).toBeLessThan(r.plazas[2].atKm);
    // Manoharpur is 18 min after leaving the dhaba at the leg's pace to Behror.
    expect(r.plazas[0].atKm).toBeGreaterThan(km("shahpura-dhaba") + 5);
    expect(r.plazas[0].atKm).toBeLessThan(km("shahpura-dhaba") + 15);
  });

  it("tags the behror and udaipur stretches in both directions", () => {
    for (const id of ["JAI-OKH", "OKH-JAI", "JAI-MAN", "MAN-JAI"]) {
      expect(routeById(id).stretches).toEqual(["behror"]);
    }
    for (const id of ["JAI-AHM", "AHM-JAI", "JAI-BHW", "BHW-JAI"]) {
      expect(routeById(id).stretches).toEqual(["udaipur"]);
    }
    expect(routeById("JAI-KSG").stretches).toEqual([]);
    expect(Object.keys(STRETCHES).sort()).toEqual(["behror", "udaipur"]);
  });

  it("the behror stretch covers the 0926-04 parking point and the udaipur stretch covers Udaipur", () => {
    const b = STRETCHES.behror;
    expect(haversineM(placeById(b.centerPlaceId).lngLat, BEHROR_PARKING_0926_04) / 1000).toBeLessThan(b.radiusKm);
    expect(haversineM(placeById("neemrana-hp").lngLat, placeById(b.centerPlaceId).lngLat) / 1000).toBeGreaterThan(b.radiusKm);
    expect(STRETCHES.udaipur.centerPlaceId).toBe("udaipur");
    expect(isOnStretch("behror", BEHROR_PARKING_0926_04)).toBe(true);
    expect(isOnStretch("behror", placeById("neemrana-hp").lngLat)).toBe(false);
    expect(isOnStretch("udaipur", placeById("udaipur-plaza").lngLat)).toBe(true);
    expect(isOnStretch("udaipur", placeById("kishangarh-pump").lngLat)).toBe(false);
  });
});

describe("km along a route", () => {
  it("maps planned km onto the path by a constant scale", () => {
    for (const r of ROUTES) {
      expect(routeScale(r), r.id).toBeGreaterThanOrEqual(1);
      expect(routeScale(r), r.id).toBeLessThanOrEqual(1.25);
      expect(pointAtKm(r, 0)).toEqual(r.path[0]);
      expect(pointAtKm(r, r.plannedKm)).toEqual(r.path[r.path.length - 1]);
      const p = pointAtKm(r, r.plannedKm * 0.37);
      const back = kmAlongRoute(r, p);
      expect(back.offPathM).toBeLessThan(1);
      expect(back.km).toBeCloseTo(r.plannedKm * 0.37, 1);
    }
  });

  it("the 0926-04 parking point is about 137 km into JAI-OKH", () => {
    const { km, offPathM } = kmAlongRoute(routeById("JAI-OKH"), BEHROR_PARKING_0926_04);
    expect(km).toBeGreaterThan(130);
    expect(km).toBeLessThan(145);
    expect(offPathM / 1000).toBeCloseTo(1.6, 1);
  });
});

describe("local Jaipur runs", () => {
  it("builds a loop from the Jaipur yard with exact planned km", () => {
    const r = localRoute(73);
    expect(r.id).toBe("JAI-LOC-73");
    expect(isLocalRoute(r.id)).toBe(true);
    expect(isLocalRoute("JAI-OKH")).toBe(false);
    expect(r.plannedKm).toBe(73);
    expect(r.from).toBe("jaipur-tn");
    expect(r.to).toBe("jaipur-tn");
    expect(r.path[0]).toEqual(placeById("jaipur-tn").lngLat);
    expect(r.path[r.path.length - 1]).toEqual(placeById("jaipur-tn").lngLat);
    expect(r.plazas).toEqual([]);
    expect(r.stretches).toEqual([]);
    const pathKm = pathLengthM(r.path) / 1000;
    expect(pathKm).toBeGreaterThan(73 * 0.8);
    expect(pathKm).toBeLessThanOrEqual(73);
  });

  it("round-trips through routeById and is deterministic", () => {
    expect(routeById("JAI-LOC-73")).toEqual(localRoute(73));
    expect(routeById("JAI-LOC-20.5").plannedKm).toBe(20.5);
  });

  it("accepts only canonical local ids and caches them", () => {
    expect(routeById("JAI-LOC-73")).toBe(routeById("JAI-LOC-73"));
    for (const bad of ["JAI-LOC-073", "JAI-LOC-73.0", "JAI-LOC-7.3e1", "JAI-LOC-", "JAI-LOC- 73", "JAI-LOC-0x49"]) {
      expect(() => routeById(bad), bad).toThrow(/Unknown route id/);
      expect(() => routeName(bad), bad).toThrow(/Unknown route id/);
    }
    expect(() => routeName("JAI-XYZ")).toThrow(/JAI-XYZ/);
  });

  it("rejects km outside 20–150", () => {
    expect(LOCAL_KM_MIN).toBe(20);
    expect(LOCAL_KM_MAX).toBe(150);
    expect(() => localRoute(19.9)).toThrow();
    expect(() => localRoute(150.1)).toThrow();
    expect(() => localRoute(Number.NaN)).toThrow();
    expect(localRoute(150).plannedKm).toBe(150);
  });

  it("routeById throws on an unknown id", () => {
    expect(() => routeById("JAI-XYZ")).toThrow(/JAI-XYZ/);
  });
});

describe("route names", () => {
  it("match the mockup copy", () => {
    expect(routeName("JAI-OKH")).toEqual({ en: "Jaipur → Delhi (Okhla)", hi: "जयपुर → दिल्ली (ओखला)" });
    expect(routeName("AHM-JAI").en).toBe("Ahmedabad → Jaipur");
    expect(routeName("JAI-BHW").en).toBe("Jaipur → Bhiwandi");
    expect(routeName("JAI-LOC-73").en).toBe("Jaipur local run");
  });
});

describe("immutability and input checks", () => {
  it("route paths, points and lists are frozen", () => {
    for (const r of [...ROUTES, routeById("JAI-LOC-40")]) {
      expect(Object.isFrozen(r), r.id).toBe(true);
      expect(Object.isFrozen(r.path), r.id).toBe(true);
      expect(Object.isFrozen(r.plazas), r.id).toBe(true);
      expect(Object.isFrozen(r.pumps), r.id).toBe(true);
      expect(Object.isFrozen(r.stretches), r.id).toBe(true);
      for (const p of r.path) expect(Object.isFrozen(p)).toBe(true);
      for (const p of r.plazas) expect(Object.isFrozen(p)).toBe(true);
    }
    const r = routeById("JAI-OKH");
    expect(() => {
      (r.path[0] as number[])[0] = 0;
    }).toThrow(TypeError);
    expect(routeById("OKH-JAI").path[12]).toEqual([75.787, 26.912]);
  });

  it("pointAtKm and kmAlongRoute return fresh, mutable values", () => {
    const r = routeById("JAI-OKH");
    const p = pointAtKm(r, 0);
    p[0] = 1;
    expect(r.path[0][0]).toBe(75.787);
  });

  it("pointAtKm throws on non-finite km", () => {
    const r = routeById("JAI-OKH");
    for (const km of [Number.NaN, Infinity, -Infinity]) expect(() => pointAtKm(r, km)).toThrow(RangeError);
  });
});

