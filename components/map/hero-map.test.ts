// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { getToday } from "@/lib/data/views/today";
import { addMarker, CITY_LABEL_HANG, FLY, heroCamera, layoutLabels, RAIL_CLEAR, type MapLibre } from "./hero-map";
import { tripCamera } from "./trip-map";

// TSK-10.2: cameras follow the data; map.js hand-set pitch 56 / 52 / 42 (phone 45 / 40 / 30) and bearing 24 / 28 / 8.

const hero = getToday().hero;

describe("heroCamera", () => {
  it("tilts short routes steeply and long ones flatter, close to map.js", () => {
    const desk = hero.map((f) => heroCamera(f.map.bounds, "flag", false));
    const phone = hero.map((f) => heroCamera(f.map.bounds, "flag", true));
    const within = (a: number[], b: number[], d: number) => a.every((x, i) => Math.abs(x - b[i]) <= d);
    expect(within(desk.map((c) => c.pitch), [56, 52, 42], 3)).toBe(true);
    expect(within(phone.map((c) => c.pitch), [45, 40, 30], 3)).toBe(true);
    expect(desk[2].bearing).toBeLessThan(desk[0].bearing);
  });

  it("keeps the route clear of the glass card on the desktop, and not on the phone", () => {
    expect(heroCamera(hero[0].map.bounds, "flag", false).padding.right).toBeGreaterThan(272);
    expect(heroCamera(hero[0].map.bounds, "flag", true).padding.right).toBeLessThan(60);
  });

  it("keeps the route's end-city label clear of the rail box (DES-13)", () => {
    // The rail box of a flag rises 122 px above the map's bottom on the desktop (108 + 14) and
    // 140 px on the phone (its header wraps; measured at 375); a city label hangs 28 px below its point.
    const RAIL_RISE = { desktop: 122, compact: 140 };
    expect(CITY_LABEL_HANG).toBe(28);
    for (const f of hero) {
      expect(heroCamera(f.map.bounds, "flag", false).padding.bottom).toBe(RAIL_CLEAR.desktop);
      expect(heroCamera(f.map.bounds, "flag", true).padding.bottom).toBe(RAIL_CLEAR.compact);
    }
    expect(RAIL_CLEAR.desktop - RAIL_RISE.desktop - CITY_LABEL_HANG).toBeGreaterThanOrEqual(12);
    expect(RAIL_CLEAR.compact - RAIL_RISE.compact - CITY_LABEL_HANG).toBeGreaterThanOrEqual(12);
    // The fleet's one-line rail box keeps its padding.
    expect(heroCamera(getToday().fleetNow.bounds, "fleet", false).padding.bottom).toBe(142);
    expect(heroCamera(getToday().fleetNow.bounds, "fleet", true).padding.bottom).toBe(152);
  });

  it("frames the fleet flat-on at map.js's pitch", () => {
    const c = heroCamera(getToday().fleetNow.bounds, "fleet", false);
    expect([c.pitch, c.bearing]).toEqual([38, 0]);
  });

  it("flies for 1.4 s on curve 1.3 (Design.md §15)", () => {
    expect(FLY).toEqual({ duration: 1400, curve: 1.3 });
  });
});

describe("layoutLabels (DES-12)", () => {
  const label = { w: 40, h: 20 };
  const city = (x: number, y: number) => ({ p: { x, y }, size: { w: 30, h: 20 } });
  const BELOW: [number, number] = [0, 8];
  const ABOVE: [number, number] = [0, -28];

  it("keeps a flag's label right of its marker, and every city label below its point, when nothing touches", () => {
    expect(layoutLabels([{ x: 100, y: 100 }], [label], [city(300, 300)])).toEqual({ side: ["right"], city: [BELOW] });
  });

  it("moves a flag's label left of its marker when the right side covers a city label (Behror on Delhi)", () => {
    expect(layoutLabels([{ x: 100, y: 100 }], [label], [city(135, 85)])).toEqual({ side: ["left"], city: [BELOW] });
  });

  it("when both sides of the flag are taken, moves the covered city label above its point instead of hiding it", () => {
    const r = layoutLabels([{ x: 100, y: 100 }], [label], [city(135, 85), city(65, 85)]);
    expect(r).toEqual({ side: ["right"], city: [ABOVE, BELOW] });
  });

  it("keeps flag labels off each other, and moves a city label boxed in by two markers further out", () => {
    const r = layoutLabels(
      [
        { x: 100, y: 100 },
        { x: 100, y: 112 },
      ],
      [label, label],
      [city(100, 116)],
    );
    expect(r).toEqual({ side: ["right", "left"], city: [[0, 24]] });
  });

  it("hides a city label only when every spot is covered", () => {
    // A marker on each of the six spots around a city at (0, 0).
    const marks = [
      [0, 18],
      [0, -18],
      [23, 0],
      [-23, 0],
      [0, 34],
      [0, -34],
    ].map(([x, y]) => ({ x, y }));
    expect(layoutLabels(marks, marks.map(() => null), [city(0, 0)]).city).toEqual([null]);
  });

  it("moves the one flag label in the way to its other side rather than hide a city (Jaipur at 375 in Fleet view)", () => {
    // Markers block the city's four near spots and the spot far above; a flag label blocks the spot far below.
    const marks = [
      [0, 6],
      [0, -18],
      [23, 0],
      [-23, 0],
      [0, -34],
      [-40, 41],
    ].map(([x, y]) => ({ x, y }));
    const places = [null, null, null, null, null, label];
    expect(layoutLabels(marks, places, [city(0, 0)])).toEqual({ side: ["right", "right", "right", "right", "right", "left"], city: [[0, 24]] });
  });

  it("places cities in data order, so the first (Jaipur) keeps the spot two labels want", () => {
    const r = layoutLabels([], [], [city(100, 100), city(100, 104)]);
    expect(r.city[0]).toEqual(BELOW);
    expect(r.city[1]).not.toEqual(BELOW);
  });
});

describe("tripCamera", () => {
  it("uses map.js tripMap's tilt and bearing", () => {
    const b = hero[0].map.bounds;
    expect([tripCamera(b, false).pitch, tripCamera(b, false).bearing]).toEqual([55, 26]);
    expect(tripCamera(b, true).pitch).toBe(42);
  });
});

describe("addMarker", () => {
  // MapLibre's addTo() stamps aria-label="Map marker" on every marker element.
  class FakeMarker {
    el: HTMLElement;
    constructor(o: { element: HTMLElement }) {
      this.el = o.element;
    }
    setLngLat() {
      return this;
    }
    addTo() {
      this.el.setAttribute("aria-label", "Map marker");
      return this;
    }
  }
  const ml = { Marker: FakeMarker } as unknown as MapLibre;
  const map = {} as never;

  it("keeps a button's own label", () => {
    const b = document.createElement("button");
    addMarker(ml, map, b, [76, 27], "Show flag 1 on the map");
    expect(b.getAttribute("aria-label")).toBe("Show flag 1 on the map");
    expect(b.hasAttribute("aria-hidden")).toBe(false);
  });

  it("hides a decorative marker from assistive tech instead of calling it 'Map marker'", () => {
    const d = document.createElement("div");
    addMarker(ml, map, d, [76, 27], null);
    expect(d.hasAttribute("aria-label")).toBe(false);
    expect(d.getAttribute("aria-hidden")).toBe("true");
    expect(vi.isMockFunction(addMarker)).toBe(false);
  });
});
