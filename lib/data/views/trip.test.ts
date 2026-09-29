/**
 * TripView golden tests (TSK-05.1–05.5; TC-003, TC-004, TC-005).
 * Expected strings are typed from final/trip.html and technical-plan §4.3 /
 * §5.4 as literals: an independent oracle. Never change one to make this pass.
 */
import { describe, expect, it } from "vitest";
import { formatTimeIST } from "@/lib/format";
import { getDataset } from "../index";
import { getTripIds, getTripView, topFlaggedTripId, type TripView } from "./trip";

/** Typographic apostrophes → ASCII, for comparing with the test-case text. */
const plain = (s: string) => s.replace(/’/g, "'");

function view(id: string): TripView {
  const v = getTripView(id);
  if (!v) throw new Error(`no view for ${id}`);
  return v;
}

describe("getTripIds / getTripView lookup", () => {
  it("lists every finished trip and every trip still on the road, once each", () => {
    const ds = getDataset();
    const ids = getTripIds();
    expect(ids).toHaveLength(ds.trips.length + ds.live.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("0926-04");
    expect(ids).toContain("0928-05");
  });

  it.each(["0926-4", "<x>", "0999-99", "", "../0926-04", "0926-04 "])("returns null for %j", (id) => {
    expect(getTripView(id)).toBeNull();
  });

  it("the top flagged trip is 0926-04 (yesterday's first eye row)", () => {
    expect(topFlaggedTripId()).toBe("0926-04");
  });
});

describe("TC-003 · Trip 0926-04 (R1)", () => {
  const v = view("0926-04");

  it("head", () => {
    expect(v.status).toBe("done");
    expect(v.head.plate).toBe("RJ14 GB 4521");
    expect(v.head.route).toBe("Jaipur → Delhi (Okhla)");
    expect(v.head.meta).toBe("Sat 26 Sep, 9:05 PM → Sun 27 Sep, 6:40 AM · 286 km on NH48 · 24 t cement · Driver Ramesh Kumar");
    expect(v.head.result).toMatchObject({ kind: "profit", profitInr: 13240 });
    if (v.head.result.kind !== "profit") throw new Error("expected profit");
    expect(v.head.result.vs.chip).toEqual({ text: "₹3,420 below", tone: "loss" });
    expect(v.head.result.vs.text).toBe("this route’s normal of ₹16,660");
    expect(plain(v.head.result.vs.sentence)).toBe("₹3,420 below this route's normal of ₹16,660");
  });

  it("crumbs and title", () => {
    expect(v.crumbs).toEqual({ viaEyes: true, current: "Trip 0926-04" });
    expect(v.title).toBe("Trip 0926-04 · Urja — Sharma Roadlines");
  });

  it("flag card", () => {
    expect(v.card.kind).toBe("flag");
    if (v.card.kind !== "flag") return;
    const f = v.card.flag;
    expect(f.ruleName).toBe("Stationary fuel drop");
    expect(f.confidence).toBe("high");
    expect(f.confidenceSuffix).toBe(" confidence");
    expect(f.title).toBe("38 L diesel unaccounted");
    expect(f.inr).toBe(3420);
    expect(f.amtNote).toBe("at ₹90 / L");
    expect(f.evidence).toEqual([
      { text: "Fuel fell 168 → 130 L in 26 minutes", source: "Fuel sensor", icon: "drop" },
      { text: "Parked with ignition off, 2:08–2:44 AM", source: "GPS · ignition", icon: "clock" },
      { text: "1.6 km off NH48; nearest pump is 3.1 km away", source: "Geofence", icon: "pin" },
      { text: "Same stretch flagged 4 more times this month", source: "Fleet history", icon: "route" },
    ]);
    expect(f.why).toEqual({
      label: "Why high:",
      text: "the fuel sensor stayed within ±2 L for the rest of the trip, so a 38 L drop is about 19× its normal noise.",
    });
  });

  it("driver's side and honest actions", () => {
    expect(v.driver).toMatchObject({ name: "Ramesh Kumar", first: "Ramesh", initials: "RK", since: "Driver · with Sharma Roadlines since 2019" });
    if (v.card.kind !== "flag") throw new Error("expected flag");
    const d = v.card.flag.driverSide;
    expect(plain(d.chip.text)).toBe("Ramesh hasn't been asked yet");
    expect(d.actions).toEqual({
      ask: "Ask Ramesh on WhatsApp",
      explain: "Mark as explained",
      asked: "Asked · waiting for Ramesh",
      explained: "Explained · you decide",
    });
    expect(d.message).toBe(
      "Ramesh gets a neutral message: “Fuel dropped 38 L near Behror at 2:14 AM on 27 Sep. Can you tell us what happened?” Nothing is deducted until you decide.",
    );
    expect(v.driver.note).toBe("Prototype: no message was sent. In Urja this goes to Ramesh on WhatsApp.");
  });

  it("timeline: 10 events", () => {
    expect(v.timeline.map((e) => [e.t, e.text, e.small ?? "", e.v ?? "", e.dot, e.flag])).toEqual([
      ["9:05 PM", "Left Jaipur Transport Nagar", "Fuel 210 L", "", "lamp", false],
      ["10:40 PM", "Dhaba stop, Shahpura · 50 min", "Fuel steady, checked: nothing to see", "", "ok", false],
      ["11:48 PM", "FASTag · Manoharpur plaza", "", "₹705", "", false],
      ["2:08 AM", "Parked 1.6 km off NH48 near Behror", "Ignition off 2:10 AM", "", "bad", true],
      ["2:14 AM", "Fuel fell 168 → 130 L while parked", "Flagged: stationary fuel drop", "−38 L", "bad", true],
      ["2:44 AM", "Moving again", "", "", "lamp", false],
      ["3:10 AM", "Refuelled, HP pump Neemrana", "Bill 140 L · tank rose 138 L, matches", "₹12,600", "ok", false],
      ["3:31 AM", "FASTag · Shahjahanpur plaza", "", "₹725", "", false],
      ["5:52 AM", "FASTag · Kherki Daula plaza", "", "₹710", "", false],
      ["6:40 AM", "Arrived Okhla, Delhi", "Fuel 230 L", "", "lamp", false],
    ]);
    expect(v.timeline[4].vTone).toBe("loss");
  });

  it("ledger", () => {
    expect(v.ledger.kind).toBe("done");
    if (v.ledger.kind !== "done") return;
    expect(v.ledger.rows).toEqual([
      { label: "Freight · 24 t cement", inr: 28000, kind: "row" },
      { label: "Diesel used · 118 L × ₹90", inr: -10620, kind: "row" },
      { label: "of which unaccounted · 38 L", inr: -3420, kind: "unaccounted" },
      { label: "Tolls · FASTag, 3 plazas", inr: -2140, kind: "row" },
      { label: "Driver allowance", inr: -1200, kind: "row" },
      { label: "Loading & other", inr: -800, kind: "row" },
      { label: "Profit", inr: 13240, kind: "total" },
    ]);
  });

  it("route normal chart: 14 bars, reference line at ₹16,660", () => {
    const r = v.routeNormal;
    expect(r.kind).toBe("chart");
    if (r.kind !== "chart") return;
    expect(r.normalInr).toBe(16660);
    expect(r.values).toEqual([16200, 17100, 16900, 15800, 17400, 16500, 16100, 17000, 16800, 16300, 17200, 16600, 16680, 13240]);
    expect(r.kinds).toEqual([...Array(13).fill("dim"), "loss"]);
    expect(r.caption).toBe("This route, last 14 trips");
    expect(r.refText).toBe("- - normal ₹16,660");
    expect(r.max).toBe(18500);
    expect(r.label).toBe(
      "Profit on the Jaipur to Delhi route for the last 14 trips: 13 trips between ₹15,800 and ₹17,400, and this trip at ₹13,240, ₹3,420 below the normal of ₹16,660.",
    );
  });

  it("fuel-and-speed chart: 5-min desktop, 10-min phone, from the samples", () => {
    const c = v.chart;
    expect(c.count).toBe("CAN fuel sensor + GPS · every 5 min");
    expect(c.desk.step).toBe(5);
    expect(c.desk.fuel).toHaveLength(116);
    expect(c.phone.step).toBe(10);
    // charts.js stops at 9:05 PM + 570 min; the last bar here is the 6:40 AM arrival reading (575 min).
    expect(c.phone.fuel).toHaveLength(59);
    expect(c.desk.window).toEqual([62, 67]);
    expect([c.desk.max, c.desk.ticks]).toEqual([320, [0, 100, 200, 300]]);
    expect(c.phone.window).toEqual([31, 33]);
    expect(c.desk.kind.filter((k) => k === "flag")).toHaveLength(6);
    // Refuel ramp 3:11–3:17 AM (t 366–372) glows: the 3:15 AM bar (t 370).
    expect(c.desk.kind.flatMap((k, i) => (k === "fuel" ? [i] : []))).toEqual([74]);
    // Speed is zero while parked; fuel ~168 L before the drop and ~130 L after.
    expect(c.desk.speed.slice(62, 68).every((s) => s === 0)).toBe(true);
    expect(Math.abs(c.desk.fuel[61] - 168)).toBeLessThan(2);
    expect(Math.abs(c.desk.fuel[68] - 130)).toBeLessThan(2);
    // The dashed "without the drop" line ends 38 L above the real end: 268 vs 230.
    const last = c.desk.expected!.at(-1)!;
    expect(last[0]).toBe(115);
    expect(Math.round(last[1])).toBe(268);
    expect(c.desk.expected![0][0]).toBe(62);
    expect(c.desk.notes.map((n) => n.text)).toEqual(["−38 L in 26 min", "parked, ignition off", "+138 L refuel · bill 140 L ✓", "dhaba stop · steady ✓"]);
    expect(c.desk.notes[0]).toMatchObject({ i: 61, a: "end", tone: "loss" });
    expect(c.phone.notes.map((n) => n.text)).toEqual(["−38 L, parked", "+138 L ✓"]);
    expect(c.desk.times).toEqual([
      { i: 1, text: "9 PM" },
      { i: 23, text: "11 PM" },
      { i: 47, text: "1 AM" },
      { i: 71, text: "3 AM" },
      { i: 95, text: "5 AM" },
      { i: 114, text: "6:40 AM" },
    ]);
    expect(c.phone.times).toEqual([
      { i: 1, text: "9 PM" },
      { i: 24, text: "1 AM" },
      { i: 48, text: "5 AM" },
    ]);
    expect(c.legend.map((l) => l.text)).toEqual(["Fuel", "The drop", "Refuel", "Without the drop"]);
    expect(c.note).toBe("Top: litres in the tank. Below the line: speed. The drop happened while the truck wasn’t moving.");
    expect(c.label).toBe(
      "Fuel and speed chart. Fuel falls slowly while driving, stays flat at the dhaba stop, then drops 38 litres between 2:14 and 2:40 AM while speed is zero near Behror. At 3:10 AM a refuel adds 138 litres, matching the 140 litre bill. Without the drop the tank would have ended at 268 litres instead of 230.",
    );
    expect(c.phoneLabel).toBe(
      "Fuel and speed chart: a 38 litre drop while parked near Behror at 2:14 AM, then a refuel at Neemrana that matches the bill.",
    );
  });

  it("rail: 5-min ticks with the flagged stop and the refuel, knob at 2:14 AM", () => {
    const r = v.rail;
    expect(r.head).toBe("Night of 26–27 Sep");
    expect(r.key).toBe("moving · stopped · the flagged stop · refuel");
    expect(r.ends).toEqual(["9:05 PM · Jaipur", "6:40 AM · Okhla"]);
    expect([r.total, r.step]).toEqual([575, 5]);
    expect(r.segs).toContainEqual({ from: 309, to: 335, s: "flag" });
    expect(r.segs).toContainEqual({ from: 366, to: 372, s: "fuel" });
    expect(r.segs).toContainEqual({ from: 95, to: 144, s: "stop" });
    expect(r.knob).toEqual({ t: 309, label: "2:14 AM · −38 L" });
  });
});

describe("TC-004 · Trip 0927-02 (R2)", () => {
  const v = view("0927-02");

  it("head and flag", () => {
    expect(v.head.plate).toBe("RJ14 GA 1182");
    expect(v.head.route).toBe("Ahmedabad → Jaipur");
    expect(v.head.meta).toBe("Sun 27 Sep, 3:50 AM → 7:00 PM · 662 km on NH48 · 17 t cotton bales · Driver Vikram Choudhary");
    if (v.card.kind !== "flag") throw new Error("expected flag");
    const f = v.card.flag;
    expect(f.ruleName).toBe("Refuel mismatch");
    expect(f.title).toBe("50 L diesel unaccounted");
    expect([f.inr, f.confidence, f.confidenceSuffix]).toEqual([4500, "likely", ""]);
    expect(f.evidence.map((e) => [e.source, e.icon])).toEqual([
      ["Fuel bill", "receipt"],
      ["Fuel sensor", "drop"],
      ["Geofence", "pin"],
    ]);
    expect(f.evidence[0].text).toBe("Bill says 250 L (₹22,500); the tank rose 200 L");
    expect(f.why.label).toBe("Why likely:");
  });

  it("driver's side shows he replied", () => {
    if (v.card.kind !== "flag") throw new Error("expected flag");
    const d = v.card.flag.driverSide;
    expect(d.chip).toEqual({ text: "Vikram explained · review", tone: "wait" });
    expect(d.quote).toEqual({ who: "Vikram says:", text: "“The nozzle stopped early; I told the attendant.”" });
  });

  it("uses the R2 chart variant: the refuel is the window, note 'bill 250 L · tank +200 L'", () => {
    const c = v.chart;
    expect(c.desk.notes[0].text).toBe("bill 250 L · tank +200 L");
    expect(c.desk.notes[0].tone).toBe("loss");
    expect(c.desk.window).toBeDefined();
    const [a, b] = c.desk.window!;
    // The window covers the refuel ramp (4:51–4:57 PM, t 781–787 after 3:50 AM).
    expect(c.desk.kind.slice(a, b + 1)).toContain("fuel");
    expect(c.legend.map((l) => l.text)).toEqual(["Fuel", "Refuel", "What the bill says"]);
    expect(Math.round(c.desk.expected!.at(-1)![1] - c.desk.fuel.at(-1)!)).toBe(50);
    expect(v.rail.knob).toEqual({ t: 780, label: "4:50 PM · bill ≠ tank" });
  });

  it("timeline flags the refuel", () => {
    const e = v.timeline.find((x) => x.text === "Refuelled, Kishangarh pump")!;
    expect(e).toMatchObject({ t: "4:50 PM", flag: true, dot: "bad", small: "Bill 250 L · tank rose 200 L · flagged: refuel mismatch", v: "₹22,500" });
  });

  it("ledger from data", () => {
    if (v.ledger.kind !== "done") throw new Error("expected done");
    expect(v.ledger.rows[1]).toEqual({ label: "Diesel used · 236 L × ₹90", inr: -21240, kind: "row" });
    expect(v.ledger.rows[2]).toEqual({ label: "of which unaccounted · 50 L", inr: -4500, kind: "unaccounted" });
    expect(v.ledger.rows.at(-1)).toEqual({ label: "Profit", inr: 8360, kind: "total" });
  });
});

describe("TC-005 · Trip 0926-11 (R3)", () => {
  const v = view("0926-11");

  it("head and flag", () => {
    expect(v.head.meta).toBe("Sat 26 Sep, 4:30 AM → Sun 27 Sep, 8:10 AM · 1,150 km on NH48 · 26 t steel coils · Driver Anil Bairwa");
    if (v.card.kind !== "flag") throw new Error("expected flag");
    const f = v.card.flag;
    expect(f.ruleName).toBe("Excess consumption");
    expect(f.title).toBe("Used 39 L more diesel than usual");
    expect([f.inr, f.confidence]).toEqual([3510, "check"]);
    expect(f.evidence.map((e) => e.text)).toEqual([
      "Used 364 L; this truck's normal on this route is 325 L (12% more)",
      "Spread across the trip, no single stop",
      "Load 26 t (usual 22 t)",
    ]);
    expect(f.why.label).toBe("Why check:");
    expect(f.why.text).toBe(
      "the truck carried 26 t against a usual 22 t, and the normal doesn't allow for load, so the extra diesel may be the load.",
    );
  });

  it("uses the R3 chart variant: no window, dashed normal-use line, note 'used 364 L · normal 325 L'", () => {
    const c = v.chart;
    expect(c.desk.window).toBeUndefined();
    expect(c.desk.kind.includes("flag")).toBe(false);
    expect(c.desk.notes.map((n) => n.text)).toContain("used 364 L · normal 325 L");
    expect(c.legend.map((l) => l.text)).toEqual(["Fuel", "Refuel", "This truck’s normal use"]);
    expect(Math.round(c.desk.expected!.at(-1)![1] - c.desk.fuel.at(-1)!)).toBe(39);
    expect(c.desk.expected![0][0]).toBe(0);
    expect(c.count).toMatch(/^CAN fuel sensor \+ GPS · every \d+ min$/);
    expect(c.desk.fuel.length).toBeLessThanOrEqual(120);
  });
});

describe("§5.4 · R4, R5 and clean variants", () => {
  it("R4 (0901-04): planned vs actual km, the chart unchanged", () => {
    const v = view("0901-04");
    if (v.card.kind !== "flag") throw new Error("expected flag");
    expect(v.card.flag.ruleName).toBe("Route deviation");
    expect(v.card.flag.title).toBe("59 extra km off route");
    expect(v.card.flag.evidence[0]).toMatchObject({ text: "Drove 721 km against a planned 662 km (+9%)", source: "Trip plan" });
    expect(v.card.flag.driverSide.actions).toBeNull();
    expect(v.card.flag.driverSide.chip.text).toBe("Confirmed · ₹1,480 recovered");
    expect(v.chart.desk.expected).toBeUndefined();
    expect(v.chart.desk.kind.includes("flag")).toBe(false);
    expect(v.chart.tolls).toBeNull();
  });

  it("R5 (0831-02): a claims vs FASTag table replaces the chart note", () => {
    const v = view("0831-02");
    if (v.card.kind !== "flag") throw new Error("expected flag");
    expect(v.card.flag.ruleName).toBe("Toll mismatch");
    expect(v.card.flag.title).toBe("Toll claim doesn’t match FASTag");
    expect(v.card.flag.evidence[0].source).toBe("FASTag");
    expect(v.card.flag.why.text).toMatch(/^FASTag deductions are exact records/);
    expect(v.chart.note).toBeNull();
    const t = v.chart.tolls!;
    expect(t.rows).toHaveLength(7);
    expect(t.rows.reduce((a, r) => a + r.inr, 0)).toBe(7400);
    expect([t.fastagInr, t.claimedInr, t.diffInr]).toEqual([7400, 8620, 1220]);
  });

  it("clean trip (0927-09): 'Every check passed' with the list of checks, fractional litres to 2 dp", () => {
    const v = view("0927-09");
    expect(v.card.kind).toBe("clean");
    if (v.card.kind !== "clean") return;
    expect(v.card.title).toBe("Every check passed");
    expect(v.card.checks.map((c) => c.source)).toEqual(["Fuel sensor", "Fuel bill", "Fleet history", "Trip plan", "FASTag"]);
    expect(v.chart.desk.window).toBeUndefined();
    expect(v.chart.desk.expected).toBeUndefined();
    if (v.ledger.kind !== "done") throw new Error("expected done");
    expect(v.ledger.rows[1].label).toBe("Diesel used · 189.89 L × ₹90");
    expect(v.ledger.rows.some((r) => r.kind === "unaccounted")).toBe(false);
    expect(v.crumbs.viaEyes).toBe(false);
  });

  it("whole litres on every other trip's ledger", () => {
    for (const id of ["0926-04", "0927-02", "0926-11", "0901-04"]) {
      const v = view(id);
      if (v.ledger.kind !== "done") throw new Error("expected done");
      expect(v.ledger.rows[1].label).toMatch(/^Diesel used · \d[\d,]* L × ₹90$/);
    }
  });
});

describe("EXE9 · no earlier clean trip on the route", () => {
  it("says so instead of inventing a normal", () => {
    const v = view("0829-01");
    expect(v.routeNormal.kind).toBe("none");
    if (v.head.result.kind !== "profit") throw new Error("expected profit");
    expect(v.head.result.vs.chip).toBeNull();
    expect(plain(v.head.result.vs.sentence)).toBe("No earlier clean trip on this route yet, so there's no normal to compare");
  });
});

describe("in-progress trips render honestly", () => {
  const v = view("0928-05");

  it("has no profit, flag or ledger yet", () => {
    expect(v.status).toBe("live");
    expect(v.head.result.kind).toBe("live");
    expect(v.card.kind).toBe("live");
    expect(v.ledger.kind).toBe("live");
    expect(v.routeNormal.kind).toBe("none");
    expect(v.head.meta).toMatch(/^Left Mon 28 Sep, \d{1,2}:\d{2} AM · on the road at 7:12 AM · /);
    expect(v.timeline.at(-1)!.text).toBe("On the road · last reading 7:12 AM");
  });
});

describe("every trip builds a view", () => {
  const ds = getDataset();
  const all = [...ds.trips, ...ds.live];
  /** As the series rounds a reading: litres to 0.1. */
  const litres = (cl: number) => Math.round(cl / 10) / 10;
  const bars = (v: TripView) => [v.chart.desk, v.chart.phone] as const;

  it("with finite chart series", () => {
    for (const id of getTripIds()) {
      const v = view(id);
      expect(v.chart.desk.fuel.every(Number.isFinite)).toBe(true);
      expect(v.chart.desk.fuel.length).toBeGreaterThan(1);
      expect(v.chart.desk.fuel.length).toBeLessThanOrEqual(130);
      expect(v.timeline.length).toBeGreaterThanOrEqual(2);
      expect(v.chart.desk.times.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("ends both series on the last reading, and the desktop end tick names its time", () => {
    for (const t of all) {
      const v = view(t.id);
      const last = t.samples[t.samples.length - 1];
      for (const s of bars(v)) expect([t.id, s.fuel.at(-1)]).toEqual([t.id, litres(last.fuelCl)]);
      expect([t.id, v.chart.desk.times.at(-1)!.text]).toEqual([t.id, formatTimeIST(last.t)]);
      // The chart label's end figure is the same reading the timeline reports.
      if (v.status === "done" && t.tank.endCl % 100 === 0) {
        const end = v.timeline.find((e) => e.text.startsWith("Arrived") || e.text.startsWith("Back at"))!;
        expect([t.id, end.small]).toEqual([t.id, `Fuel ${Math.round(last.fuelCl / 100)} L`]);
      }
    }
  });

  it("puts hour ticks on the bar nearest that hour", () => {
    for (const t of all) {
      const v = view(t.id);
      for (const s of bars(v)) {
        for (const tick of s.times.slice(1, s === v.chart.desk ? -1 : undefined)) {
          const at = Math.min(t.start + tick.i * s.step, t.samples[t.samples.length - 1].t);
          const hour = Math.round(at / 60) * 60;
          expect([t.id, Math.abs(at - hour) <= s.step / 2 + 0.5]).toEqual([t.id, true]);
        }
      }
    }
  });

  it("keeps notes, ticks and the window inside the series, and the timeline in time order", () => {
    for (const id of getTripIds()) {
      const v = view(id);
      for (const s of bars(v)) {
        const n = s.fuel.length;
        expect([s.speed.length, s.kind.length]).toEqual([n, n]);
        for (const x of [...s.notes, ...s.times]) expect([id, x.i >= 0 && x.i < n]).toEqual([id, true]);
        if (s.window) expect([id, 0 <= s.window[0] && s.window[0] <= s.window[1] && s.window[1] < n]).toEqual([id, true]);
        for (const [i] of s.expected ?? []) expect([id, i >= 0 && i < n]).toEqual([id, true]);
      }
      const at = v.timeline.map((e) => e.at);
      expect(at.every(Number.isFinite)).toBe(true);
      expect([id, at]).toEqual([id, [...at].sort((a, b) => a - b)]);
    }
  });

  it("never smooths an R1 drop away: the bars either side of the window differ by the flag's litres", () => {
    const r1 = ds.flags.filter((f) => f.rule === "R1");
    expect(r1.length).toBeGreaterThanOrEqual(5);
    for (const f of r1) {
      for (const s of bars(view(f.tripId))) {
        const [a, b] = s.window!;
        const drop = s.fuel[a - 1] - s.fuel[b + 1];
        expect([f.id, s.step, Math.abs(drop - f.litres!) <= 6]).toEqual([f.id, s.step, true]);
      }
    }
  });
});
