// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOAD_TIMEOUT_MS, mountHeroMap, mountTripMap, STYLE_URL, watchLoad } from "./map-client";
import type { HeroMapData } from "./hero-map";

// TSK-10.1: the map client's `ready` promise, the 8 s load timeout and every failure path call onFail once.

type Handler = (e?: unknown) => void;

/** A MapLibre stand-in: records options, lets the test fire `load` / `error`. */
function fakeMapLibre(opts: { throwOnCreate?: boolean } = {}) {
  const maps: FakeMap[] = [];
  class FakeMap {
    options: Record<string, unknown>;
    handlers = new Map<string, Handler[]>();
    removed = 0;
    calls: string[] = [];
    constructor(o: Record<string, unknown>) {
      if (opts.throwOnCreate) throw new Error("Failed to initialize WebGL");
      this.options = o;
      maps.push(this);
    }
    on(t: string, fn: Handler) {
      this.handlers.set(t, [...(this.handlers.get(t) ?? []), fn]);
      return this;
    }
    once(t: string, fn: Handler) {
      return this.on(t, fn);
    }
    off() {
      return this;
    }
    fire(t: string, e?: unknown) {
      for (const fn of this.handlers.get(t) ?? []) fn(e);
    }
    remove() {
      this.removed++;
    }
    getStyle() {
      return { layers: [{ id: "background", type: "background" }] };
    }
    setPaintProperty() {
      this.calls.push("setPaintProperty");
    }
    addSource() {}
    addLayer() {}
    getSource() {
      return { setData() {} };
    }
    setLayoutProperty() {}
    getContainer() {
      return document.createElement("div");
    }
    project() {
      return { x: 0, y: 0 };
    }
    cameraForBounds() {
      return { center: [76, 27], zoom: 7, bearing: 0 };
    }
    jumpTo(c: unknown) {
      this.calls.push(`jumpTo ${JSON.stringify(c)}`);
    }
    flyTo(c: unknown) {
      this.calls.push(`flyTo ${JSON.stringify(c)}`);
    }
    resize() {}
  }
  class FakeMarker {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  }
  const ml = { Map: FakeMap, Marker: FakeMarker } as unknown;
  return { ml, maps, load: () => Promise.resolve(ml as never) };
}

const DATA: HeroMapData = {
  flags: [1, 2, 3].map((n) => ({
    n,
    at: [76, 27],
    place: "",
    route: [
      [75, 26],
      [76, 27],
    ],
    plan: null,
    bounds: [
      [75, 26],
      [76, 27],
    ],
    markerLabel: `Show flag ${n} on the map`,
  })),
  fleet: { trucks: [{ lngLat: [75, 26], state: "moving" }], bounds: [[72, 19], [77, 28]] },
  cities: [],
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("watchLoad", () => {
  const emitter = () => {
    const h: Record<string, Handler[]> = {};
    return {
      on: (t: string, fn: Handler) => (h[t] = [...(h[t] ?? []), fn]),
      once: (t: string, fn: Handler) => (h[t] = [...(h[t] ?? []), fn]),
      fire: (t: string, e?: unknown) => (h[t] ?? []).forEach((fn) => fn(e)),
    };
  };

  it("resolves on load and ignores later errors", async () => {
    const m = emitter();
    const onFail = vi.fn();
    const w = watchLoad(m, { onFail });
    m.fire("load");
    await expect(w.ready).resolves.toBeUndefined();
    m.fire("error", { error: new Error("tile") });
    vi.advanceTimersByTime(LOAD_TIMEOUT_MS * 2);
    expect(onFail).not.toHaveBeenCalled();
  });

  it("fails once when nothing loads within 8 s", async () => {
    const m = emitter();
    const onFail = vi.fn();
    const w = watchLoad(m, { onFail });
    vi.advanceTimersByTime(LOAD_TIMEOUT_MS - 1);
    expect(onFail).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onFail).toHaveBeenCalledTimes(1);
    await expect(w.ready).rejects.toThrow(/timed out/);
    m.fire("error", { error: new Error("late") });
    m.fire("load");
    expect(onFail).toHaveBeenCalledTimes(1);
  });

  it("fails on a style or tile error before load", async () => {
    const m = emitter();
    const onFail = vi.fn();
    const w = watchLoad(m, { onFail });
    m.fire("error", { error: new Error("style 403") });
    expect(onFail).toHaveBeenCalledTimes(1);
    await expect(w.ready).rejects.toThrow("style 403");
  });

  it("cancel() stops the watch without failing", () => {
    const m = emitter();
    const onFail = vi.fn();
    watchLoad(m, { onFail }).cancel();
    vi.advanceTimersByTime(LOAD_TIMEOUT_MS * 2);
    expect(onFail).not.toHaveBeenCalled();
  });
});

