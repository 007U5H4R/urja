/**
 * Golden values (TSK-02.7, TC-001..TC-010). Every expected value below is
 * typed from HANDOFF.md "Fixed numbers" and technical-plan §4.3 as a literal:
 * an independent oracle. Nothing here is read from scripts/anchors.ts or
 * computed from the engine. Never change a value to make this pass.
 */
import { describe, expect, it } from "vitest";
import { istMin } from "@/lib/clock";
import {
  cleanDays, dayProfit, days, fleetNow, last7, ledgerFor, routeNormal, september, stretch, truckDiesel, truckGap,
  trucks, weeks, yesterday,
} from "./aggregates";
import { truckByPlate } from "./fleet";
import { getDataset, tripById } from "./index";
import { routeById } from "./routes";
import { getTodayHead } from "./views/today";

const ds = getDataset();
const flagOf = (tripId: string, rule: string) => {
  const f = ds.flags.find((x) => x.tripId === tripId && x.rule === rule);
  if (!f) throw new Error(`no ${rule} flag on ${tripId}`);
  return f;
};
const sorted = (xs: readonly string[]) => [...xs].sort();

describe("TC-001 · yesterday's ledger totals (Sun 27 Sep)", () => {
  const y = yesterday();

  it("17 trips: ₹4,12,000 − ₹1,58,300 − ₹38,900 − ₹28,400 = ₹1,86,400", () => {
    expect(y.dayKey).toBe("2026-09-27");
    expect([y.trips, y.freightInr, y.dieselInr, y.tollsInr, y.otherInr, y.profitInr]).toEqual([17, 412000, 158300, 38900, 28400, 186400]);
    expect(y.tripIds).toHaveLength(17);
  });

  it("exactly 6 of the 17 trips are on routes through the Udaipur stretch", () => {
    expect(y.udaipurTrips).toBe(6);
    expect(y.tripIds.filter((id) => routeById(tripById(id).routeId).stretches.includes("udaipur"))).toHaveLength(6);
  });

  it("splits the ledger bar 38.4 / 9.4 / 6.9 / 45.3, summing to 100", () => {
    const { ledger } = getTodayHead();
    expect(ledger.freightInr).toBe(412000);
    expect(ledger.parts).toEqual([
      { key: "diesel", inr: 158300, pct: 38.4 },
      { key: "tolls", inr: 38900, pct: 9.4 },
      { key: "other", inr: 28400, pct: 6.9 },
      { key: "profit", inr: 186400, pct: 45.3 },
    ]);
    expect(Math.round(ledger.parts.reduce((a, p) => a + p.pct * 10, 0))).toBe(1000);
    expect(ledger.ariaLabel).toBe(
      "Yesterday's ledger: freight billed ₹4,12,000; diesel ₹1,58,300; tolls ₹38,900; driver allowance and other ₹28,400; profit ₹1,86,400",
    );
  });

  it("builds the Today head: greeting, verdict and tags", () => {
    const head = getTodayHead();
    expect(head.greeting).toEqual({ en: "Good morning, Sharma ji · Monday, 28 September" });
    expect(head.verdict).toEqual({ earnedInr: 186400, unaccountedInr: 11430, flaggedTrips: 3 });
    expect(head.tags).toEqual({ day: "Yesterday · Sun 27 Sep", reconciled: "17 trips reconciled at 6:55 AM" });
  });
});

describe("TC-002 · yesterday's unaccounted breakdown", () => {
  const y = yesterday();

  it("lists flags 1–3 in order: High, Likely, Check", () => {
    expect(y.flags.map((f) => [f.tripId, f.rule, f.litres, f.inr, f.confidence])).toEqual([
      ["0926-04", "R1", 38, 3420, "high"],
      ["0927-02", "R2", 50, 4500, "likely"],
      ["0926-11", "R3", 39, 3510, "check"],
    ]);
  });

  it("totals ₹11,430 = ₹3,420 + ₹4,500 + ₹3,510 = 127 L at ₹90/L", () => {
    expect([y.unaccountedInr, y.unaccountedL]).toEqual([11430, 127]);
  });

  it("leaves the other 14 trips with no flag", () => {
    const flagged = new Set(ds.flags.map((f) => f.tripId));
    expect(y.tripIds.filter((id) => !flagged.has(id))).toHaveLength(14);
  });
});

