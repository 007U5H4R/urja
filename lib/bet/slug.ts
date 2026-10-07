/**
 * Plate ↔ URL slug for the truck pages (/trucks/[plate], TASK-21): "RJ14 GB 4521" ↔ "rj14-gb-4521".
 * Slugs resolve only to the 24 plates of the simulated fleet; FLEET is read, never changed.
 */
import { FLEET } from "@/lib/data/fleet";
import type { Plate } from "@/lib/data/types";

/** "RJ14 GB 4521" → "rj14-gb-4521": lower case, each run of spaces one hyphen. */
export function plateToSlug(plate: string): string {
  return plate.trim().toLowerCase().split(/\s+/).join("-");
}

const BY_SLUG: ReadonlyMap<string, Plate> = new Map(FLEET.map((t) => [plateToSlug(t.plate), t.plate]));

/** The fleet plate behind `slug` (any letter case), or null when no truck has it. */
export function slugToPlate(slug: string): Plate | null {
  return BY_SLUG.get(slug.toLowerCase()) ?? null;
}

/** One slug per truck, in fleet order: the static params of /trucks/[plate]. */
export function getTruckSlugs(): string[] {
  return [...BY_SLUG.keys()];
}
