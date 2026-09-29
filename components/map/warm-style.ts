/**
 * The basemap warmed to a "night yard": near-black land, faint sodium-lit
 * highways (a port of map.js `warm()`). `warmPaint` is pure; `warm` applies
 * it to a loaded map.
 */
export interface StyleLayerLike {
  id: string;
  type: string;
}

export interface PaintOp {
  id: string;
  prop: "background-color" | "fill-color" | "line-color";
  value: string;
}

const NIGHT = {
  background: "#0d0c0b",
  land: "#100e0c",
  water: "#070707",
  waterLine: "#090909",
  boundary: "rgba(215,175,135,0.20)",
  highway: "rgba(236,150,70,0.46)",
  road: "rgba(215,170,120,0.22)",
  minor: "rgba(210,180,150,0.08)",
} as const;

/** The paint changes that turn Carto dark-matter into the night yard, layer by layer. */
export function warmPaint(layers: readonly StyleLayerLike[]): PaintOp[] {
  const ops: PaintOp[] = [];
  for (const l of layers) {
    if (l.type === "background") ops.push({ id: l.id, prop: "background-color", value: NIGHT.background });
    else if (l.type === "fill") ops.push({ id: l.id, prop: "fill-color", value: /water/.test(l.id) ? NIGHT.water : NIGHT.land });
    else if (l.type === "line") {
      const value = /water/.test(l.id)
        ? NIGHT.waterLine
        : /boundary/.test(l.id)
          ? NIGHT.boundary
          : /mot|trunk/.test(l.id)
            ? NIGHT.highway
            : /pri|sec/.test(l.id)
              ? NIGHT.road
              : NIGHT.minor;
      ops.push({ id: l.id, prop: "line-color", value });
    }
  }
  return ops;
}

export interface WarmableMap {
  getStyle(): { layers?: readonly StyleLayerLike[] } | undefined;
  setPaintProperty(id: string, prop: string, value: string): unknown;
}

/** Applies `warmPaint` to a loaded map; a layer without that paint property is skipped. */
export function warm(map: WarmableMap): void {
  for (const op of warmPaint(map.getStyle()?.layers ?? [])) {
    try {
      map.setPaintProperty(op.id, op.prop, op.value);
    } catch {
      /* layer without that paint property */
    }
  }
}
