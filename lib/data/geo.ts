/**
 * Small spherical-geometry helpers for route and geofence checks.
 * Distances are metres on the mean-radius sphere (R = 6,371,008.8 m).
 * Along a segment, points are interpolated linearly in lng/lat; at the
 * segment lengths used here (up to ~100 km) that is accurate to tens of metres.
 * Every function throws a RangeError on non-finite input.
 */
import type { LngLat } from "./types";

const EARTH_R_M = 6_371_008.8;
const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function assertFinitePoint(p: LngLat, fn: string): void {
  if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) {
    throw new RangeError(`${fn}: non-finite coordinate [${p[0]}, ${p[1]}]`);
  }
}

function assertFinitePath(path: readonly LngLat[], fn: string): void {
  for (const p of path) assertFinitePoint(p, fn);
}

const lengthCache = new WeakMap<readonly LngLat[], number>();

/** Great-circle distance in metres. */
export function haversineM(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total length of a polyline in metres. */
export function pathLengthM(path: readonly LngLat[]): number {
  // Frozen paths (the route library's) cannot change, so their length is cached.
  const cached = lengthCache.get(path);
  if (cached !== undefined) return cached;
  let m = 0;
  for (let i = 1; i < path.length; i++) m += haversineM(path[i - 1], path[i]);
  if (Object.isFrozen(path) && path.every((p) => Object.isFrozen(p))) lengthCache.set(path, m);
  return m;
}

export interface PathProjection {
  /** Distance from the point to the nearest point on the path, metres. */
  distanceM: number;
  /** Distance along the path from its start to that nearest point, metres. */
  alongM: number;
  /** Index of the segment [i, i+1] the nearest point lies on. */
  segmentIndex: number;
  /** The nearest point on the path. */
  point: LngLat;
}

/** Nearest point on a polyline (local equirectangular projection per segment). */
export function projectOntoPath(p: LngLat, path: readonly LngLat[]): PathProjection {
  if (path.length === 0) throw new RangeError("projectOntoPath: empty path");
  assertFinitePoint(p, "projectOntoPath");
  assertFinitePath(path, "projectOntoPath");
  if (path.length === 1) {
    return { distanceM: haversineM(p, path[0]), alongM: 0, segmentIndex: 0, point: [...path[0]] };
  }
  const kx = Math.cos(rad(p[1]));
  let best: PathProjection | null = null;
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const ax = (a[0] - p[0]) * kx;
    const ay = a[1] - p[1];
    const dx = (b[0] - a[0]) * kx;
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const point: LngLat = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    const segM = haversineM(a, b);
    const distanceM = haversineM(p, point);
    if (best === null || distanceM < best.distanceM) {
      best = { distanceM, alongM: acc + t * segM, segmentIndex: i - 1, point };
    }
    acc += segM;
  }
  return best!;
}

/** Shortest distance from a point to a polyline, metres. */
export function distanceToPathM(p: LngLat, path: readonly LngLat[]): number {
  return projectOntoPath(p, path).distanceM;
}

/** The point `alongM` metres from the start of the path (clamped to its ends). */
export function pointAlongPath(path: readonly LngLat[], alongM: number): LngLat {
  if (path.length === 0) throw new RangeError("pointAlongPath: empty path");
  if (!Number.isFinite(alongM)) throw new RangeError(`pointAlongPath: non-finite distance ${alongM}`);
  assertFinitePath(path, "pointAlongPath");
  if (alongM <= 0) return [...path[0]];
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const segM = haversineM(path[i - 1], path[i]);
    if (segM > 0 && acc + segM >= alongM) {
      const f = (alongM - acc) / segM;
      const a = path[i - 1];
      const b = path[i];
      return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
    }
    acc += segM;
  }
  return [...path[path.length - 1]];
}

/** Move a point by metres east and north (small offsets). */
export function offsetM(origin: LngLat, eastM: number, northM: number): LngLat {
  const lat = origin[1] + deg(northM / EARTH_R_M);
  const lng = origin[0] + deg(eastM / (EARTH_R_M * Math.cos(rad(origin[1]))));
  return [lng, lat];
}
