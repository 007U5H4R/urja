/**
 * The dataset entry point (technical-plan §3.1). `getDataset()` builds the
 * whole simulated fleet once per process and hands the same object to every
 * caller: static pages at build, the Ask route per cold start, and tests.
 * Because it is shared, it is deep-frozen: a caller that tries to change a
 * trip, flag or ledger gets a TypeError instead of changing everyone's numbers.
 */
import { buildDataset, type Dataset } from "./pipeline";
import type { Flag, Trip, TripId, TripLedger } from "./types";

/** `T` with every property and array readonly, all the way down (tuples stay tuples). */
export type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;

export type ReadonlyDataset = DeepReadonly<Dataset>;
export type ReadonlyTrip = DeepReadonly<Trip>;
export type ReadonlyFlag = DeepReadonly<Flag>;
export type ReadonlyLedger = DeepReadonly<TripLedger>;

/** Freezes `root` and everything reachable from it. Iterative, so deep arrays cannot overflow the stack. */
export function deepFreeze<T>(root: T): DeepReadonly<T> {
  const seen = new WeakSet<object>();
  const stack: unknown[] = [root];
  while (stack.length > 0) {
    const v = stack.pop();
    if (v === null || typeof v !== "object" || seen.has(v)) continue;
    seen.add(v);
    for (const key of Object.keys(v)) stack.push((v as Record<string, unknown>)[key]);
    Object.freeze(v);
  }
  return root as DeepReadonly<T>;
}

let cached: ReadonlyDataset | undefined;
let byId: Map<TripId, ReadonlyTrip> | undefined;

/** The memoised, deep-frozen dataset: built on first call, then reused for the life of the process. */
export function getDataset(): ReadonlyDataset {
  cached ??= deepFreeze(buildDataset());
  return cached;
}

/** A finished or live trip by id; throws on an unknown id. */
export function tripById(id: TripId): ReadonlyTrip {
  if (!byId) {
    const ds = getDataset();
    byId = new Map([...ds.trips, ...ds.live].map((t) => [t.id, t]));
  }
  const t = byId.get(id);
  if (!t) throw new Error(`Unknown trip id: ${id}`);
  return t;
}
