/**
 * The Today hero map (a port of map.js `heroMap()`): the three flagged trips,
 * list ↔ map linked, or the whole fleet. It never owns the selection: the
 * HeroCard holds `selected` and `view`, and calls `show()` when they change.
 *
 * MapLibre is imported by type only here; map-client.tsx passes the runtime
 * namespace in, so this module never pulls MapLibre into a bundle by itself.
 */
import type * as ML from "maplibre-gl";

import type { LngLat } from "@/lib/data/types";

/** The MapLibre namespace, passed in at runtime by map-client.tsx. */
export type MapLibre = typeof import("maplibre-gl");

export type HeroMapView = "map" | "fleet";

export interface HeroMapFlag {
  n: number;
  at: LngLat;
  place: string;
  route: LngLat[];
  plan: LngLat[] | null;
  bounds: [LngLat, LngLat];
  markerLabel: string;
}

export interface HeroMapData {
  flags: HeroMapFlag[];
  fleet: { trucks: { lngLat: LngLat; state: "moving" | "yard" | "workshop" }[]; bounds: [LngLat, LngLat] };
  cities: { name: string; lngLat: LngLat }[];
}

export interface CameraSpec {
  bounds: [LngLat, LngLat];
  padding: { top: number; right: number; bottom: number; left: number };
  pitch: number;
  bearing: number;
}

/** The phone breakpoint (lamp.css): no glass card, a flatter camera. */
export const COMPACT_MAX_PX = 760;
/** Design.md §15: the fly-to on selection. */
export const FLY = { duration: 1400, curve: 1.3 } as const;

/**
 * Where the camera goes for a flag or the fleet. map.js hand-set these per
 * flag; here they follow the route's extent so any data frames well: a short
 * route gets a steep tilt (flag 1: 56°), a long one a flatter view (flag 3:
 * 42°), and a tall route turns less. The padding keeps the route clear of
 * the glass card (right) and the rail box (bottom).
 */
export function heroCamera(bounds: [LngLat, LngLat], kind: "flag" | "fleet", compact: boolean): CameraSpec {
  const padding = compact ? { top: 72, right: 32, bottom: 152, left: 32 } : { top: 84, right: 312, bottom: 142, left: 48 };
  if (kind === "fleet") return { bounds, padding, pitch: 38, bearing: 0 };
  const dx = Math.max(1e-6, bounds[1][0] - bounds[0][0]);
  const dy = bounds[1][1] - bounds[0][1];
  const span = Math.max(dx, dy);
  const pitch = Math.round(Math.min(56, Math.max(compact ? 30 : 40, 60 - span * 2.5 - (compact ? 11 : 0))));
  const bearing = dy / dx > 2 ? (compact ? 5 : 8) : compact ? 18 : 22;
  return { bounds, padding, pitch, bearing };
}

/**
 * The camera that frames `points` inside the padded view at the spec's pitch
 * and bearing. cameraForBounds fits as if seen from straight above, which a
 * tilted view gets wrong (the far side shrinks, the near side grows), so the
 * flat fit is refined against the real projection: jump there, measure the
 * points on screen, re-centre and re-zoom, three times, then jump back. Only
 * the final camera is ever drawn.
 */
export function resolveCamera(map: ML.Map, spec: CameraSpec, points: readonly LngLat[]): ML.CameraOptions {
  const [[w, s], [e, n]] = spec.bounds;
  const flat = map.cameraForBounds(
    [
      [w, s],
      [e, n],
    ],
    { padding: spec.padding, bearing: spec.bearing },
  );
  let cam: ML.CameraOptions = {
    center: flat?.center ?? ([(w + e) / 2, (s + n) / 2] as LngLat),
    zoom: flat?.zoom ?? 5,
    pitch: spec.pitch,
    bearing: spec.bearing,
  };
  const pts = points.length ? points : [spec.bounds[0], spec.bounds[1]];
  const { clientWidth: W, clientHeight: H } = map.getContainer();
  const pad = spec.padding;
  const availW = W - pad.left - pad.right;
  const availH = H - pad.top - pad.bottom;
  if (!(availW > 0 && availH > 0)) return cam;
  const before: ML.CameraOptions = { center: map.getCenter(), zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
  for (let k = 0; k < 3; k++) {
    map.jumpTo(cam);
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const p of pts) {
      const q = map.project(p);
      x0 = Math.min(x0, q.x);
      y0 = Math.min(y0, q.y);
      x1 = Math.max(x1, q.x);
      y1 = Math.max(y1, q.y);
    }
    const scale = Math.min(availW / Math.max(1, x1 - x0), availH / Math.max(1, y1 - y0));
    const dx = (x0 + x1) / 2 - (pad.left + availW / 2);
    const dy = (y0 + y1) / 2 - (pad.top + availH / 2);
    const c = map.unproject([W / 2 + dx, H / 2 + dy]);
    cam = { ...cam, center: [c.lng, c.lat], zoom: (cam.zoom ?? 5) + Math.log2(scale) };
  }
  map.jumpTo(before);
  return cam;
}