describe("TC-003 · trip 0926-04 (flag 1, R1): the data", () => {
  const t = tripById("0926-04");
  const f = flagOf("0926-04", "R1");

  it("RJ14 GB 4521 · Ramesh Kumar · Jaipur → Okhla, 286 km, 24 t, Sat 26 Sep 9:05 PM → Sun 27 Sep 6:40 AM", () => {
    expect([t.plate, t.routeId, routeById(t.routeId).plannedKm, t.loadT, t.cargo.en]).toEqual(["RJ14 GB 4521", "JAI-OKH", 286, 24, "cement"]);
    expect([t.start, t.end, t.end - t.start]).toEqual([istMin(2026, 9, 26, 21, 5), istMin(2026, 9, 27, 6, 40), 575]);
  });

  it("flags 38 L (₹3,420, High) parked near Behror, 2:14–2:40 AM, with the mockup's evidence", () => {
    expect([f.litres, f.inr, f.confidence, f.placeId, f.at, f.until]).toEqual([38, 3420, "high", "behror", istMin(2026, 9, 27, 2, 14), istMin(2026, 9, 27, 2, 40)]);
    expect(f.evidence.map((e) => [e.text.en, e.source])).toEqual([
      ["Fuel fell 168 → 130 L in 26 minutes", "Fuel sensor"],
      ["Parked with ignition off, 2:08–2:44 AM", "GPS · ignition"],
      ["1.6 km off NH48; nearest pump is 3.1 km away", "Geofence"],
      ["Same stretch flagged 4 more times this month", "Fleet history"],
    ]);
    expect(f.whyConfidence.en).toMatch(/±2 L/);
    expect(f.whyConfidence.en).toMatch(/19×/);
    expect([f.status, f.driverSide.state, f.recoveredInr]).toEqual(["waiting", "not-asked", 0]);
  });

  it("FASTag ₹705 / ₹725 / ₹710; Neemrana bill 140 L = ₹12,600 against a 138 L tank rise", () => {
    expect(t.fastag.map((e) => [e.t - t.start, e.inr])).toEqual([[163, 705], [386, 725], [527, 710]]);
    expect(t.refuels.map((r) => [r.t, r.billedCl, r.billedInr, r.tankRiseCl])).toEqual([[istMin(2026, 9, 27, 3, 10), 14000, 12600, 13800]]);
  });

  it("ledger: ₹28,000 − ₹10,620 (118 L, of which 38 L = ₹3,420 unaccounted) − ₹2,140 − ₹1,200 − ₹800 = ₹13,240", () => {
    expect(ledgerFor("0926-04")).toEqual({
      freightInr: 28000, dieselCl: 11800, dieselInr: 10620, unaccountedCl: 3800, unaccountedInr: 3420,
      tollsInr: 2140, allowanceInr: 1200, otherInr: 800, profitInr: 13240,
    });
  });

  it("route normal ₹16,660: the 13 previous clean Jaipur → Okhla trips, all ending 13–26 Sep", () => {
    const rn = routeNormal("0926-04");
    expect(rn?.normalInr).toBe(16660);
    expect(rn?.history.map((h) => h.profitInr)).toEqual([16200, 17100, 16900, 15800, 17400, 16500, 16100, 17000, 16800, 16300, 17200, 16600, 16680]);
    expect(rn?.history.reduce((a, h) => a + h.profitInr, 0)).toBe(216580);
    for (const h of rn!.history) {
      expect(h.dayKey >= "2026-09-13" && h.dayKey <= "2026-09-26").toBe(true);
      expect(ds.flags.some((x) => x.tripId === h.tripId)).toBe(false);
      expect(tripById(h.tripId).routeId).toBe("JAI-OKH");
    }
  });
});

describe("TC-004 · trip 0927-02 (flag 2, R2)", () => {
  const t = tripById("0927-02");
  const f = flagOf("0927-02", "R2");

  it("RJ14 GA 1182 · Ahmedabad → Jaipur, 662 km, Sun 27 Sep 3:50 AM → 7:00 PM", () => {
    expect([t.plate, t.routeId, routeById(t.routeId).plannedKm]).toEqual(["RJ14 GA 1182", "AHM-JAI", 662]);
    expect([t.start, t.end, t.end - t.start]).toEqual([istMin(2026, 9, 27, 3, 50), istMin(2026, 9, 27, 19, 0), 910]);
  });

  it("Kishangarh pump, 4:50 PM: bill 250 L, tank rose 200 L → 50 L, ₹4,500, Likely; Vikram replied", () => {
    expect([f.at, f.placeId, f.litres, f.inr, f.confidence]).toEqual([istMin(2026, 9, 27, 16, 50), "kishangarh-pump", 50, 4500, "likely"]);
    const bill = t.refuels.find((r) => r.t === istMin(2026, 9, 27, 16, 50));
    expect([bill?.placeId, bill?.billedCl, bill?.tankRiseCl]).toEqual(["kishangarh-pump", 25000, 20000]);
    expect([f.status, f.driverSide.state, f.driverSide.text?.en]).toEqual(["waiting", "replied", "The nozzle stopped early; I told the attendant."]);
  });
});

