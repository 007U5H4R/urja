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
/** Bottom padding of a flag's camera: the rail box's rise plus a city label's hang, plus a gap (DES-13). */
export const RAIL_CLEAR = { desktop: 172, compact: 184 } as const;
/** How far a city label hangs below its point (mapLabel's 8 px offset plus its 20 px line). */
export const CITY_LABEL_HANG = 28;

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
  if (kind === "fleet") {
    // The fleet's rail box is one line high (about 44 px), so its padding stays as it was.
    const padding = compact ? { top: 72, right: 32, bottom: 152, left: 32 } : { top: 84, right: 312, bottom: 142, left: 48 };
    return { bounds, padding, pitch: 38, bearing: 0 };
  }
  // DES-13: a flag's rail box rises 122 px (desktop) or 140 px (phone, its header wraps) above the
  // map's bottom edge, and a city label hangs 28 px below its point (8 px offset + a 20 px line),
  // so the route's end city keeps its label clear of the box with room to spare.
  const padding = compact ? { top: 72, right: 32, bottom: RAIL_CLEAR.compact, left: 32 } : { top: 84, right: 312, bottom: RAIL_CLEAR.desktop, left: 48 };
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

// ── Label layout (DES-12) ────────────────────────────────────────────────
type Pt = { x: number; y: number };
type Size = { w: number; h: number };
type Box = [x0: number, y0: number, x1: number, y1: number];

/** A flag marker's half size (lamp.css `.fmark`: 26 px) and its place label's gap from the centre (mapLabel offset). */
const MARK_HALF = 13;
const PLACE_GAP = 18;
/** What covers the hero map: its header row, the glass card and the rail box. */
const COVERS = ".mc-top, #fc, .railbox";
/** Labels closer than this count as touching. */
const LABEL_MARGIN = 2;

const hit = (a: Box, b: Box, m = LABEL_MARGIN) => a[0] < b[2] + m && b[0] < a[2] + m && a[1] < b[3] + m && b[1] < a[3] + m;
const markBox = (p: Pt): Box => [p.x - MARK_HALF, p.y - MARK_HALF, p.x + MARK_HALF, p.y + MARK_HALF];
const placeBox = (p: Pt, s: Size, side: "right" | "left"): Box =>
  side === "right" ? [p.x + PLACE_GAP, p.y - s.h / 2, p.x + PLACE_GAP + s.w, p.y + s.h / 2] : [p.x - PLACE_GAP - s.w, p.y - s.h / 2, p.x - PLACE_GAP, p.y + s.h / 2];
/** A city label's box for a marker offset (anchor "top": the offset moves the label's top centre). */
const cityBox = (p: Pt, s: Size, [dx, dy]: Offset): Box => [p.x + dx - s.w / 2, p.y + dy, p.x + dx + s.w / 2, p.y + dy + s.h];

type Offset = [dx: number, dy: number];
/** Where a city label may go, in order: below its point (map.js), above, right, left, then further below or above. */
export const CITY_SPOTS = (s: Size): Offset[] => [
  [0, 8],
  [0, -8 - s.h],
  [8 + s.w / 2, -s.h / 2],
  [-8 - s.w / 2, -s.h / 2],
  [0, 24],
  [0, -24 - s.h],
];

export interface LabelLayout {
  /** Which side of its marker each flag's place label goes. */
  side: ("right" | "left")[];
  /** Each city label's offset from its point, or null when every spot is covered (it is hidden). */
  city: (Offset | null)[];
}

/**
 * Where the hero's labels go, in screen pixels (map.project). A flag's place label
 * sits right of its marker, as in map.js, unless that covers a city label, a marker or
 * an earlier flag's label and the left side is clear. A city label then takes the first
 * of CITY_SPOTS that no marker, flag label or earlier city label covers; if a single
 * flag label is all that covers a spot and that label's other side is clear, the label
 * moves over instead. A city label is hidden only when nothing works. Cities are placed
 * in data order, so Jaipur, the home yard, goes first. Flags carry the evidence, so
 * cities give way.
 */