type Colors = { lamp: string; cream: string; plan: string; fgSubtle: string; fgMuted: string };

const fc = (features: GeoJSON.Feature[]): GeoJSON.FeatureCollection => ({ type: "FeatureCollection", features });
const pt = (c: LngLat, props: Record<string, string> = {}): GeoJSON.Feature => ({ type: "Feature", geometry: { type: "Point", coordinates: c }, properties: props });
const ln = (cs: LngLat[]): GeoJSON.Feature => ({ type: "Feature", geometry: { type: "LineString", coordinates: cs }, properties: {} });
const EMPTY = fc([]);

/**
 * Adds an HTML marker. MapLibre's `addTo` stamps every marker with
 * aria-label="Map marker", so the label is set (or removed) afterwards:
 * buttons keep theirs; decorative markers are hidden from assistive tech,
 * because the map's own aria-label already says what they show.
 */
export function addMarker(
  ml: MapLibre,
  map: ML.Map,
  el: HTMLElement,
  at: LngLat,
  label: string | null,
  opts: { anchor?: ML.PositionAnchor; offset?: [number, number] } = {},
): ML.Marker {
  const marker = new ml.Marker({ element: el, ...opts }).setLngLat(at).addTo(map);
  if (label) el.setAttribute("aria-label", label);
  else {
    el.removeAttribute("aria-label");
    el.setAttribute("aria-hidden", "true");
  }
  return marker;
}

export function mapLabel(ml: MapLibre, map: ML.Map, c: LngLat, text: string, cls = "", anchor: ML.PositionAnchor = "top", offset: [number, number] = [0, 8]) {
  const el = document.createElement("div");
  el.className = `map-label ${cls}`.trim();
  el.textContent = text;
  return addMarker(ml, map, el, c, null, { anchor, offset });
}

export function glowLine(map: ML.Map, id: string, data: GeoJSON.Feature | GeoJSON.FeatureCollection, color: string, width = 2.6) {
  map.addSource(id, { type: "geojson", data });
  const layout: ML.LineLayerSpecification["layout"] = { "line-cap": "round", "line-join": "round" };
  map.addLayer({ id: `${id}-glow`, type: "line", source: id, layout, paint: { "line-color": color, "line-width": width * 6, "line-blur": width * 5, "line-opacity": 0.42 } });
  map.addLayer({ id: `${id}-core`, type: "line", source: id, layout, paint: { "line-color": color, "line-width": width } });
}

export interface HeroLayers {
  show(view: HeroMapView, selected: number, animate: boolean): void;
  destroy(): void;
}

/**
 * Adds the hero's layers and markers to a loaded, warmed map. `onSelect(i)` is
 * called when marker i is pressed; the caller decides what that means.
 */