describe("TC-005 · trip 0926-11 (flag 3, R3)", () => {
  const t = tripById("0926-11");
  const f = flagOf("0926-11", "R3");

  it("RJ14 GC 3309 · Anil Bairwa · Jaipur → Bhiwandi, 1,150 km, 26 t (usual 22 t), 26 Sep 4:30 AM → 27 Sep 8:10 AM", () => {
    expect([t.plate, t.routeId, routeById(t.routeId).plannedKm, t.loadT]).toEqual(["RJ14 GC 3309", "JAI-BHW", 1150, 26]);
    expect([t.start, t.end, t.end - t.start]).toEqual([istMin(2026, 9, 26, 4, 30), istMin(2026, 9, 27, 8, 10), 1660]);
    const stops = ds.scenario.trips.find((s) => s.id === "0926-11")!.stops.map((s) => [s.from - t.start, s.to - t.start]);
    expect(stops).toEqual([[240, 280], [540, 580], [1140, 1410]]);
  });

  it("used 364 L against a normal 325 L: 39 L (12%), ₹3,510, Check, spread across the trip", () => {
    const usedCl = t.tank.startCl + t.refuels.reduce((a, r) => a + r.tankRiseCl, 0) - t.tank.endCl;
    expect(usedCl).toBe(36400);
    expect(ledgerFor("0926-11").dieselCl).toBe(36400);
    expect([f.litres, f.inr, f.confidence]).toEqual([39, 3510, "check"]);
    expect(f.evidence.map((e) => e.text.en)).toContain("Spread across the trip, no single stop");
    expect([f.status, f.driverSide.state]).toEqual(["waiting", "not-asked"]);
  });

  it("this truck's normal is 325 L; 364 L is 12% more; the load is 26 t against a usual 22 t", () => {
    const anil = truckByPlate("RJ14 GC 3309");
    expect([anil.baselineCl["JAI-BHW"], anil.usualLoadT["JAI-BHW"]]).toEqual([32500, 22]);
    const text = f.evidence.map((e) => e.text.en).join(" | ");
    expect(text).toMatch(/364 L/);
    expect(text).toMatch(/325 L/);
    expect(text).toMatch(/12% more/);
    expect(text).toMatch(/usual 22 t/);
  });
});