export function layoutLabels(marks: readonly Pt[], places: readonly (Size | null)[], cities: readonly { p: Pt; size: Size }[]): LabelLayout {
  const homeBoxes = cities.map((c) => cityBox(c.p, c.size, CITY_SPOTS(c.size)[0]));
  const markBoxes = marks.map(markBox);
  const labels: (Box | null)[] = [];
  const side = marks.map((p, i): "right" | "left" => {
    const s = places[i];
    if (!s) {
      labels.push(null);
      return "right";
    }
    const blocked = (b: Box) => homeBoxes.some((c) => hit(b, c)) || markBoxes.some((m, k) => k !== i && hit(b, m)) || labels.some((q) => q && hit(b, q));
    const right = placeBox(p, s, "right");
    const left = placeBox(p, s, "left");
    const pick = blocked(right) && !blocked(left) ? "left" : "right";
    labels.push(pick === "left" ? left : right);
    return pick;
  });
  const cityBoxes: Box[] = [];
  const city = cities.map((c): Offset | null => {
    const spots = CITY_SPOTS(c.size);
    const fixed = (b: Box) => markBoxes.some((m) => hit(b, m)) || cityBoxes.some((q) => hit(b, q));
    const take = (b: Box, off: Offset) => {
      cityBoxes.push(b);
      return off;
    };
    for (const off of spots) {
      const b = cityBox(c.p, c.size, off);
      if (!fixed(b) && !labels.some((q) => q && hit(b, q))) return take(b, off);
    }
    // Second pass: move the one flag label in the way to its other side, if that side is clear.
    for (const off of spots) {
      const b = cityBox(c.p, c.size, off);
      if (fixed(b)) continue;
      const inWay = labels.flatMap((q, j) => (q && hit(b, q) ? [j] : []));
      if (inWay.length !== 1) continue;
      const j = inWay[0];
      const s = places[j]!;
      const flipped = placeBox(marks[j], s, side[j] === "right" ? "left" : "right");
      const clear =
        !hit(flipped, b) &&
        !markBoxes.some((m, k) => k !== j && hit(flipped, m)) &&
        !labels.some((q, k) => k !== j && q && hit(flipped, q)) &&
        !cityBoxes.some((q) => hit(flipped, q));
      if (!clear) continue;
      side[j] = side[j] === "right" ? "left" : "right";
      labels[j] = flipped;
      return take(b, off);
    }
    return null;
  });
  return { side, city };
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

  const cityMarks = data.cities.map((c) => mapLabel(ml, map, c.lngLat, c.name, "city"));
  const extras: ML.Marker[] = [...cityMarks];
  const card = map.getContainer().closest(".mapcard") ?? map.getContainer().parentElement;
  const placeMarks: (ML.Marker | null)[] = [];
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
    // DES-8: a marker Tab reaches off the map, or under the glass card or rail box, would hold an
    // invisible focus. Focusing it selects its flag, as Enter would, so the map flies (or, under
    // reduced motion, jumps) to it; if it is already the selected flag (panned away), the map goes
    // back to it. The scroll the browser gives the clipped map box is undone.
    m.addEventListener("focus", () => {
      unscroll();
      requestAnimationFrame(unscroll);
      if (inView(m)) return;
      if (shown?.view === "map" && shown.selected === i) frame(f, true);
      else opts.onSelect(i);
    });
    extras.push(addMarker(ml, map, m, f.at, f.markerLabel));
    const label = f.place ? mapLabel(ml, map, f.at, f.place, "place", "left", [PLACE_GAP, 0]) : null;
    placeMarks.push(label);
    if (label) extras.push(label);
    return m;
  });

  /** Whole inside the map box, and under none of the card's header, glass card or rail box. */
  const inView = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const b = map.getContainer().getBoundingClientRect();
    if (r.left < b.left || r.right > b.right || r.top < b.top || r.bottom > b.bottom) return false;
    const box = (q: DOMRect): Box => [q.left, q.top, q.right, q.bottom];
    return ![...(card?.querySelectorAll(COVERS) ?? [])].some((c) => {
      const q = c.getBoundingClientRect();
      return q.width > 0 && q.height > 0 && hit(box(r), box(q), 0);
    });
  };
  const unscroll = () => {
    for (let el: HTMLElement | null = map.getContainer(); el; el = el === card ? null : el.parentElement) {
      if (el.scrollTop) el.scrollTop = 0;
      if (el.scrollLeft) el.scrollLeft = 0;
    }
  };

  // DES-12: labels laid out against each other once a move ends (sizes are measured once per resize),
  // at most once a frame: resolveCamera's probe jumps end moves too.
  let gone = false;
  let raf = 0;
  const scheduleLayout = () => {
    raf ||= requestAnimationFrame(() => {
      raf = 0;
      if (!gone) layout();
    });
  };
  let sizes: { places: (Size | null)[]; cities: Size[] } | null = null;
  const size = (mk: ML.Marker): Size => ({ w: mk.getElement().offsetWidth, h: mk.getElement().offsetHeight });
  const layout = () => {
    sizes ??= { places: placeMarks.map((mk) => (mk ? size(mk) : null)), cities: cityMarks.map(size) };
    const { places, cities } = sizes;
    const r = layoutLabels(
      data.flags.map((f) => map.project(f.at)),
      places,
      data.cities.map((c, k) => ({ p: map.project(c.lngLat), size: cities[k] })),
    );
    placeMarks.forEach((mk, i) => {
      const s = places[i];
      if (mk && s) mk.setOffset(r.side[i] === "left" ? [-PLACE_GAP - s.w, 0] : [PLACE_GAP, 0]);
    });
    cityMarks.forEach((mk, k) => {
      const off = r.city[k];
      if (off) mk.setOffset(off);
      mk.getElement().style.visibility = off ? "" : "hidden";
    });
  };
  const remeasure = () => {
    sizes = null;
    scheduleLayout();
  };
  map.on("moveend", scheduleLayout);
  map.on("resize", remeasure);
  // The labels' first measure may use the fallback font; measure again once the fonts are in.
  document.fonts?.ready.then(() => !gone && remeasure()).catch(() => {});

  // The pool lives on the card, beside the map box (map.js), over the canvas.
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
  const frame = (f: HeroMapFlag, animate: boolean) =>
    go(heroCamera(f.bounds, "flag", opts.compact()), f.plan ? [...f.route, ...f.plan] : f.route, animate);
  /** What show() last drew, so a focused marker knows whether it is the selected flag. */
  let shown: { view: HeroMapView; selected: number } | null = null;

  return {
    show(view, selected, animate) {
      shown = { view, selected };
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
        frame(f, animate);
      }
      place();
      scheduleLayout();
    },
    destroy() {
      gone = true;
      cancelAnimationFrame(raf);
      map.off("move", place);
      map.off("moveend", scheduleLayout);
      map.off("resize", remeasure);
      extras.forEach((m) => m.remove());
      pool.remove();
    },
  };
}
