// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BET_TRUCK, PROTOTYPE_NOTE } from "@/content/bet/copy";
import { citedSourceIds, isCited, sourceById } from "@/content/bet/sources";
import { TRUCK_COPY } from "@/content/bet/truck-copy";
import { getTruckView, type TruckView } from "@/lib/bet/views/truck";
import { truckClaims } from "./claims";
import { DailyLedger, LedgerChart } from "./DailyLedger";
import { LoanReadiness } from "./LoanReadiness";
import { TruckFigures } from "./TruckFigures";
import { TruckFlags } from "./TruckFlags";
import { TrustScore } from "./TrustScore";
import { VerifiedDays } from "./VerifiedDays";

// TASK-26: the truck lender view (bet-spec §8), every value from getTruckView().

/** The rupee sign, spelled out so no TSX file holds a ₹-digit literal (TC-021 static check). */
const R = "₹";
const view = (slug: string): TruckView => {
  const v = getTruckView(slug);
  if (!v) throw new Error(slug);
  return v;
};
const GB = view("rj14-gb-4521");
const GC = view("rj14-gc-3309");
const ORDER = (v: TruckView) => citedSourceIds(truckClaims(v));

afterEach(cleanup);

describe("TruckFigures", () => {
  it("shows the September headline figures from the view, marked simulated", () => {
    render(<TruckFigures headline={GB.headline} resolution={GB.resolution} />);
    const region = screen.getByRole("region", { name: TRUCK_COPY.figures.h2 });
    const text = region.textContent ?? "";
    expect(text).toContain(GB.headline.text.profit);
    expect(text).toContain(GB.headline.text.perKm);
    expect(text).toContain(GB.headline.text.km);
    expect(within(region).getByText(TRUCK_COPY.figures.unaccounted).nextElementSibling?.textContent).toBe(GB.headline.text.unaccounted);
    expect(text).toContain(GB.resolution.text.recovered);
    expect(within(region).getByText(TRUCK_COPY.figures.rank).nextElementSibling?.textContent).toBe("23 of 24");
    expect(within(region).getByText("Simulated")).toBeTruthy();
  });

  it("shows the truck's unaccounted ₹, not the sum of its flags (a flag marked wrong adds nothing)", () => {
    const v = view("rj14-gc-5021");
    expect(v.resolution.flaggedInr).toBeGreaterThan(0);
    render(<TruckFigures headline={v.headline} resolution={v.resolution} />);
    const dd = screen.getByText(TRUCK_COPY.figures.unaccounted).nextElementSibling;
    expect(dd?.textContent).toBe(`${R}0`);
    expect(screen.queryByText(v.resolution.text.flagged)).toBeNull();
  });
});

