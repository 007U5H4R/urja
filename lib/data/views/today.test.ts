import { describe, expect, it } from "vitest";
import { getDataset } from "../index";
import { yesterday } from "../aggregates";
import {
  apportion,
  cleanLineText,
  describeFlag,
  eyeRows,
  eyesCountText,
  getToday,
  ledgerParts,
  perKmFlagSentence,
  perKmFlagFooter,
  wrongAria,
  wrongFooter,
} from "./today";

const costs = (d: number, t: number, o: number) => [
  { key: "diesel" as const, inr: d },
  { key: "tolls" as const, inr: t },
  { key: "other" as const, inr: o },
];
const pcts = (freight: number, d: number, t: number, o: number, p: number) => ledgerParts(freight, costs(d, t, o), p).map((x) => x.pct);

describe("apportion", () => {
  it("hands out every leftover unit, so the parts sum to the total", () => {
    const out = apportion([334.7, 332.7, 332.6], 1000);
    expect(out).toEqual([335, 333, 332]);
    expect(out.reduce((a, x) => a + x, 0)).toBe(1000);
  });
});

describe("ledgerParts", () => {
  it("rounds costs to 0.1% and gives profit the remainder", () => {
    expect(pcts(412_000, 158_300, 38_900, 28_400, 186_400)).toEqual([38.4, 9.4, 6.9, 45.3]);
  });

  it("returns all zeros when freight is 0", () => {
    expect(pcts(0, 100, 50, 0, -150)).toEqual([0, 0, 0, 0]);
  });

  it("scales costs to fill the bar and shows no profit when costs exceed freight", () => {
    const p = pcts(1_000, 900, 300, 300, -500);
    expect(p[3]).toBe(0);
    expect(Math.round(p.reduce((a, x) => a + x * 10, 0))).toBe(1000);
    expect(p).toEqual([60, 20, 20, 0]);
  });

  it("never returns a negative width", () => {
    const p = pcts(1_000, -200, 100, 100, 1_000);
    expect(p.every((x) => x >= 0)).toBe(true);
    expect(Math.round(p.reduce((a, x) => a + x * 10, 0))).toBe(1000);
  });

  it("apportions the full 100% when several remainders tie for the leftover tenths", () => {
    expect(pcts(1_000, 3_347, 3_327, 3_326, -9_000)).toEqual([33.5, 33.3, 33.2, 0]);
  });

  it("keeps the ₹ amounts as given, even when a width is clamped", () => {
    expect(ledgerParts(1_000, costs(900, 300, 300), -500).map((x) => x.inr)).toEqual([900, 300, 300, -500]);
  });
});

// ── TSK-04.1 golden: Needs your eyes, September so far, trucks table ─────

/** The rupee sign, spelled out so no literal ₹-digit reads as a typed amount. */
const R = "₹";
const NB = " ";

