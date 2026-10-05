"use client";

/**
 * The only module that loads MapLibre (technical-plan §8). It is itself
 * reached only through `import()` from client components after hydration, and
 * it imports `maplibre-gl` dynamically too, so MapLibre never ships in a
 * route's initial JS (TC-055).
 *
 * - Style: Carto dark-matter-nolabels, warmed by warm-style.ts; colours from
 *   lamp.css tokens via css-color.ts (MapLibre can't parse oklch()).
 * - `ready` resolves on the map's `load`. A style or tile error before that,
 *   a failed import or WebGL context, or no `load` within 8 s calls `onFail`
 *   once (the caller shows "Map unavailable; every event is in the timeline")
 *   and frees the map.
 * - Compact attribution: the tile source's "© CARTO, © OpenStreetMap contributors", top left,
 *   under the card's header row and (trip map) its legend, clear of the glass card and the rail
 *   box that covered it bottom right (DES-26). Open on load; on phones it folds to its (i) after 5 s.
 */
import "maplibre-gl/dist/maplibre-gl.css";

import type * as ML from "maplibre-gl";

import { cssColor } from "./css-color";
import { addHeroLayers, COMPACT_MAX_PX, heroCamera, type HeroLayers, type HeroMapData, type HeroMapView, type MapLibre } from "./hero-map";
import { addTripLayers, tripCamera, type TripMapData } from "./trip-map";
import { warm } from "./warm-style";

export const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";
export const LOAD_TIMEOUT_MS = 8000;

let mlPromise: Promise<MapLibre> | null = null;

/** Loads MapLibre once; a failed import can be retried. */
export function loadMapLibre(): Promise<MapLibre> {
  mlPromise ??= import("maplibre-gl")
    .then((m) => ((m as unknown as { default?: MapLibre }).default ?? m) as MapLibre)
    .catch((err: unknown) => {
      mlPromise = null;
      throw err;
    });
  return mlPromise;
}

/** The part of a MapLibre map the load watcher needs (a fake in tests). */
export interface LoadEmitter {
  on(type: "error", fn: (e: unknown) => void): unknown;
  once(type: "load", fn: () => void): unknown;
}

/**
 * Resolves `ready` on `load`; rejects and calls `onFail` once on an error
 * before `load` or after `timeoutMs`. Errors after `load` (a missing tile at
 * some zoom) are swallowed, so nothing reaches the console. `cancel()` stops
 * the watch without calling `onFail` (unmount).
 */
export function watchLoad(map: LoadEmitter, opts: { timeoutMs?: number; onFail: (reason: unknown) => void }) {
  let settled = false;
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const ready = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // A rejection nobody awaits is expected (the overlay is the handling).
  ready.catch(() => {});
  const fail = (reason: unknown) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    opts.onFail(reason);
    reject(reason);
  };
  const timer = setTimeout(() => fail(new Error("map load timed out")), opts.timeoutMs ?? LOAD_TIMEOUT_MS);
  map.once("load", () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resolve();
  });
  map.on("error", (e) => fail((e as { error?: unknown } | undefined)?.error ?? e));
  return {
    ready,
    cancel() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
    },
  };
}

/** What sits at the top of a map card, over the map: the header row and the trip map's legend. */
const TOP_CHROME = ".mc-top, .maplegend";

/**
 * Drops the top-left control corner (the attribution) below the card's header row and legend,
 * whose heights change with the width and text size, so it is never under them.
 */
export function placeAttribution(map: Pick<ML.Map, "getContainer">) {
  const box = map.getContainer();
  const corner = box.querySelector<HTMLElement>(".maplibregl-ctrl-top-left");
  const card = box.closest(".mapcard");
  if (!corner || !card) return;
  const top = box.getBoundingClientRect().top;
  let below = 0;
  for (const el of card.querySelectorAll(TOP_CHROME)) {
    const r = el.getBoundingClientRect();
    if (r.height > 0) below = Math.max(below, r.bottom - top);
  }
  corner.style.top = `${Math.round(below)}px`;
}

/** On a phone, how long the open attribution stays before it folds to its (i) on its own. */
export const ATTRIBUTION_FOLD_MS = 5000;

/**
 * On a phone the map has no free corner, and the open attribution covers the route's far end.
 * It opens on load as MapLibre shows it (and folds on the first drag, as MapLibre does), then
 * folds to its (i) button after ATTRIBUTION_FOLD_MS; the (i) opens it again. MapLibre opens it
 * when the first attribution arrives, so the timer starts then.
 */
function foldAttributionLater(map: ML.Map) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    const a = map.getContainer().querySelector(".maplibregl-ctrl-attrib.maplibregl-compact-show");
    if (!a || timer) return;
    map.off("styledata", arm);
    map.off("sourcedata", arm);
    timer = setTimeout(() => a.classList.remove("maplibregl-compact-show"), ATTRIBUTION_FOLD_MS);
  };
  map.on("styledata", arm);
  map.on("sourcedata", arm);
  map.on("remove", () => clearTimeout(timer));
}

