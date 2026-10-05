import { describe, expect, it } from "vitest";
import { allowedNumbers, buildContext, getAskContext } from "./context";

describe("TSK-07.2 · Ask context", () => {
  const ctx = buildContext();
  const json = JSON.stringify(ctx);

  it("holds the fleet, 24 trucks and 23 flags", () => {
    expect(ctx.fleet.name).toBe("Sharma Roadlines");
    expect(ctx.fleet.trucks).toBe(24);
    expect(ctx.fleet.dieselInrPerL).toBe(90);
    expect(ctx.trucks).toHaveLength(24);
    expect(ctx.flags).toHaveLength(23);
  });

  it("lists every finished trip, 212 of them ending 1–27 Sep, with a header row", () => {
    const { header, rows } = ctx.trips;
    expect(header[0]).toBe("id");
    const end = header.indexOf("end");
    const sept = rows.filter((r) => / Sep /.test(String(r[end])));
    expect(sept).toHaveLength(212);
    expect(ctx.september.trips).toBe(212);
    for (const r of rows) expect(r).toHaveLength(header.length);
  });

  it("carries yesterday's verdict and the September anchors", () => {
    expect(ctx.yesterday.profitInr).toBe(186400);
    expect(ctx.yesterday.unaccountedInr).toBe(11430);
    expect(ctx.yesterday.unaccountedL).toBe(127);
    expect(ctx.yesterday.flaggedTrips).toEqual(expect.arrayContaining(["0926-04", "0927-02", "0926-11"]));
    expect(ctx.september.lastWeek).toMatchObject({ litres: 217, inr: 19530 });
    expect(ctx.september.lastWeek.trips).toHaveLength(5);
    expect(ctx.september.behrorStretch.trips).toEqual(["0905-03", "0912-05", "0921-09", "0923-02", "0926-04"]);
    expect(ctx.september).toMatchObject({ flaggedInr: 58240, recoveredInr: 21600, recoveredSharePct: 37, wrong: 2, wrongPct: 9 });
    const anil = ctx.trucks.find((t) => t.plate === "RJ14 GC 3309");
    expect(anil).toMatchObject({ rank: 24, perKmInr: 12.7, unaccountedInr: 11250, unaccountedL: 125 });
  });

  it("stays under 40 KB", () => {
    expect(new TextEncoder().encode(json).length).toBeLessThan(40 * 1024);
  });

  it("never carries an accusation word", () => {
    expect(json).not.toMatch(/\b(theft|thief|stolen|stole)\b|चोर|चुरा/i);
  });

  it("allowedNumbers includes the anchors, date parts and times", () => {
    const allowed = allowedNumbers(ctx);
    for (const n of [186400, 11430, 125, 11250, 16660, 217, 19530, 58240, 21600, 12.7, 31.8, 250, 200, 4500, 38, 3420]) {
      expect(allowed.has(n), String(n)).toBe(true);
    }
    // Date parts (27 Sep 2026) and a time (2:14 AM, also as 24 h).
    for (const n of [27, 9, 2026, 2, 14]) expect(allowed.has(n), String(n)).toBe(true);
    expect(allowed.has(123457)).toBe(false);
  });

  it("is memoised per process and hashed", () => {
    const a = getAskContext();
    const b = getAskContext();
    expect(a).toBe(b);
    expect(a.json).toBe(JSON.stringify(a.context));
    expect(a.hash).toMatch(/^[0-9a-f]{12}$/);
    expect(a.buildMs).toBeGreaterThanOrEqual(0);
    expect(a.scope).toBe("212 trips across 24 trucks, 1–27 Sep");
  });
});

describe("Stage 9 · counts and trip lists the answers need, stated in the data", () => {
  const ctx = buildContext();
  it("states yesterday's flagged-trip count and last week's trip count, matching their lists", () => {
    expect(ctx.yesterday.flaggedTripCount).toBe(3);
    expect(ctx.yesterday.flaggedTripCount).toBe(ctx.yesterday.flaggedTrips.length);
    expect(ctx.september.lastWeek.tripCount).toBe(5);
    expect(ctx.september.lastWeek.tripCount).toBe(ctx.september.lastWeek.trips.length);
  });

  it("lists the trips behind the recovered money and behind the flags marked wrong", () => {
    const byTrip = (id: string) => ctx.flags.filter((f) => f.trip === id);
    const recovered = ctx.september.recoveredTrips.flatMap(byTrip).reduce((n, f) => n + f.recoveredInr, 0);
    expect(recovered).toBe(ctx.september.recoveredInr);
    expect(recovered).toBe(21600);
    expect(ctx.september.wrongTrips.sort()).toEqual(["0909-07", "0920-06"]);
    expect(ctx.september.wrongTrips).toHaveLength(ctx.september.wrong);
  });

  it("the bundle carries the fleet's 24 plates, normalised", () => {
    const { plates } = getAskContext();
    expect(plates.size).toBe(24);
    expect(plates.has("RJ14GC7710")).toBe(true);
  });
});