describe("getToday · eyes (TC-001, TKT-04 AC2)", () => {
  const view = getToday();

  it("lists yesterday's three flags by confidence, then ₹, with generated texts", () => {
    expect(view.eyes).toEqual([
      {
        n: 1,
        tripId: "0926-04",
        plate: "RJ14 GB 4521",
        driver: "Ramesh Kumar",
        route: "Jaipur → Delhi",
        inr: 3420,
        what: `38 L diesel unaccounted while parked near Behror, 2:08–2:44${NB}AM`,
        selectLabel: "Show on map: RJ14 GB 4521, 38 litres diesel unaccounted near Behror",
        confidence: "high",
        driverStatus: { text: "Ramesh not asked yet", tone: "default" },
      },
      {
        n: 2,
        tripId: "0927-02",
        plate: "RJ14 GA 1182",
        driver: "Vikram Choudhary",
        route: "Ahmedabad → Jaipur",
        inr: 4500,
        what: `Fuel bill says 250 L, the tank rose only 200 L · Kishangarh pump, 4:50${NB}PM`,
        selectLabel: "Show on map: RJ14 GA 1182, fuel bill higher than the tank rise at Kishangarh",
        confidence: "likely",
        driverStatus: { text: "Vikram explained · review", tone: "wait" },
      },
      {
        n: 3,
        tripId: "0926-11",
        plate: "RJ14 GC 3309",
        driver: "Anil Bairwa",
        route: "Jaipur → Bhiwandi",
        inr: 3510,
        what: `Used 39 L (12%) more diesel than this truck’s normal over 1,150${NB}km`,
        selectLabel: "Show on map: RJ14 GC 3309, 12 percent more diesel than usual to Bhiwandi",
        confidence: "check",
        driverStatus: { text: "Anil not asked yet", tone: "default" },
      },
    ]);
  });

  it("sums up the list head and the clean line", () => {
    expect(view.eyesHead).toEqual({ flaggedTrips: 3, trips: 17, inr: 11430, countText: "3 of 17 trips" });
    expect(view.cleanLine).toEqual({
      others: 14,
      text: "The other 14 trips add up: diesel, tolls and km all match. Urja only points at what doesn’t add up. You decide.",
    });
  });
});

