import { describe, expect, it, vi } from "vitest";

import { warm, warmPaint } from "./warm-style";

// TSK-10.1: a pure port of map.js warm(): the Carto basemap warmed to a "night yard".

const LAYERS = [
  { id: "background", type: "background" },
  { id: "landcover", type: "fill" },
  { id: "water", type: "fill" },
  { id: "waterway", type: "line" },
  { id: "boundary_state", type: "line" },
  { id: "road_mot_fill_noramp", type: "line" },
  { id: "road_trunk_case_ramp", type: "line" },
  { id: "road_pri_fill_noramp", type: "line" },
  { id: "road_sec_case_noramp", type: "line" },
  { id: "road_minor_fill", type: "line" },
  { id: "building", type: "fill" },
  { id: "labels", type: "symbol" },
];

describe("warmPaint", () => {
  it("maps each layer to map.js's night colours", () => {
    expect(warmPaint(LAYERS)).toEqual([
      { id: "background", prop: "background-color", value: "#0d0c0b" },
      { id: "landcover", prop: "fill-color", value: "#100e0c" },
      { id: "water", prop: "fill-color", value: "#070707" },
      { id: "waterway", prop: "line-color", value: "#090909" },
      { id: "boundary_state", prop: "line-color", value: "rgba(215,175,135,0.20)" },
      { id: "road_mot_fill_noramp", prop: "line-color", value: "rgba(236,150,70,0.46)" },
      { id: "road_trunk_case_ramp", prop: "line-color", value: "rgba(236,150,70,0.46)" },
      { id: "road_pri_fill_noramp", prop: "line-color", value: "rgba(215,170,120,0.22)" },
      { id: "road_sec_case_noramp", prop: "line-color", value: "rgba(215,170,120,0.22)" },
      { id: "road_minor_fill", prop: "line-color", value: "rgba(210,180,150,0.08)" },
      { id: "building", prop: "fill-color", value: "#100e0c" },
    ]);
  });

  it("leaves symbol and other layer types alone, and handles an empty style", () => {
    expect(warmPaint([{ id: "x", type: "symbol" }, { id: "y", type: "raster" }])).toEqual([]);
    expect(warmPaint([])).toEqual([]);
  });

  it("is pure: the same input gives the same output and is not mutated", () => {
    const input = structuredClone(LAYERS);
    expect(warmPaint(input)).toEqual(warmPaint(LAYERS));
    expect(input).toEqual(LAYERS);
  });
});

describe("warm", () => {
  it("applies every op to the map and survives a layer that rejects a property", () => {
    const set = vi.fn((id: string) => {
      if (id === "water") throw new Error("no such paint property");
    });
    const map = { getStyle: () => ({ layers: LAYERS }), setPaintProperty: set };
    expect(() => warm(map)).not.toThrow();
    expect(set).toHaveBeenCalledTimes(11);
    expect(set).toHaveBeenCalledWith("background", "background-color", "#0d0c0b");
  });

  it("does nothing when the style has no layers yet", () => {
    const set = vi.fn();
    warm({ getStyle: () => ({}), setPaintProperty: set });
    expect(set).not.toHaveBeenCalled();
  });
});
