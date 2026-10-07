import { describe, expect, it } from "vitest";
import { FLEET } from "@/lib/data/fleet";
import { getTruckSlugs, plateToSlug, slugToPlate } from "./slug";

describe("plate ↔ slug (TASK-21)", () => {
  it("turns a plate into its URL slug", () => {
    expect(plateToSlug("RJ14 GB 4521")).toBe("rj14-gb-4521");
    expect(plateToSlug("  RJ14  GC 0931 ")).toBe("rj14-gc-0931");
  });

  it("reads a fleet slug back to its plate, case-insensitively", () => {
    expect(slugToPlate("rj14-gb-4521")).toBe("RJ14 GB 4521");
    expect(slugToPlate("RJ14-GB-4521")).toBe("RJ14 GB 4521");
  });

  it("gives null for a slug outside the fleet", () => {
    expect(slugToPlate("xx-00-zz-0000")).toBeNull();
    expect(slugToPlate("")).toBeNull();
    expect(slugToPlate("rj14 gb 4521")).toBeNull();
  });

  it("has one slug per truck, in fleet order, and every slug round-trips", () => {
    const slugs = getTruckSlugs();
    expect(slugs).toHaveLength(24);
    expect(new Set(slugs).size).toBe(24);
    expect(slugs).toEqual(FLEET.map((t) => plateToSlug(t.plate)));
    for (const s of slugs) {
      expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(plateToSlug(slugToPlate(s)!)).toBe(s);
    }
  });
});