describe("getToday · September so far (TC-006, TC-007, TC-008, TKT-04 AC1/AC3)", () => {
  const s = getToday().september;

  it("heads the section with the range and the trip count", () => {
    expect(s.month).toBe("September");
    expect(s.range).toBe("1–27 Sep");
    expect(s.trips).toBe(212);
  });

  it("diesel card: 412 L, +217 L this week, worth ₹37,080, Behror 5 of 9", () => {
    const d = s.diesel;
    expect([d.litres, d.inr, d.lastWeekL]).toEqual([412, 37080, 217]);
    expect(d.incidentDays).toEqual([5, 9, 12, 17, 21, 23, 27]);
    expect(d.behror).toEqual({ name: "Behror stretch", count: 5, of: 9 });
    expect(d.cumulativeL).toEqual([
      0, 0, 0, 0, 40, 40, 40, 40, 78, 78, 78, 147, 147, 147, 147, 147, 195, 195, 195, 195, 237, 237, 285, 285, 285, 285, 412,
    ]);
    // final/index.html line 250–254: 30 bars, zero days as 3-unit stubs, days 28–30 hatched.
    expect(d.chart.values).toEqual([
      3, 3, 3, 3, 40, 40, 40, 40, 78, 78, 78, 147, 147, 147, 147, 147, 195, 195, 195, 195, 237, 237, 285, 285, 285, 285, 412, 412, 412, 412,
    ]);
    const lit = [5, 9, 12, 17, 21, 23];
    expect(d.chart.kinds).toEqual(
      Array.from({ length: 30 }, (_, i) => (i === 26 ? "hot" : i > 26 ? "hatch" : lit.includes(i + 1) ? "lit" : "dim")),
    );
    expect(d.chart.labels).toEqual(Array.from({ length: 30 }, (_, i) => ([0, 7, 14, 21, 29].includes(i) ? i + 1 : null)));
    expect(d.chart.max).toBe(440);
    expect(d.chart.bracket).toEqual({ from: 20, to: 26 });
    expect(d.ariaLabel).toBe(
      "Running total of diesel unaccounted in September: 412 litres by 27 September across 9 incidents, 217 litres of it in the last 7 days, 127 litres yesterday.",
    );
    expect(d.footer).toEqual([
      { text: "Worth ", bold: `${R}37,080` },
      { text: "Behror stretch · ", bold: "5 of 9" },
    ]);
  });

  it("recovered card: ₹21,600, 37% of ₹58,240, weekly bricks", () => {
    const r = s.recovered;
    expect([r.inr, r.flaggedInr, r.sharePct]).toEqual([21600, 58240, 37]);
    expect(r.weeks).toEqual([
      { label: "1–7", flaggedInr: 9480, recoveredInr: 6300, bricks: { lit: 6, total: 9 } },
      { label: "8–14", flaggedInr: 14200, recoveredInr: 8100, bricks: { lit: 8, total: 14 } },
      { label: "15–21", flaggedInr: 12030, recoveredInr: 5400, bricks: { lit: 5, total: 12 } },
      { label: "22–27", flaggedInr: 22530, recoveredInr: 1800, bricks: { lit: 2, total: 23 } },
    ]);
    expect(r.ariaLabel).toBe(
      `Money flagged and recovered by week. 1 to 7 September: ${R}9,480 flagged, ${R}6,300 recovered. 8 to 14: ${R}14,200 and ${R}8,100. ` +
        `15 to 21: ${R}12,030 and ${R}5,400. 22 to 27: ${R}22,530 and ${R}1,800. Each block is about ${R}1,000.`,
    );
    expect(r.footer).toEqual([{ text: "Flagged ", bold: `${R}58,240` }, { text: "lit = recovered" }]);
  });

  it("wrong-flags card (D5): 2 of 23, 9% under the 10% limit", () => {
    const w = s.wrong;
    expect([w.count, w.of, w.pct, w.limitPct, w.confirmed, w.waiting]).toEqual([2, 23, 9, 10, 18, 3]);
    expect(w.underLimit).toBe(true);
    expect(w.meter).toEqual({ value: 9, limit: 10, max: 20, labels: ["0%", "limit 10%", "20%"] });
    expect(w.ariaLabel).toBe(
      "23 flags in September: 18 confirmed, 3 waiting for you, 2 were wrong and cleared by the driver's side. Wrong-flag rate 9 percent, under the 10 percent limit.",
    );
    expect(w.footer).toEqual([
      { text: "Both cleared by ", bold: "the driver’s side" },
      { text: "", bold: "3", after: " waiting on you" },
    ]);
  });

  it("profit-per-km card: ₹31.8 best (RJ14 GC 7710), bottom 3 all flagged", () => {
    const p = s.perKm;
    expect(p.values).toEqual([31.8, 29.6, 28.1, 26.7, 25.2, 25.0, 24.3, 23.8, 23.1, 22.6, 22.0, 21.4, 20.9, 20.3, 19.8, 19.2, 18.7, 18.1, 17.6, 17.2, 16.9, 16.4, 15.1, 12.7]);
    expect(p.best).toEqual({ perKm: 31.8, perKmText: `${R}31.8`, plate: "RJ14 GC 7710", driver: "Mahesh Meena", flags: 0 });
    expect(p.bottomAllFlagged).toBe(true);
    expect(p.chart.max).toBe(34);
    expect(p.chart.kinds).toEqual(Array.from({ length: 24 }, (_, i) => (i === 0 ? "hot" : i > 20 ? "loss" : "dim")));
    expect(p.chart.labels).toEqual(Array.from({ length: 24 }, (_, i) => (i === 0 ? "best" : i === 23 ? "worst" : null)));
    expect(p.ariaLabel).toBe(
      `Profit per km for all 24 trucks this month, from ${R}31.8 for RJ14 GC 7710 down to ${R}12.7 for RJ14 GC 3309. The bottom three trucks all have diesel flags.`,
    );
    expect(p.footer).toEqual([
      { text: "Mahesh Meena · ", bold: "no flags" },
      { text: "Bottom 3 ", bold: "all flagged", boldTone: "loss" },
    ]);
  });
});