/** Re-runs placeAttribution once the fonts are in (the header and legend may change height). */
function placeAttributionWhenFontsLoad(map: ML.Map) {
  document.fonts?.ready.then(() => placeAttribution(map)).catch(() => {});
}

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const compact = () => window.innerWidth < COMPACT_MAX_PX;

interface Deps {
  load?: () => Promise<MapLibre>;
  timeoutMs?: number;
}

/** Creates the warmed night map in `container`, framed on `bounds`; null when MapLibre or WebGL isn't there. */
async function createMap(
  container: HTMLElement,
  camera: ReturnType<typeof heroCamera>,
  onFail: () => void,
  deps: Deps,
): Promise<{ ml: MapLibre; map: ML.Map; watch: ReturnType<typeof watchLoad> } | null> {
  let ml: MapLibre;
  let map: ML.Map;
  try {
    ml = await (deps.load ?? loadMapLibre)();
    map = new ml.Map({
      container,
      style: STYLE_URL,
      bounds: camera.bounds,
      fitBoundsOptions: { padding: camera.padding, pitch: camera.pitch, bearing: camera.bearing },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.addControl(new ml.AttributionControl({ compact: true }), "top-left");
    placeAttribution(map);
    map.on("resize", () => placeAttribution(map));
    placeAttributionWhenFontsLoad(map);
    if (compact()) foldAttributionLater(map);
  } catch {
    onFail();
    return null;
  }
  const watch = watchLoad(map, {
    timeoutMs: deps.timeoutMs,
    onFail: () => {
      try {
        map.remove();
      } catch {
        /* already gone */
      }
      onFail();
    },
  });
  return { ml, map, watch };
}

export interface HeroMapHandle {
  ready: Promise<void>;
  /** Mirrors the HeroCard's state; flies (or jumps, under reduced motion) when it changes. */
  show(view: HeroMapView, selected: number): void;
  destroy(): void;
}

const NEVER: Promise<void> = new Promise(() => {});

/** Mounts the Today hero map. `initial` is the HeroCard's state at mount time (applied without a fly). */
export async function mountHeroMap(
  container: HTMLElement,
  data: HeroMapData,
  cb: { onSelect: (i: number) => void; onFail: () => void; onReady?: () => void },
  initial: { view: HeroMapView; selected: number },
  deps: Deps = {},
): Promise<HeroMapHandle> {
  let want = initial;
  const first = want.view === "fleet" ? heroCamera(data.fleet.bounds, "fleet", compact()) : heroCamera(data.flags[want.selected].bounds, "flag", compact());
  const made = await createMap(container, first, cb.onFail, deps);
  if (!made) return { ready: NEVER, show() {}, destroy() {} };
  const { ml, map, watch } = made;
  let layers: HeroLayers | null = null;
  let gone = false;
  watch.ready
    .then(() => {
      if (gone) return;
      warm(map);
      layers = addHeroLayers(ml, map, data, {
        onSelect: cb.onSelect,
        colors: {
          lamp: cssColor("--lamp", "rgba(236,150,70,1)"),
          cream: cssColor("--cream", "rgba(245,228,200,1)"),
          plan: cssColor("--route-plan", "rgba(130,125,118,1)"),
          fgSubtle: cssColor("--fg-subtle", "rgba(150,145,138,1)"),
          fgMuted: cssColor("--fg-muted", "rgba(190,185,176,1)"),
        },
        reducedMotion,
        compact,
      });
      layers.show(want.view, want.selected, false);
      map.resize();
      cb.onReady?.();
    })
    .catch(() => {});
  return {
    ready: watch.ready,
    show(view, selected) {
      if (view === want.view && selected === want.selected) return;
      want = { view, selected };
      layers?.show(view, selected, true);
    },
    destroy() {
      if (gone) return;
      gone = true;
      watch.cancel();
      layers?.destroy();
      try {
        map.remove();
      } catch {
        /* already removed after a failure */
      }
    },
  };
}

export interface TripMapHandle {
  ready: Promise<void>;
  destroy(): void;
}

/** Mounts the trip page's route map. */
export async function mountTripMap(
  container: HTMLElement,
  data: TripMapData,
  cb: { onFail: () => void; onReady?: () => void },
  deps: Deps = {},
): Promise<TripMapHandle> {
  const spec = tripCamera(data.bounds, compact());
  const made = await createMap(container, spec, cb.onFail, deps);
  if (!made) return { ready: NEVER, destroy() {} };
  const { ml, map, watch } = made;
  let dispose: (() => void) | null = null;
  let gone = false;
  watch.ready
    .then(() => {
      if (gone) return;
      warm(map);
      dispose = addTripLayers(ml, map, data, {
        plan: cssColor("--route-plan", "rgba(130,125,118,1)"),
        cream: cssColor("--cream", "rgba(245,228,200,1)"),
        loss: cssColor("--loss", "rgba(230,90,70,1)"),
      });
      map.resize();
      cb.onReady?.();
    })
    .catch(() => {});
  return {
    ready: watch.ready,
    destroy() {
      if (gone) return;
      gone = true;
      watch.cancel();
      dispose?.();
      try {
        map.remove();
      } catch {
        /* already removed after a failure */
      }
    },
  };
}