describe("mountHeroMap", () => {
  const cb = () => ({ onSelect: vi.fn(), onFail: vi.fn(), onReady: vi.fn() });

  it("creates the warmed Carto map with a compact attribution and no rotation", async () => {
    const f = fakeMapLibre();
    const c = cb();
    const h = await mountHeroMap(document.createElement("div"), DATA, c, { view: "map", selected: 0 }, { load: f.load });
    const o = f.maps[0].options;
    expect(o.style).toBe(STYLE_URL);
    expect(o.attributionControl).toEqual({ compact: true });
    expect(o.dragRotate).toBe(false);
    f.maps[0].fire("load");
    await h.ready;
    expect(c.onReady).toHaveBeenCalledTimes(1);
    expect(c.onFail).not.toHaveBeenCalled();
    expect(f.maps[0].calls).toContain("setPaintProperty");
  });

  it("jumps on first show, flies 1.4 s with curve 1.3 on a change, and jumps under reduced motion", async () => {
    const f = fakeMapLibre();
    const h = await mountHeroMap(document.createElement("div"), DATA, cb(), { view: "map", selected: 0 }, { load: f.load });
    f.maps[0].fire("load");
    await h.ready;
    const calls = f.maps[0].calls;
    expect(calls.filter((x) => x.startsWith("jumpTo"))).toHaveLength(1);
    h.show("map", 1);
    const fly = calls.find((x) => x.startsWith("flyTo"))!;
    expect(fly).toContain('"duration":1400');
    expect(fly).toContain('"curve":1.3');
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce") }));
    h.show("map", 2);
    expect(calls.filter((x) => x.startsWith("flyTo"))).toHaveLength(1);
    expect(calls.filter((x) => x.startsWith("jumpTo"))).toHaveLength(2);
    vi.unstubAllGlobals();
  });

  it("calls onFail when WebGL can't start, and the handle is inert", async () => {
    const f = fakeMapLibre({ throwOnCreate: true });
    const c = cb();
    const h = await mountHeroMap(document.createElement("div"), DATA, c, { view: "map", selected: 0 }, { load: f.load });
    expect(c.onFail).toHaveBeenCalledTimes(1);
    expect(() => h.show("fleet", 0)).not.toThrow();
    expect(() => h.destroy()).not.toThrow();
  });

  it("calls onFail when the import fails", async () => {
    const c = cb();
    await mountHeroMap(document.createElement("div"), DATA, c, { view: "map", selected: 0 }, { load: () => Promise.reject(new Error("chunk")) });
    expect(c.onFail).toHaveBeenCalledTimes(1);
  });

  it("times out after 8 s: onFail once and the map is freed", async () => {
    const f = fakeMapLibre();
    const c = cb();
    await mountHeroMap(document.createElement("div"), DATA, c, { view: "map", selected: 0 }, { load: f.load });
    vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
    expect(c.onFail).toHaveBeenCalledTimes(1);
    expect(f.maps[0].removed).toBe(1);
  });

  it("destroy before load cancels the timeout (no late onFail)", async () => {
    const f = fakeMapLibre();
    const c = cb();
    const h = await mountHeroMap(document.createElement("div"), DATA, c, { view: "map", selected: 0 }, { load: f.load });
    h.destroy();
    vi.advanceTimersByTime(LOAD_TIMEOUT_MS * 2);
    expect(c.onFail).not.toHaveBeenCalled();
    expect(f.maps[0].removed).toBe(1);
  });
});

describe("mountTripMap", () => {
  it("fails on a style error before load", async () => {
    const f = fakeMapLibre();
    const onFail = vi.fn();
    const data = { plan: DATA.flags[0].route, actual: DATA.flags[0].route, lit: null, focus: [76, 27] as [number, number], events: [], bounds: DATA.flags[0].bounds };
    await mountTripMap(document.createElement("div"), data, { onFail }, { load: f.load });
    f.maps[0].fire("error", { error: new Error("blocked") });
    expect(onFail).toHaveBeenCalledTimes(1);
  });
});