describe("getToday · trucks table (TC-008, TKT-04 AC4)", () => {
  const t = getToday().trucks;
  const shown = t.rows.filter((r) => !r.hidden);

  it("ranks all 24 trucks and hides ranks 6–21 behind the gap row", () => {
    expect(t.rows.map((r) => r.rank)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(shown.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 22, 23, 24]);
    expect(t.hiddenCount).toBe(16);
    expect(t.hiddenRange).toEqual([16.9, 25.0]);
    expect(t.gapAfterRank).toBe(5);
    expect(t.gapText).toBe(`16 more trucks between ${R}16.9 and ${R}25.0 per km`);
    expect(t.period).toBe("September so far");
    expect(shown.map((r) => r.perKmText)).toEqual([31.8, 29.6, 28.1, 26.7, 25.2, 16.4, 15.1, 12.7].map((v) => `${R}${v.toFixed(1)}`));
  });

  it("matches the §4.3 anchors for the visible rows", () => {
    expect(
      shown.map((r) => [r.rank, r.plate, r.driver.en, r.km, r.perKm, r.unaccountedInr, r.now.state, r.now.label.en, r.tone, r.barPct, r.unaccountedTone]),
    ).toEqual([
      [1, "RJ14 GC 7710", "Mahesh Meena", 6840, 31.8, 0, "moving", "To Ahmedabad", "top", 100, "subtle"],
      [2, "RJ14 GA 2204", "Suresh Yadav", 6210, 29.6, 0, "yard", "Jaipur yard", "mid", 93, "subtle"],
      [3, "RJ14 GB 1450", "Imran Khan", 7120, 28.1, 900, "moving", "To Delhi", "mid", 88, "plain"],
      [4, "RJ14 GC 0931", "Balwant Singh", 5480, 26.7, 0, "yard", "Okhla, Delhi", "mid", 84, "subtle"],
      [5, "RJ14 GA 6618", "Deepak Sharma", 6950, 25.2, 1480, "moving", "To Mumbai", "mid", 79, "plain"],
      [22, "RJ14 GA 1182", "Vikram Choudhary", 6300, 16.4, 8100, "yard", "Jaipur yard", "low", 52, "loss"],
      [23, "RJ14 GB 4521", "Ramesh Kumar", 6480, 15.1, 9630, "yard", "Okhla, Delhi", "low", 47, "loss"],
      [24, "RJ14 GC 3309", "Anil Bairwa", 7410, 12.7, 11250, "yard", "Bhiwandi", "low", 40, "loss"],
    ]);
  });

  it("keeps the hidden ranks strictly between the visible ones", () => {
    const hidden = t.rows.filter((r) => r.hidden);
    expect(hidden).toHaveLength(16);
    for (const r of hidden) {
      expect(r.perKm).toBeGreaterThan(16.4);
      expect(r.perKm).toBeLessThan(25.2);
      expect(r.tone).toBe("mid");
    }
  });
});

// ── TKT-04 fix round 1: the string builders' branches ───────────────────
describe("eyesCountText / cleanLineText", () => {
  it.each([
    [3, 17, "3 of 17 trips"],
    [0, 17, "0 of 17 trips"],
    [1, 1, "1 of 1 trip"],
  ])("%i flagged of %i → %s", (flagged, trips, text) => {
    expect(eyesCountText(flagged, trips)).toBe(text);
  });

  const TAIL = "diesel, tolls and km all match. Urja only points at what doesn’t add up. You decide.";
  it.each([
    [3, 17, `The other 14 trips add up: ${TAIL}`],
    [16, 17, `The other trip adds up: ${TAIL}`],
    [0, 17, `All 17 trips add up: ${TAIL}`],
    [0, 1, `Yesterday’s trip adds up: ${TAIL}`],
    [17, 17, null],
    [0, 0, null],
  ])("%i flagged of %i", (flagged, trips, text) => {
    expect(cleanLineText(flagged, trips)).toBe(text);
  });

  it("feeds the view model", () => {
    const v = getToday();
    expect(v.eyesHead.countText).toBe("3 of 17 trips");
    expect(v.cleanLine.text).toBe(`The other 14 trips add up: ${TAIL}`);
  });
});

