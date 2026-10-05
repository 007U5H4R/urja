import { describe, expect, it } from "vitest";
import type { LngLat } from "./types";
import {
  distanceToPathM,
  haversineM,
  offsetM,
  pathLengthM,
  pointAlongPath,
  projectOntoPath,
} from "./geo";

// One degree of latitude on the mean-radius sphere.
const DEG_LAT_M = (Math.PI / 180) * 6_371_008.8;

describe("geo", () => {
  it("haversine: zero for the same point, symmetric, one degree of latitude", () => {
    const a: LngLat = [75.787, 26.912];
    const b: LngLat = [77.27, 28.53];
    expect(haversineM(a, a)).toBe(0);
    expect(haversineM(a, b)).toBeCloseTo(haversineM(b, a), 6);
    expect(haversineM([76, 27], [76, 28])).toBeCloseTo(DEG_LAT_M, 3);
  });

  it("haversine: Jaipur → Okhla is about 234 km as the crow flies", () => {
    const d = haversineM([75.787, 26.912], [77.27, 28.53]);
    expect(d / 1000).toBeGreaterThan(225);
    expect(d / 1000).toBeLessThan(245);
  });

  it("path length sums its segments", () => {
    const path: LngLat[] = [[76, 27], [76, 28], [76, 29]];
    expect(pathLengthM(path)).toBeCloseTo(2 * DEG_LAT_M, 3);
    expect(pathLengthM([[76, 27]])).toBe(0);
  });

  it("projects a point onto the nearest segment", () => {
    const path: LngLat[] = [[76, 27], [76, 28], [77, 28]];
    // 0.01° east of the first segment's midpoint.
    const p: LngLat = [76.01, 27.5];
    const proj = projectOntoPath(p, path);
    expect(proj.segmentIndex).toBe(0);
    expect(proj.distanceM).toBeCloseTo(haversineM(p, [76, 27.5]), -1);
    expect(proj.alongM).toBeCloseTo(DEG_LAT_M / 2, -1);
    expect(distanceToPathM(p, path)).toBe(proj.distanceM);
  });

  it("clamps to the endpoints beyond the path", () => {
    const path: LngLat[] = [[76, 27], [76, 28]];
    const proj = projectOntoPath([76, 26.9], path);
    expect(proj.alongM).toBe(0);
    expect(proj.distanceM).toBeCloseTo(DEG_LAT_M * 0.1, -1);
  });

  it("walks a distance along a path and round-trips with projection", () => {
    const path: LngLat[] = [[76, 27], [76, 28], [77, 28]];
    expect(pointAlongPath(path, 0)).toEqual([76, 27]);
    expect(pointAlongPath(path, 1e9)).toEqual([77, 28]);
    const along = 150_000;
    const p = pointAlongPath(path, along);
    const proj = projectOntoPath(p, path);
    expect(proj.distanceM).toBeLessThan(1);
    expect(proj.alongM).toBeCloseTo(along, -1);
  });

  it("offsets a point by metres east and north", () => {
    const o: LngLat = [76, 27];
    const p = offsetM(o, 3000, 4000);
    expect(haversineM(o, p)).toBeCloseTo(5000, -1);
  });

  it("throws a RangeError on non-finite input", () => {
    const path: LngLat[] = [[76, 27], [76, 28]];
    expect(() => pointAlongPath(path, Number.NaN)).toThrow(RangeError);
    expect(() => pointAlongPath(path, Infinity)).toThrow(RangeError);
    expect(() => projectOntoPath([Number.NaN, 27], path)).toThrow(RangeError);
    expect(() => projectOntoPath([76, 27], [[76, 27], [Infinity, 28]])).toThrow(RangeError);
  });
});