export function addHeroLayers(
  ml: MapLibre,
  map: ML.Map,
  data: HeroMapData,
  opts: { onSelect: (i: number) => void; colors: Colors; reducedMotion: () => boolean; compact: () => boolean },
): HeroLayers {
  const { lamp, cream, plan, fgSubtle, fgMuted } = opts.colors;
  map.addSource("others", { type: "geojson", data: fc(data.flags.map((f) => ln(f.route))) });
  map.addLayer({ id: "others", type: "line", source: "others", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": lamp, "line-width": 1.6, "line-opacity": 0.35 } });
  map.addSource("plan", { type: "geojson", data: EMPTY });
  map.addLayer({ id: "plan", type: "line", source: "plan", paint: { "line-color": plan, "line-width": 1.6, "line-dasharray": [2, 2] } });
  glowLine(map, "sel", EMPTY, cream, 2.4);
  map.addSource("trucks", { type: "geojson", data: fc(data.fleet.trucks.map((t) => pt(t.lngLat, { s: t.state }))) });
  map.addLayer({ id: "trucks-glow", type: "circle", source: "trucks", filter: ["==", ["get", "s"], "moving"], layout: { visibility: "none" }, paint: { "circle-radius": 14, "circle-color": lamp, "circle-blur": 1, "circle-opacity": 0.5 } });
  map.addLayer({
    id: "trucks",
    type: "circle",
    source: "trucks",
    layout: { visibility: "none" },
    paint: {
      "circle-radius": 4.5,
      "circle-color": ["match", ["get", "s"], "moving", cream, "workshop", "rgba(0,0,0,0)", fgSubtle],
      "circle-stroke-width": ["match", ["get", "s"], "workshop", 1.6, 1],
      "circle-stroke-color": ["match", ["get", "s"], "workshop", fgMuted, "rgba(0,0,0,.6)"],
    },
  });

  const extras: ML.Marker[] = data.cities.map((c) => mapLabel(ml, map, c.lngLat, c.name, "city"));
  const marks = data.flags.map((f, i) => {
    const m = document.createElement("button");
    m.type = "button";
    m.className = "fmark";
    m.textContent = String(f.n);
    m.setAttribute("aria-label", f.markerLabel);
    m.setAttribute("aria-pressed", "false");
    m.addEventListener("click", (e) => {
      e.stopPropagation();
      opts.onSelect(i);
    });
    extras.push(addMarker(ml, map, m, f.at, f.markerLabel));
    if (f.place) extras.push(mapLabel(ml, map, f.at, f.place, "place", "left", [18, 0]));
    return m;
  });

  // The pool lives on the card, beside the map box (map.js), over the canvas.
  const card = map.getContainer().closest(".mapcard") ?? map.getContainer().parentElement;
  const pool = document.createElement("div");
  pool.className = "pool";
  card?.appendChild(pool);
  let focus: LngLat = data.flags[0]?.at ?? data.fleet.bounds[0];
  const place = () => {
    const p = map.project(focus);
    pool.style.transform = `translate(${p.x}px, ${p.y}px)`;
  };
  map.on("move", place);

  const fleetPoints = data.fleet.trucks.map((t) => t.lngLat);
  const vis = (id: string, on: boolean) => map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
  const go = (spec: CameraSpec, points: readonly LngLat[], animate: boolean) => {
    const cam = resolveCamera(map, spec, points);
    if (animate && !opts.reducedMotion()) map.flyTo({ ...cam, duration: FLY.duration, curve: FLY.curve });
    else map.jumpTo(cam);
  };

  return {
    show(view, selected, animate) {
      const fleet = view === "fleet";
      vis("trucks", fleet);
      vis("trucks-glow", fleet);
      vis("sel-glow", !fleet);
      vis("sel-core", !fleet);
      pool.classList.toggle("off", fleet);
      const f = data.flags[selected];
      marks.forEach((m, k) => {
        const on = !fleet && k === selected;
        m.classList.toggle("on", on);
        m.setAttribute("aria-pressed", String(on));
      });
      if (fleet || !f) {
        vis("plan", false);
        go(heroCamera(data.fleet.bounds, "fleet", opts.compact()), fleetPoints, animate);
      } else {
        (map.getSource("sel") as ML.GeoJSONSource).setData(ln(f.route));
        (map.getSource("plan") as ML.GeoJSONSource).setData(f.plan ? ln(f.plan) : EMPTY);
        vis("plan", !!f.plan);
        focus = f.at;
        go(heroCamera(f.bounds, "flag", opts.compact()), f.plan ? [...f.route, ...f.plan] : f.route, animate);
      }
      place();
    },
    destroy() {
      map.off("move", place);
      extras.forEach((m) => m.remove());
      pool.remove();
    },
  };
}