describe("TC-006 · September diesel", () => {
  const s = september();

  it("212 trips; 412 L (₹37,080) unaccounted in 9 incidents; 23 flags (18 / 3 / 2); ₹58,240 flagged; ₹21,600 recovered", () => {
    expect([s.trips, s.dieselL, s.dieselInr, s.flags, s.confirmed, s.waiting, s.wrong, s.flaggedInr, s.recoveredInr]).toEqual([212, 412, 37080, 23, 18, 3, 2, 58240, 21600]);
    expect(s.incidents).toHaveLength(9);
  });

  it("incidents fall on days 5, 9, 12, 17, 21, 23 and 27; the cumulative series is exact", () => {
    expect([...new Set(s.incidents.map((f) => Number(f.dayKey.slice(8))))]).toEqual([5, 9, 12, 17, 21, 23, 27]);
    expect(s.cumulativeL.slice(0, 27)).toEqual([0, 0, 0, 0, 40, 40, 40, 40, 78, 78, 78, 147, 147, 147, 147, 147, 195, 195, 195, 195, 237, 237, 285, 285, 285, 285, 412]);
  });

  it("D1–D9 match the incident table", () => {
    const rows = s.incidents.map((f) => [f.tripId, f.plate, f.rule, Number(f.dayKey.slice(8)), f.litres, f.inr, f.status, f.recoveredInr]);
    expect(rows).toEqual([
      ["0905-03", "RJ14 GA 1182", "R1", 5, 40, 3600, "confirmed", 3600],
      ["0909-03", "RJ14 GC 3309", "R3", 9, 38, 3420, "confirmed", 0],
      ["0912-05", "RJ14 GB 4521", "R1", 12, 69, 6210, "confirmed", 6210],
      ["0917-06", "RJ14 GC 3309", "R3", 17, 48, 4320, "confirmed", 0],
      ["0921-09", "RJ14 GB 7716", "R1", 21, 42, 3780, "confirmed", 3780],
      ["0923-02", "RJ14 GA 5023", "R1", 23, 48, 4320, "confirmed", 1800],
      ["0926-04", "RJ14 GB 4521", "R1", 27, 38, 3420, "waiting", 0],
      ["0927-02", "RJ14 GA 1182", "R2", 27, 50, 4500, "waiting", 0],
      ["0926-11", "RJ14 GC 3309", "R3", 27, 39, 3510, "waiting", 0],
    ]);
    const routes = s.incidents.map((f) => tripById(f.tripId).routeId);
    expect(routes).toEqual(["JAI-OKH", "JAI-AHM", "JAI-OKH", "JAI-BHW", "OKH-JAI", "JAI-MAN", "JAI-OKH", "AHM-JAI", "JAI-BHW"]);
    expect(flagOf("0923-02", "R1").driverSide.text?.en).toMatch(/₹1,800 deducted so far/);
  });

  it("0917-06 starts and ends on 17 Sep (§4.9 #1)", () => {
    const t = tripById("0917-06");
    expect([t.start >= istMin(2026, 9, 17), t.end < istMin(2026, 9, 18)]).toEqual([true, true]);
  });

  it("Behror stretch: 5 of the 9 (D1, D3, D5, D6, D7), 237 L", () => {
    const b = stretch("behror");
    expect([b.dieselCount, b.litres, b.inr]).toEqual([5, 237, 21330]);
    expect(sorted(b.flags.map((f) => f.tripId))).toEqual(["0905-03", "0912-05", "0921-09", "0923-02", "0926-04"]);
    expect(s.behror).toEqual({ count: 5, of: 9 });
    expect(s.lastWeekL).toBe(217);
  });
});

describe("TC-007 · September flags", () => {
  const s = september();

  it("wrong rate 9% (2 of 23) against a 10% limit; 37% of flagged recovered", () => {
    expect([s.wrongPct, s.sharePct]).toEqual([9, 37]);
  });

  it("both wrong flags were cleared by the driver's side (N7, N14)", () => {
    expect([s.wrong, s.wrongCleared]).toEqual([2, 2]);
  });

  it("the weekly flagged / recovered table, with bricks of about ₹1,000", () => {
    expect(weeks().map((w) => [w.label, w.flaggedInr, w.recoveredInr, w.bricks.lit, w.bricks.total])).toEqual([
      ["1–7", 9480, 6300, 6, 9],
      ["8–14", 14200, 8100, 8, 14],
      ["15–21", 12030, 5400, 5, 12],
      ["22–27", 22530, 1800, 2, 23],
    ]);
  });

  it("N1–N14 match the non-diesel table", () => {
    const rows = ds.flags
      .filter((f) => f.rule === "R4" || f.rule === "R5")
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
      .map((f) => [Number(f.dayKey.slice(8)), f.rule, f.inr, f.status, f.recoveredInr]);
    expect(rows).toEqual([
      [1, "R5", 1220, "confirmed", 1220],
      [2, "R4", 1480, "confirmed", 1480],
      [4, "R5", 760, "confirmed", 0],
      [6, "R4", 1340, "confirmed", 0],
      [7, "R5", 1080, "confirmed", 0],
      [8, "R5", 630, "confirmed", 630],
      [11, "R5", 1450, "wrong", 0],
      [13, "R4", 1260, "confirmed", 1260],
      [14, "R5", 1230, "confirmed", 0],
      [15, "R5", 900, "confirmed", 900],
      [16, "R4", 1150, "confirmed", 0],
      [18, "R5", 720, "confirmed", 720],
      [20, "R4", 1160, "confirmed", 0],
      [22, "R4", 6780, "wrong", 0],
    ]);
    const plateOn = (day: number) => ds.flags.find((f) => (f.rule === "R4" || f.rule === "R5") && Number(f.dayKey.slice(8)) === day)!.plate;
    expect([plateOn(2), plateOn(15)]).toEqual(["RJ14 GA 6618", "RJ14 GB 1450"]);
  });

  it("puts no non-diesel flag on Mahesh, Suresh, Balwant, Vikram, Ramesh or Anil; Imran has only N10 and Deepak only N2", () => {
    const nonDiesel = ds.flags.filter((f) => f.rule === "R4" || f.rule === "R5");
    const plates = new Set(nonDiesel.map((f) => f.plate));
    for (const p of ["RJ14 GC 7710", "RJ14 GA 2204", "RJ14 GC 0931", "RJ14 GA 1182", "RJ14 GB 4521", "RJ14 GC 3309"]) expect(plates.has(p)).toBe(false);
    const on = (plate: string) => ds.flags.filter((f) => f.plate === plate).map((f) => [f.rule, f.dayKey, f.inr]);
    expect(on("RJ14 GB 1450")).toEqual([["R5", "2026-09-15", 900]]);
    expect(on("RJ14 GA 6618")).toEqual([["R4", "2026-09-02", 1480]]);
    const ranks6to21 = new Set(trucks().slice(5, 21).map((r) => r.plate));
    const others = nonDiesel.filter((f) => f.plate !== "RJ14 GB 1450" && f.plate !== "RJ14 GA 6618");
    expect(others).toHaveLength(12);
    expect(others.every((f) => ranks6to21.has(f.plate))).toBe(true);
  });

  it("clean days in 1–24 Sep are 3, 10, 19 and 24", () => {
    expect(cleanDays("2026-09-24")).toEqual(["2026-09-03", "2026-09-10", "2026-09-19", "2026-09-24"]);
  });
});

