import { describe, expect, it } from "vitest";

import { haversineM } from "../geo";
import { BEHROR_PARKING_0926_04 } from "../places";
import type { LngLat } from "../types";
import { getToday, roadOf } from "./today";
import { getTripMapView } from "./trip-map";

// TSK-10.2 / 10.3: the hero card's glass card, rail and map data (final/index.html FL[], showFleet, map.js),
// every value computed from the dataset.

const R = "₹";
const v = getToday();
const near = (a: readonly number[], b: readonly number[], m: number) => haversineM(a as LngLat, b as LngLat) <= m;

describe("hero flags (the glass card and rail per flag)", () => {
  it("has the three eyes rows' flags, in the same order", () => {
    expect(v.hero.map((f) => [f.n, f.tripId, f.plate])).toEqual([
      [1, "0926-04", "RJ14 GB 4521"],
      [2, "0927-02", "RJ14 GA 1182"],
      [3, "0926-11", "RJ14 GC 3309"],
    ]);
    expect(v.hero.map((f) => f.tripId)).toEqual(v.eyes.map((e) => e.tripId));
  });

  it("builds flag 1's card as the mockup shows it", () => {
    const f = v.hero[0];
    expect(f.trip).toBe("Trip 0926-04");
    expect(f.who).toBe("Ramesh Kumar · Jaipur → Delhi (Okhla)");
    expect(f.inr).toBe(3420);
    expect(f.rows).toEqual([
      { label: "Diesel unaccounted", value: "38 L" },
      { label: "Where", value: "Parked near Behror" },
      { label: "When", value: "2:14 AM" },
      { label: "Confidence", confidence: "high" },
    ]);
    expect(f.cta).toEqual({ text: "Open the evidence", href: "/trips/0926-04" });
  });

  it("builds flag 2's and flag 3's rows from the bill and the truck's normal", () => {
    expect(v.hero[1].trip).toBe("Trip 0927-02");
    expect(v.hero[1].who).toBe("Vikram Choudhary · Ahmedabad → Jaipur");
    expect(v.hero[1].rows).toEqual([
      { label: "Bill says", value: "250 L" },
      { label: "Tank rose", value: "200 L" },
      { label: "Where", value: "Kishangarh pump" },
      { label: "Confidence", confidence: "likely" },
    ]);
    expect(v.hero[2].who).toBe("Anil Bairwa · Jaipur → Bhiwandi");
    expect(v.hero[2].rows).toEqual([
      { label: "Used", value: "364 L" },
      { label: "This truck’s normal", value: "325 L" },
      { label: "Load", value: "26 t (usual 22 t)" },
      { label: "Confidence", confidence: "check" },
    ]);
    expect(v.hero.map((f) => f.inr)).toEqual([3420, 4500, 3510]);
  });

  it("gives each flag the trip's tick rail, with the mockup's heads and knobs", () => {
    expect(v.hero.map((f) => [f.rail.head, f.rail.sub, f.rail.ends, f.rail.total, f.rail.step, f.rail.knob?.label ?? null])).toEqual([
      ["Night of 26–27 Sep", "286 km on NH48", ["9:05 PM · Jaipur", "6:40 AM · Okhla"], 575, 5, "2:14 AM · −38 L"],
      ["Sun 27 Sep", "662 km", ["3:50 AM · Ahmedabad", "7:00 PM · Jaipur"], 910, 10, "4:50 PM · bill ≠ tank"],
      ["26–27 Sep", "1,150 km · spread across the trip, no single stop", ["4:30 AM · Jaipur", "8:10 AM · Bhiwandi"], 1660, 20, null],
    ]);
    expect(v.hero[0].rail.segs.some((s) => s.s === "flag")).toBe(true);
  });

  it("places each flag on the map with its route, and the plan only where the truck left it", () => {
    const [a, b, c] = v.hero;
    expect(near(a.map.at, BEHROR_PARKING_0926_04, 50)).toBe(true);
    expect(a.map.place).toBe("Behror");
    expect(a.map.plan).not.toBeNull();
    expect(b.map.at).toEqual([74.86, 26.58]);
    expect(b.map.place).toBe("Kishangarh pump");
    expect(b.map.plan).toBeNull();
    expect(c.map.at).toEqual([73.71, 24.58]);
    expect(c.map.place).toBe("whole trip");
    expect(c.map.plan).toBeNull();
    for (const f of v.hero) {
      expect(f.map.route).toEqual(getTripMapView(f.tripId)!.actual);
      expect(f.map.markerLabel).toBe(`Show flag ${f.n} on the map`);
    }
  });

  it("describes the selected flag in the map's aria-label", () => {
    expect(v.hero[0].map.ariaLabel).toBe(
      "Map of the three flagged trips. Selected: RJ14 GB 4521, Jaipur to Delhi, parked near Behror when 38 litres of diesel went unaccounted.",
    );
    expect(v.hero[1].map.ariaLabel).toBe(
      "Map of the three flagged trips. Selected: RJ14 GA 1182, Ahmedabad to Jaipur, where the fuel bill at Kishangarh pump was 50 litres more than the tank rose.",
    );
    expect(v.hero[2].map.ariaLabel).toBe(
      "Map of the three flagged trips. Selected: RJ14 GC 3309, Jaipur to Bhiwandi, which used 39 litres more diesel than this truck’s normal, spread across the trip.",
    );
  });

  it("types no rupee amount into any string (components add the sign)", () => {
    expect(JSON.stringify(v.hero)).not.toContain(R);
  });
});

