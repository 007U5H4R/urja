/**
 * Signal helpers shared by the rules: the 5-sample rolling median (§4.4) and
 * the sensor's noise band (§4.3: max |sample − 5-min median| outside the flag
 * windows, rounded up to whole litres).
 */
import type { Min, Sample } from "../types";

const smoothCache = new WeakMap<readonly Sample[], number[]>();

/**
 * Centred 5-sample rolling median of fuel, in centilitres (the window shrinks
 * at the ends). Memoised per samples array: every rule shares one smoothing.
 * Callers must not mutate the result.
 */
export function smoothFuelCl(samples: readonly Sample[]): number[] {
  const hit = smoothCache.get(samples);
  if (hit) return hit;
  const out = computeSmooth(samples);
  smoothCache.set(samples, out);
  return out;
}

function computeSmooth(samples: readonly Sample[]): number[] {
  const n = samples.length;
  const out: number[] = new Array(n);
  const buf: number[] = [];
  for (let i = 0; i < n; i++) {
    buf.length = 0;
    for (let k = Math.max(0, i - 2); k <= Math.min(n - 1, i + 2); k++) buf.push(samples[k].fuelCl);
    buf.sort((a, b) => a - b);
    const m = buf.length;
    out[i] = m % 2 === 1 ? buf[(m - 1) / 2] : (buf[m / 2 - 1] + buf[m / 2]) / 2;
  }
  return out;
}

/** Index of the sample at minute `t` (samples are one per minute); -1 when out of range. */
export function indexAt(samples: readonly Sample[], t: Min): number {
  if (samples.length === 0) return -1;
  const i = t - samples[0].t;
  return i >= 0 && i < samples.length && samples[i].t === t ? i : samples.findIndex((s) => s.t === t);
}

/**
 * The sensor's noise band in whole litres: max |sample − smoothed| over
 * samples outside `exclude` windows (inclusive minute ranges), rounded up.
 */
export function noiseBandL(
  samples: readonly Sample[],
  smoothed: readonly number[],
  exclude: readonly [Min, Min][] = [],
): number {
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = samples[i].t;
    if (exclude.some(([a, b]) => t >= a && t <= b)) continue;
    max = Math.max(max, Math.abs(samples[i].fuelCl - smoothed[i]));
  }
  return Math.ceil(max / 100 - 1e-9);
}

/** Longest gap between consecutive samples inside [from, to], in minutes. */
export function maxGapMin(samples: readonly Sample[], from: Min, to: Min): number {
  let gap = 0;
  let prev: number | null = null;
  for (const s of samples) {
    if (s.t < from || s.t > to) continue;
    if (prev !== null) gap = Math.max(gap, s.t - prev);
    prev = s.t;
  }
  return gap;
}