describe("TC-008 · trucks table and Anil's September", () => {
  const rows = trucks();

  it("ranks all 24 trucks by ₹/km, best first", () => {
    expect(rows).toHaveLength(24);
    expect(rows.map((r) => r.rank)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    for (let i = 1; i < rows.length; i++) expect(rows[i].perKm).toBeLessThanOrEqual(rows[i - 1].perKm);
  });

  it("ranks 1–5 and 22–24 match §4.3 exactly", () => {
    const pick = (r: (typeof rows)[number]) => [r.rank, r.plate, r.driver.en, r.driver.hi, r.since, r.km, r.perKm, r.unaccountedInr, r.now.state, r.now.label.en];
    expect([...rows.slice(0, 5), ...rows.slice(21)].map(pick)).toEqual([
      [1, "RJ14 GC 7710", "Mahesh Meena", "महेश मीणा", 2016, 6840, 31.8, 0, "moving", "To Ahmedabad"],
      [2, "RJ14 GA 2204", "Suresh Yadav", "सुरेश यादव", 2018, 6210, 29.6, 0, "yard", "Jaipur yard"],
      [3, "RJ14 GB 1450", "Imran Khan", "इमरान ख़ान", 2017, 7120, 28.1, 900, "moving", "To Delhi"],
      [4, "RJ14 GC 0931", "Balwant Singh", "बलवंत सिंह", 2015, 5480, 26.7, 0, "yard", "Okhla, Delhi"],
      [5, "RJ14 GA 6618", "Deepak Sharma", "दीपक शर्मा", 2020, 6950, 25.2, 1480, "moving", "To Mumbai"],
      [22, "RJ14 GA 1182", "Vikram Choudhary", "विक्रम चौधरी", 2018, 6300, 16.4, 8100, "yard", "Jaipur yard"],
      [23, "RJ14 GB 4521", "Ramesh Kumar", "रमेश कुमार", 2019, 6480, 15.1, 9630, "yard", "Okhla, Delhi"],
      [24, "RJ14 GC 3309", "Anil Bairwa", "अनिल बैरवा", 2017, 7410, 12.7, 11250, "yard", "Bhiwandi"],
    ]);
  });

  it("ranks 6–21 land on their listed ₹/km, strictly between 16.4 and 25.2, with 5,600–7,300 km", () => {
    expect(rows.slice(5, 21).map((r) => [r.plate, r.driver.en, r.perKm])).toEqual([
      ["RJ14 GB 3087", "Rajesh Saini", 25.0],
      ["RJ14 GA 7345", "Mohan Lal Meghwal", 24.3],
      ["RJ14 GC 1268", "Harish Rawat", 23.8],
      ["RJ14 GB 5590", "Kamal Kishore", 23.1],
      ["RJ14 GA 4411", "Prakash Bishnoi", 22.6],
      ["RJ14 GC 8826", "Salim Qureshi", 22.0],
      ["RJ14 GB 2903", "Gopal Prajapat", 21.4],
      ["RJ14 GA 9152", "Naresh Mahawar", 20.9],
      ["RJ14 GC 4470", "Dinesh Jangid", 20.3],
      ["RJ14 GB 6134", "Jagdish Swami", 19.8],
      ["RJ14 GA 3378", "Rakesh Verma", 19.2],
      ["RJ14 GC 5021", "Ashok Kumawat", 18.7],
      ["RJ14 GB 7716", "Sunil Joshi", 18.1],
      ["RJ14 GA 5023", "Rajendra Singh", 17.6],
      ["RJ14 GC 2689", "Farhan Ali", 17.2],
      ["RJ14 GB 8352", "Bhupendra Rathore", 16.9],
    ]);
    for (const r of rows.slice(5, 21)) {
      expect(r.perKm > 16.4 && r.perKm < 25.2).toBe(true);
      expect(r.km >= 5600 && r.km <= 7300).toBe(true);
    }
    expect(rows[17].unaccountedInr).toBeGreaterThanOrEqual(3780);
    expect(rows[18].unaccountedInr).toBeGreaterThanOrEqual(4320);
  });

  it("the gap row: 16 more trucks between ₹16.9 and ₹25.0 per km", () => {
    expect(truckGap()).toEqual({ count: 16, range: [16.9, 25.0] });
  });

  it("the profit-per-km card: ₹31.8 best (Mahesh, no flags); the bottom 3 all flagged", () => {
    expect([rows[0].perKm, rows[0].plate, rows[0].flags]).toEqual([31.8, "RJ14 GC 7710", 0]);
    expect(rows.slice(21).every((r) => r.flags > 0)).toBe(true);
  });

  it("Anil: 125 L = ₹11,250 across 0926-11, 0917-06 and 0909-03", () => {
    const a = truckDiesel("RJ14 GC 3309");
    expect([a.litres, a.inr, a.flags.map((f) => f.tripId)]).toEqual([125, 11250, ["0926-11", "0917-06", "0909-03"]]);
  });
});

describe("TC-009 · last 7 days (21–27 Sep)", () => {
  it("217 L = ₹19,530 over 5 trips", () => {
    const l = last7();
    expect([l.fromDay, l.toDay, l.litres, l.inr]).toEqual(["2026-09-21", "2026-09-27", 217, 19530]);
    expect(sorted(l.tripIds)).toEqual(sorted(["0926-04", "0927-02", "0926-11", "0923-02", "0921-09"]));
  });
});

describe("TC-010 · 14-day profit series and the clean day", () => {
  it("daily profit 14–27 Sep equals the §4.3 series", () => {
    expect(days("2026-09-14", "2026-09-27").map((d) => d.profitInr)).toEqual([
      142000, 161000, 98000, 177000, 155000, 130000, 188000, 149000, 166000, 121000, 194800, 158000, 172000, 186400,
    ]);
    expect(dayProfit("2026-09-27")).toBe(186400);
  });

  it("24 Sep: 17 trips, 0 flags, ₹1,94,800, September's 4th clean day", () => {
    const d = days("2026-09-24", "2026-09-24")[0];
    expect([d.dayKey, d.trips, d.flags, d.profitInr]).toEqual(["2026-09-24", 17, 0, 194800]);
    const clean = cleanDays("2026-09-24");
    expect([clean.length, clean.at(-1)]).toEqual([4, "2026-09-24"]);
  });
});

describe("counts and where the trucks are now", () => {
  it("the dataset starts on 29 Aug with trip 0829-01", () => {
    const first = [...ds.trips].sort((a, b) => a.start - b.start)[0];
    expect([first.id, first.start >= istMin(2026, 8, 29), first.start < istMin(2026, 8, 30)]).toEqual(["0829-01", true, true]);
  });

  it("212 trips ended 1–27 Sep; 11 are still on the road at 7:12 AM", () => {
    expect(september().trips).toBe(212);
    expect(ds.live).toHaveLength(11);
  });

  it("24 trucks now: 11 moving, 12 in a yard, 1 in the workshop (a rank 6–21 truck)", () => {
    const now = fleetNow();
    expect(now.at).toBe(istMin(2026, 9, 28, 7, 12));
    expect(now.trucks).toHaveLength(24);
    expect(now.counts).toEqual({ moving: 11, yard: 12, workshop: 1 });
    const workshop = now.trucks.find((t) => t.state === "workshop")!;
    const rank = trucks().find((r) => r.plate === workshop.plate)!.rank;
    expect(rank >= 6 && rank <= 21).toBe(true);
    const live = new Set(ds.live.map((t) => t.plate));
    expect(now.trucks.every((t) => (t.state === "moving") === live.has(t.plate))).toBe(true);
  });
});