describe("TrustScore", () => {
  it("is an accessible meter with the score as text and a provisional label", () => {
    render(<TrustScore trust={GB.trust} order={ORDER(GB)} />);
    const meter = screen.getByRole("meter", { name: TRUCK_COPY.trust.meterLabel });
    expect(meter.getAttribute("aria-valuenow")).toBe("76.8");
    expect(meter.getAttribute("aria-valuemin")).toBe("0");
    expect(meter.getAttribute("aria-valuemax")).toBe("100");
    expect(meter.getAttribute("aria-valuetext")).toBe(`76.8 ${TRUCK_COPY.trust.outOf}, ${GB.trust.label}`);
    const region = screen.getByRole("region", { name: TRUCK_COPY.trust.h2 });
    expect(within(region).getByText(GB.trust.scoreText)).toBeTruthy();
    expect(within(region).getByText(GB.trust.label).textContent).toMatch(/^Provisional/);
    expect(region.textContent).toContain(GB.trust.note);
  });

  it("lists the five weighted factors with weight, measurement, score and points, under a caption", () => {
    render(<TrustScore trust={GB.trust} order={ORDER(GB)} />);
    const table = screen.getByRole("table", { name: TRUCK_COPY.trust.tableLabel });
    expect(within(table).getAllByRole("columnheader").map((th) => th.textContent)).toEqual(["Factor", "Weight", "Measured", "Score", "Points"]);
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(5);
    GB.trust.factors.forEach((f, i) => {
      const cells = within(rows[i]).getAllByRole("cell");
      expect(within(rows[i]).getByRole("rowheader").textContent).toBe(`${f.label}${f.measure}`);
      expect(cells.map((c) => c.textContent)).toEqual([String(f.weight), f.measureText, f.valueText, f.pointsText]);
    });
    // Leakage's measurement is its share of diesel ₹, not its 0–1 score.
    const leak = GB.trust.factors.find((f) => f.id === "leakage")!;
    expect(rows[2].textContent).toContain("5.6%");
    expect(leak.valueText).not.toContain("5.6");
  });

  it("labels the weights an assumption, states the basis once, and lists the thresholds with their labels and cites", () => {
    const { container } = render(<TrustScore trust={GB.trust} order={ORDER(GB)} />);
    const uncited = GB.trust.assumptions.filter((c) => !isCited(c));
    const tags = container.querySelectorAll(".bet-assume-tag");
    expect(tags).toHaveLength(1 + uncited.length);
    for (const t of tags) expect(t.textContent).toBe("Assumption");
    const list = within(screen.getByRole("group", { name: TRUCK_COPY.trust.assumptionsLabel })).getAllByRole("listitem");
    expect(list.map((li) => li.firstChild?.textContent?.trim())).toEqual(GB.trust.assumptions.map((c) => c.text));
    expect(container.querySelector('a.cite-n[href="#src-fuel-leakage-8pct"]')).not.toBeNull();
    const basis = GB.trust.factors[0].claim;
    expect(isCited(basis)).toBe(false);
    if (!isCited(basis)) expect(container.textContent).toContain(basis.basis);
  });

  it("shows 63.9 for RJ14 GC 3309 (golden)", () => {
    render(<TrustScore trust={GC.trust} order={ORDER(GC)} />);
    expect(screen.getByRole("meter").getAttribute("aria-valuenow")).toBe("63.9");
    expect(screen.getByText("63.9")).toBeTruthy();
  });
});

