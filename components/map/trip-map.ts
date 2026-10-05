/**
 * The trip page's route map (a port of map.js `tripMap()`): the plan dashed,
 * the actual route as the light trail, the flagged spot lit with the lamp
 * pool over it, and R4's extra-km segment lit in the loss colour.
 * MapLibre is imported by type only; map-client.tsx passes the namespace in.
 */
import type * as ML from "maplibre-gl";

import type { LngLat } from "@/lib/data/types";
import { addMarker, COMPACT_MAX_PX, glowLine, mapLabel, type CameraSpec, type MapLibre } from "./hero-map";

export interface TripMapData {
  plan: LngLat[];
  actual: LngLat[];
  lit: LngLat[] | null;
  focus: LngLat;
  events: { lngLat: LngLat; kind: "end" | "ok" | "bad" | "fuel" | ""; label: string }[];
  bounds: [LngLat, LngLat];
}

/** map.js tripMap: pitch 55 (42 on the phone), bearing 26, framed on the route. */
export function tripCamera(bounds: [LngLat, LngLat], compact: boolean): CameraSpec {
  return compact
    ? { bounds, padding: { top: 96, right: 28, bottom: 130, left: 28 }, pitch: 42, bearing: 26 }
    : { bounds, padding: { top: 104, right: 48, bottom: 120, left: 48 }, pitch: 55, bearing: 26 };
}

export const isCompact = () => typeof window !== "undefined" && window.innerWidth < COMPACT_MAX_PX;

const ln = (cs: LngLat[]): GeoJSON.Feature => ({ type: "Feature", geometry: { type: "LineString", coordinates: cs }, properties: {} });

type Colors = { plan: string; cream: string; loss: string };

/** Adds the route, the events and the pool to a loaded, warmed map; returns a disposer. */
export function addTripLayers(ml: MapLibre, map: ML.Map, data: TripMapData, colors: Colors): () => void {
  const compact = isCompact();
  map.addSource("plan", { type: "geojson", data: ln(data.plan) });
  map.addLayer({ id: "plan", type: "line", source: "plan", paint: { "line-color": colors.plan, "line-width": 1.8, "line-dasharray": [2, 2] } });
  glowLine(map, "actual", ln(data.actual), colors.cream, 2.6);
  if (data.lit) glowLine(map, "lit", ln(data.lit), colors.loss, 3);

  const markers: ML.Marker[] = [];
  for (const e of data.events) {
    const d = document.createElement("div");
    d.className = `evmark ${e.kind}`.trim();
    markers.push(addMarker(ml, map, d, e.lngLat, null));
    if (!compact || e.kind === "bad") markers.push(mapLabel(ml, map, e.lngLat, e.label, e.kind === "bad" ? "place bad" : "place", "left", [14, 0]));
  }

  // The pool lives on the card, beside the map box (map.js), over the canvas.
  const card = map.getContainer().closest(".mapcard") ?? map.getContainer().parentElement;
  const pool = document.createElement("div");
  pool.className = "pool";
  card?.appendChild(pool);
  const place = () => {
    const p = map.project(data.focus);
    pool.style.transform = `translate(${p.x}px, ${p.y}px)`;
  };
  map.on("move", place);
  place();

  return () => {
    map.off("move", place);
    markers.forEach((m) => m.remove());
    pool.remove();
  };
}