describe("fleetNow (the Fleet view)", () => {
  const f = v.fleetNow;
  it("has 24 trucks: 11 moving, 12 in a yard, 1 in the workshop", () => {
    expect(f.trucks).toHaveLength(24);
    const count = (s: string) => f.trucks.filter((t) => t.state === s).length;
    expect([count("moving"), count("yard"), count("workshop")]).toEqual([11, 12, 1]);
    expect(f.title).toBe("24 trucks");
    expect(f.legend).toEqual([
      { state: "moving", label: "On a trip", count: 11 },
      { state: "yard", label: "In a yard", count: 12 },
      { state: "workshop", label: "Workshop", count: 1 },
    ]);
  });

  it("carries the card's copy and the rail head at the demo clock", () => {
    expect(f.updated).toBe("updated just now");
    expect(f.cta).toEqual({ text: "See every truck", href: "#trucks" });
    expect(f.railHead).toBe("Now, 7:12 AM");
    expect(f.railNote).toBe("Numbered markers are yesterday’s 3 flags");
    expect(f.ariaLabel).toBe(
      "Map of all 24 trucks now: 11 on a trip, 12 in a yard, 1 in the workshop. Numbered markers are yesterday’s 3 flags.",
    );
  });
});

describe("heroScene and mapCities", () => {
  it("describes flag 1's moment for the scene and its tag", () => {
    expect(v.heroScene).toEqual({
      plate: "RJ14 GB 4521",
      status: "Parked · ignition off",
      loss: "Fuel −38 L · 2:14 AM",
      source: "Reconstruction from GPS + fuel sensor",
      poster: "/truck-scene.png",
      ariaLabel:
        "3D scene of truck RJ14 GB 4521 parked 1.6 km off NH48 near Behror at 2:14 AM with its ignition off. The fuel tank is lit red because 38 litres went unaccounted.",
    });
  });

  it("labels the four cities map.js labels", () => {
    expect(v.mapCities.map((c) => c.name)).toEqual(["Jaipur", "Delhi", "Ahmedabad", "Mumbai"]);
    expect(v.mapCities[0].lngLat).toEqual([75.787, 26.912]);
  });
});

describe("roadOf", () => {
  it("names NH48 for intercity routes and the planned route for a local run", () => {
    expect(roadOf("JAI-OKH")).toBe("NH48");
    expect(roadOf("JAI-LOC-73")).toBe("the planned route");
  });
});