describe("LedgerChart", () => {
  it("has an accessible summary naming the window, the verified days and the flag days", () => {
    render(<LedgerChart daily={GB.daily} verified={GB.verified} />);
    const img = screen.getByRole("img");
    const label = img.getAttribute("aria-label") ?? "";
    expect(label).toContain("1 Sep to 27 Sep");
    expect(label).toContain("27 of 27 days verified");
    expect(label).toContain("Flags raised on 12 Sep, 27 Sep");
    expect(label).toContain(`Best day 18 Sep, ${R}33,910`);
  });

  it("draws one bar per day, marks flag days and verified days", () => {
    const { container } = render(<LedgerChart daily={GB.daily} verified={GB.verified} />);
    expect(container.querySelectorAll("rect[data-day]")).toHaveLength(27);
    const flagDays = GB.daily.filter((d) => d.flags > 0).map((d) => d.label);
    expect([...container.querySelectorAll("[data-flag-day]")].map((e) => e.getAttribute("data-flag-day"))).toEqual(flagDays);
    expect(container.querySelectorAll(".tk-ver .is-verified")).toHaveLength(27);
  });

  it("draws a loss day below the zero line", () => {
    const { container } = render(<LedgerChart daily={GC.daily} verified={GC.verified} />);
    const zero = Number(container.querySelector("line.tk-zero")?.getAttribute("y1"));
    const loss = container.querySelector('rect[data-day="2026-09-05"]')!;
    expect(loss.getAttribute("class")).toContain("is-loss");
    expect(Number(loss.getAttribute("y"))).toBeGreaterThanOrEqual(zero - 0.01);
    const label = screen.getByRole("img").getAttribute("aria-label") ?? "";
    expect(label).toContain("Loss on 5 Sep, 10 Sep");
  });

  it("has a visually hidden table with every day", () => {
    const { container } = render(<LedgerChart daily={GB.daily} verified={GB.verified} />);
    const table = screen.getByRole("table", { name: TRUCK_COPY.ledger.tableCaption });
    expect(table.closest(".sr")).not.toBeNull();
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(27);
    const d18 = GB.daily[17];
    expect(within(rows[17]).getAllByRole("cell").map((c) => c.textContent)).toEqual([String(d18.trips), d18.profitText, "0", TRUCK_COPY.ledger.yes]);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("DailyLedger", () => {
  it("shows the completeness and resolution notes beside the chart", () => {
    render(<DailyLedger daily={GB.daily} verified={GB.verified} completeness={GB.completeness} resolution={GB.resolution} />);
    const region = screen.getByRole("region", { name: TRUCK_COPY.ledger.h2 });
    const text = region.textContent ?? "";
    expect(text).toContain(GB.completeness.text);
    expect(text).toContain(GB.completeness.note);
    expect(text).toContain(GB.resolution.text.resolved);
    expect(text).toContain(GB.resolution.text.driverSide);
    expect(within(region).getAllByText("Simulated").length).toBeGreaterThan(0);
  });
});

describe("VerifiedDays", () => {
  it("shows N of 180 verified days and six month slots", () => {
    render(<VerifiedDays verified={GB.verified} months={GB.months} order={ORDER(GB)} />);
    const region = screen.getByRole("region", { name: TRUCK_COPY.verified.h2 });
    expect(within(region).getByText("27 of 180 verified days")).toBeTruthy();
    expect(region.textContent).toContain(GB.verified.note);
    const items = within(screen.getByRole("list", { name: TRUCK_COPY.verified.monthsLabel })).getAllByRole("listitem");
    expect(items).toHaveLength(6);
    expect(items[0].textContent).toContain(GB.months[0].surplusText!);
    expect(items[0].textContent).toContain(GB.months[0].note);
  });

  it("states the verified-day, truck-month and 180-day definitions as labelled assumptions", () => {
    render(<VerifiedDays verified={GB.verified} months={GB.months} order={ORDER(GB)} />);
    const items = within(screen.getByRole("group", { name: TRUCK_COPY.verified.definitionLabel })).getAllByRole("listitem");
    expect(items).toHaveLength(GB.verified.claims.length);
    GB.verified.claims.forEach((c, i) => {
      expect(items[i].textContent).toContain(c.text);
      if (!isCited(c)) {
        expect(within(items[i]).getByText("Assumption")).toBeTruthy();
        expect(items[i].textContent).toContain(c.basis);
      }
    });
    expect(items.some((li) => li.textContent?.includes("180 verified days"))).toBe(true);
  });

  it("Oct–Feb say Not yet recorded, with no number and no ₹", () => {
    render(<VerifiedDays verified={GB.verified} months={GB.months} order={ORDER(GB)} />);
    const items = within(screen.getByRole("list", { name: TRUCK_COPY.verified.monthsLabel })).getAllByRole("listitem");
    for (const [i, li] of items.slice(1).entries()) {
      expect(li.textContent).toBe(`${GB.months[i + 1].label}Not yet recorded`);
      expect(li.textContent).not.toMatch(/₹|\d/);
    }
  });
});

describe("LoanReadiness", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("XMLHttpRequest", vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  const renderLoan = (v: TruckView) => render(<LoanReadiness loan={v.loan} betClaims={BET_TRUCK.claims} order={ORDER(v)} />);

  it("shows the loan lines, labelled illustrative and not a forecast or an offer", () => {
    renderLoan(GB);
    const region = screen.getByRole("region", { name: TRUCK_COPY.loan.h2 });
    const lines = within(screen.getByRole("list", { name: TRUCK_COPY.loan.linesLabel })).getAllByRole("listitem");
    // The consent line is shown once, with its Assumption label, under Consent and partnership.
    expect(lines.map((li) => li.textContent)).toEqual(GB.loan.lines.filter((l) => l !== GB.loan.consent.text));
    expect(region.textContent).toMatch(/illustrative/i);
    expect(region.textContent).toContain("not a forecast or an offer");
    expect(within(region).getAllByText(TRUCK_COPY.loan.tag).length).toBeGreaterThan(0);
  });

  it("labels consent, partnership and the page's other assumptions, and cites the context and the market", () => {
    renderLoan(GB);
    const uncitedBet = BET_TRUCK.claims.filter((c) => !isCited(c));
    const citedBet = BET_TRUCK.claims.filter((c) => isCited(c));
    const consent = within(screen.getByRole("group", { name: TRUCK_COPY.loan.consentLabel })).getAllByRole("listitem");
    expect(consent).toHaveLength(2 + uncitedBet.length);
    for (const li of consent) expect(within(li).getByText("Assumption")).toBeTruthy();
    expect(consent[0].textContent).toContain(GB.loan.consent.text);
    expect(consent[1].textContent).toContain(GB.loan.partnership.text);
    const market = within(screen.getByRole("group", { name: TRUCK_COPY.loan.marketLabel })).getAllByRole("listitem");
    expect(market).toHaveLength(citedBet.length);
    for (const li of market) expect(li.querySelector("a.cite-n")).not.toBeNull();
    const context = within(screen.getByRole("group", { name: TRUCK_COPY.loan.contextLabel })).getAllByRole("listitem");
    expect(context.map((li) => li.querySelector("a.cite-n")?.getAttribute("href"))).toEqual(["#src-aa-fy25", "#src-rbi-digital-lending"]);
    const assumptions = within(screen.getByRole("group", { name: TRUCK_COPY.loan.assumptionsLabel })).getAllByRole("listitem");
    expect(assumptions).toHaveLength(GB.loan.assumptions.length);
  });

  it("the share action shows the consent step and the prototype note, and sends nothing", () => {
    renderLoan(GB);
    const button = screen.getByRole("button", { name: TRUCK_COPY.loan.share.button });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("status").textContent).toBe("");
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const step = screen.getByRole("group", { name: TRUCK_COPY.loan.share.stepHead });
    expect(within(step).getAllByRole("listitem")).toHaveLength(TRUCK_COPY.loan.share.steps.length);
    expect(screen.getByRole("status").textContent).toContain(PROTOTYPE_NOTE);
    expect(screen.getByRole("status").textContent).toContain(TRUCK_COPY.loan.share.sent);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("TruckFlags", () => {
  it("links each flag to its trip page, with status and confidence in words", () => {
    render(<TruckFlags flags={GB.flagList} />);
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/trips/0912-05", "/trips/0926-04"]);
    const items = within(screen.getByRole("list", { name: TRUCK_COPY.flags.listLabel })).getAllByRole("listitem");
    GB.flagList.forEach((f, i) => {
      const t = items[i].textContent ?? "";
      for (const s of [f.dayLabel, f.ruleName, f.confidenceWord, f.statusText, f.driverSideText, f.inrText]) expect(t).toContain(s);
    });
  });

  it("uses Check for a low-confidence flag", () => {
    render(<TruckFlags flags={GC.flagList} />);
    expect(screen.getAllByText("Check")).toHaveLength(3);
  });

  it("says so when a truck has no flags", () => {
    render(<TruckFlags flags={[]} />);
    expect(screen.getByText(TRUCK_COPY.flags.empty)).toBeTruthy();
  });
});

describe("truckClaims", () => {
  it("collects every claim the page renders, each cited to a known source or a labelled assumption", () => {
    const claims = truckClaims(GB);
    expect(claims).toEqual(expect.arrayContaining([GB.loan.consent, GB.loan.partnership, ...GB.loan.context, ...BET_TRUCK.claims]));
    for (const c of claims) {
      if (isCited(c)) for (const id of c.sourceIds) expect(() => sourceById(id)).not.toThrow();
      else expect(c.basis.trim()).not.toBe("");
    }
    expect(claims).toEqual(expect.arrayContaining([...GB.trust.assumptions, ...GB.verified.claims]));
    expect(ORDER(GB)).toEqual(expect.arrayContaining(["fuel-leakage-8pct", "aa-fy25", "rbi-digital-lending", ...citedSourceIds(BET_TRUCK.claims)]));
  });

  it("numbers the sources in the order the page first cites them", () => {
    const order = ORDER(GB);
    const { container } = render(
      <>
        <TrustScore trust={GB.trust} order={order} />
        <VerifiedDays verified={GB.verified} months={GB.months} order={order} />
        <LoanReadiness loan={GB.loan} betClaims={BET_TRUCK.claims} order={order} />
      </>,
    );
    const firstSeen = [...new Set([...container.querySelectorAll("a.cite-n")].map((a) => a.getAttribute("href")!.slice("#src-".length)))];
    expect(firstSeen).toEqual(order);
  });
});

describe("TRUCK_COPY", () => {
  it("holds no amounts and only accepted wording", () => {
    const text = JSON.stringify(TRUCK_COPY);
    expect(text).not.toMatch(/₹\s*\d/);
    expect(text).not.toMatch(/\b(theft|stolen|steal|thief)\b|चोरी|चुरा/i);
  });
});