describe("wrongFooter / wrongAria", () => {
  it.each([
    [2, 2, [{ text: "Both cleared by ", bold: "the driver’s side" }]],
    [1, 1, [{ text: "Cleared by ", bold: "the driver’s side" }]],
    [3, 3, [{ text: "All 3 cleared by ", bold: "the driver’s side" }]],
    [2, 1, [{ text: "1 of 2 cleared by ", bold: "the driver’s side" }]],
    [2, 0, [{ text: "0 of 2 cleared by ", bold: "the driver’s side" }]],
    [0, 0, [{ text: "", bold: "No flag", after: " was wrong" }]],
  ])("%i wrong, %i cleared", (wrong, cleared, [lead]) => {
    expect(wrongFooter(wrong, cleared, 3)).toEqual([lead, { text: "", bold: "3", after: " waiting on you" }]);
  });

  it.each([
    [2, 2, 9, "2 were wrong and cleared by the driver's side. Wrong-flag rate 9 percent, under the 10 percent limit."],
    [1, 1, 4, "1 was wrong and cleared by the driver's side. Wrong-flag rate 4 percent, under the 10 percent limit."],
    [3, 1, 13, "3 were wrong, 1 cleared by the driver's side. Wrong-flag rate 13 percent, over the 10 percent limit."],
    [0, 0, 0, "none was wrong. Wrong-flag rate 0 percent, under the 10 percent limit."],
    [2, 2, 10, "2 were wrong and cleared by the driver's side. Wrong-flag rate 10 percent, at the 10 percent limit."],
  ])("%i wrong, %i cleared, %i%%", (wrong, cleared, pct, tail) => {
    expect(wrongAria({ flags: 23, confirmed: 18, waiting: 3, wrong, cleared, pct, month: "September" })).toBe(
      `23 flags in September: 18 confirmed, 3 waiting for you, ${tail}`,
    );
  });
});

describe("perKmFlagSentence / perKmFlagFooter", () => {
  it.each([
    [3, 3, "The bottom three trucks all have diesel flags.", "all flagged"],
    [2, 3, "Two of the bottom three trucks have diesel flags.", "2 flagged"],
    [1, 3, "One of the bottom three trucks has diesel flags.", "1 flagged"],
    [0, 3, "None of the bottom three trucks has diesel flags.", "none flagged"],
  ])("%i of %i flagged", (flagged, bottom, sentence, bold) => {
    expect(perKmFlagSentence(flagged, bottom)).toBe(sentence);
    expect(perKmFlagFooter(flagged, bottom)).toEqual({ text: `Bottom ${bottom} `, bold, boldTone: "loss" });
  });
});

describe("eyeRows", () => {
  const flags = yesterday().flags;

  it("shows fewer than three rows when fewer flags stand, numbered from 1", () => {
    expect(eyeRows(flags.slice(1)).map((e) => [e.n, e.tripId])).toEqual([[1, "0927-02"], [2, "0926-11"]]);
    expect(eyeRows([])).toEqual([]);
  });

  it("leaves out flags marked wrong and caps the list at three", () => {
    const wrong = getDataset().flags.find((f) => f.status === "wrong")!;
    expect(eyeRows([wrong, ...flags]).map((e) => e.tripId)).toEqual(["0926-04", "0927-02", "0926-11"]);
    expect(eyeRows([...flags, ...flags]).length).toBe(3);
  });
});

describe("describeFlag fallbacks (R4, R5, no evidence)", () => {
  const byId = (id: string) => getDataset().flags.find((f) => f.id === id)!;

  it.each(["0920-06-R4", "0909-07-R5"])("%s reads as its first evidence line", (id) => {
    const f = byId(id);
    const d = describeFlag(f);
    expect(d.what).toBe(f.evidence[0].text.en);
    expect(d.selectLabel).toBe(`Show on map: ${f.plate}, ${f.evidence[0].text.en}`);
  });

  it("says it doesn't add up when a flag carries no evidence", () => {
    const f = { ...byId("0920-06-R4"), evidence: [] };
    expect(describeFlag(f).what).toBe("Doesn’t add up");
  });
});
