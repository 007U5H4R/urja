// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { getToday } from "@/lib/data/views/today";
import { addMarker, FLY, heroCamera, type MapLibre } from "./hero-map";
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

  it("frames the fleet flat-on at map.js's pitch", () => {
    const c = heroCamera(getToday().fleetNow.bounds, "fleet", false);
    expect([c.pitch, c.bearing]).toEqual([38, 0]);
  });

  it("flies for 1.4 s on curve 1.3 (Design.md §15)", () => {
    expect(FLY).toEqual({ duration: 1400, curve: 1.3 });
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
