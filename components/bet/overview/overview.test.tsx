// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import BetPage from "@/app/(site)/bet/page";
import { BOARD_COPY, BOARD_JOBS, BOARD_ROWS, DROPPED } from "@/content/bet/board";
import { BET_OVERVIEW } from "@/content/bet/copy";
import { HYPOTHESES, HYPOTHESES_COPY, UNTESTED } from "@/content/bet/hypotheses";
import { HYPE, HYPE_COPY, STRUCTURAL } from "@/content/bet/hype";
import { GUARDRAILS, METRICS_COPY, NORTH_STAR, PRIMARY_METRICS } from "@/content/bet/metrics";
import { AUTONOMY, BOARD_INTRO, LOOP, OVERVIEW_SECTIONS, TEASERS, TENX, overviewClaims } from "@/content/bet/overview";
import { NOT_BUILDING, ROADMAP, ROADMAP_COPY } from "@/content/bet/roadmap";
import { citedSourceIds } from "@/content/bet/sources";
import { getTiersView } from "@/lib/bet/views/tiers";
import { getTruckView } from "@/lib/bet/views/truck";
import { Autonomy } from "./Autonomy";
import { BetLoop } from "./BetLoop";
import { Board } from "./Board";
import { Hypotheses } from "./Hypotheses";
import { Metrics } from "./Metrics";
import { Roadmap } from "./Roadmap";
import { Shifts } from "./Shifts";
import { Teasers } from "./Teasers";
import { TenX } from "./TenX";

// TASK-28: the /bet overview sections, rendered from content/bet and the bet views only.

afterEach(cleanup);

const order = citedSourceIds(overviewClaims());
const tiers = getTiersView().rows;
const truck = getTruckView(TEASERS.lender.slug)!;
const truckProps = { plate: truck.plate, scoreText: truck.trust.scoreText, scoreLabel: truck.trust.label, verifiedText: truck.verified.text };

describe("BetLoop", () => {
  it("is a figure named by its caption, with the five steps as an ordered list of real text", () => {
    render(<BetLoop loop={LOOP} order={order} />);
    const fig = screen.getByRole("figure", { name: LOOP.caption });
    const steps = within(fig).getAllByRole("listitem");
    expect(steps.map((li) => li.querySelector("strong")?.textContent)).toEqual(LOOP.steps.map((s) => s.title));
    expect(fig.textContent).toContain(LOOP.back);
  });

  it("labels cheaper credit as the bet's assumption", () => {
    const { container } = render(<BetLoop loop={LOOP} order={order} />);
    expect(container.querySelector(".bet-claims")?.textContent).toMatch(/Cheaper credit is the bet.*Assumption/);
  });
});

describe("TenX", () => {
  it("shows each dimension's multiple, today and with Munshi, and cites the sensor price", () => {
    const { container } = render(<TenX tenx={TENX} order={order} />);
    const cards = [...container.querySelectorAll(".ov-tenx-card")];
    expect(cards).toHaveLength(4);
    for (const [i, r] of TENX.rows.entries()) {
      expect(within(cards[i] as HTMLElement).getByRole("heading", { level: 3 }).textContent).toBe(r.dimension);
      expect(cards[i].textContent).toContain(r.multiple);
      expect(cards[i].textContent).toContain(r.today);
      expect(cards[i].textContent).toContain(r.munshi);
    }
    expect(cards[1].querySelectorAll("a.cite-n").length).toBeGreaterThan(0);
  });
});

describe("Board", () => {
  const renderBoard = () =>
    render(<Board intro={BOARD_INTRO} copy={BOARD_COPY} jobs={BOARD_JOBS} rows={BOARD_ROWS} dropped={DROPPED} order={order} />);

  it("is a real table with a caption, the six jobs as column headers and the segments as row headers", () => {
    renderBoard();
    const table = screen.getByRole("table", { name: /The board: segments by jobs/ });
    const cols = within(table).getAllByRole("columnheader").filter((th) => th.getAttribute("scope") === "col");
    expect(cols.map((th) => th.textContent)).toEqual(BOARD_JOBS.map((j) => j.label));
    const rows = within(table).getAllByRole("rowheader");
    expect(rows.map((th) => th.querySelector(".ov-seg")?.textContent)).toEqual(BOARD_ROWS.map((r) => r.label));
    for (const th of rows) expect(th.getAttribute("scope")).toBe("row");
  });

  it("says Chosen on small trucks × books, and names the phase cells in words", () => {
    renderBoard();
    const table = screen.getByRole("table");
    const small = within(table).getByRole("rowheader", { name: /Small trucks/ }).closest("tr")!;
    const cells = within(small).getAllByRole("cell");
    expect(cells[0].textContent).toBe("ChosenPhase 1");
    expect(cells[0].className).toContain("ov-cell-chosen");
    expect(cells[4].textContent).toBe("Phase 1bVia the ledger");
    const ev = within(table).getByRole("rowheader", { name: /EV 2W\/3W/ });
    expect(ev.textContent).toContain("Phase 2 segment");
    const evCells = within(ev.closest("tr")!).getAllByRole("cell");
    expect(evCells[0].textContent).toBe("Phase 2");
    expect(evCells[4].textContent).toContain("Phase 2");
    expect(table.querySelectorAll(".ov-cell-chosen")).toHaveLength(1);
  });

  it("scrolls inside its own labelled, focusable region, described by the one scroll hint", () => {
    const { container } = renderBoard();
    const region = screen.getByRole("region", { name: BOARD_COPY.regionLabel });
    expect(region.getAttribute("tabindex")).toBe("0");
    const hints = container.querySelectorAll(".ov-board-hint");
    expect(hints).toHaveLength(1);
    expect(region.getAttribute("aria-describedby")).toBe(hints[0].id);
    expect(hints[0].textContent).toContain(BOARD_COPY.hint);
    expect(within(region).getByRole("table")).toBeTruthy();
  });

  it("lists the dropped candidates with their reasons and citations", () => {
    const { container } = renderBoard();
    const items = [...container.querySelectorAll(".ov-dropped-item")];
    expect(items.map((li) => li.querySelector("h4")?.textContent)).toEqual(DROPPED.map((d) => d.name));
    expect(items[0].textContent).toContain("Assumption");
    expect(items[0].querySelector("a.cite-n")?.getAttribute("href")).toBe("#src-vahak-network");
  });
});

describe("Shifts", () => {
  it("puts the structural shifts beside the hype, each with its mechanism and evidence", () => {
    const { container } = render(<Shifts structural={STRUCTURAL} hype={HYPE} copy={HYPE_COPY} order={order} />);
    expect(screen.getByRole("heading", { name: HYPE_COPY.structuralHeading })).toBeTruthy();
    expect(screen.getByRole("heading", { name: HYPE_COPY.hypeHeading })).toBeTruthy();
    const items = [...container.querySelectorAll(".ov-shift-item")];
    expect(items).toHaveLength(STRUCTURAL.length + HYPE.length);
    for (const it of [...STRUCTURAL, ...HYPE]) expect(container.textContent).toContain(it.mechanism.text);
    expect(container.querySelector(".ov-shift-hype")?.textContent).toContain(HYPE_COPY.failureLabel);
  });
});

describe("Autonomy", () => {
  it("shows the three showcases in words, marks the simulated streams, and lists L1–L5 with their tiers", () => {
    const { container } = render(<Autonomy autonomy={AUTONOMY} />);
    const showcases = screen.getByRole("list", { name: AUTONOMY.showcasesLabel });
    const rows = within(showcases).getAllByRole("listitem");
    expect(rows[0].textContent).toMatch(/0926-04.*Check.*then.*Likely.*then.*High/);
    expect(rows[0].querySelector(".bet-sim")?.textContent).toBe("Camera: simulated");
    expect(rows[1].querySelector(".bet-sim")?.textContent).toBe("Bill OCR: simulated");
    expect(rows[2].querySelector(".bet-sim")).toBeNull();
    const rungs = [...container.querySelectorAll(".ov-rung")];
    expect(rungs.map((r) => r.querySelector(".ov-rung-id")?.textContent)).toEqual(["L1", "L2", "L3", "L4", "L5"]);
    expect(rungs[3].textContent).toContain("Autopilot");
  });

  it("links prominently to the flag lab on a real trip", () => {
    render(<Autonomy autonomy={AUTONOMY} />);
    const link = screen.getByRole("link", { name: /See it on a real flag/ });
    expect(link.getAttribute("href")).toBe("/trips/0926-04#flag-lab");
    expect(link.className).toContain("btn-lamp");
  });
});

describe("Teasers", () => {
  it("shows the four prices from getTiersView() and links to /bet/tiers", () => {
    render(<Teasers copy={TEASERS} tiers={tiers} truck={truckProps} />);
    const section = screen.getByRole("region", { name: "Four tiers" });
    expect([...section.querySelectorAll(".ov-price")].map((p) => p.textContent)).toEqual(tiers.map((t) => t.price));
    expect(within(section).getByRole("link", { name: /How the tiers work/ }).getAttribute("href")).toBe("/bet/tiers");
  });

  it("shows the lender view's plate, score and 27 of 180 verified days, and links to the truck", () => {
    render(<Teasers copy={TEASERS} tiers={tiers} truck={truckProps} />);
    const section = screen.getByRole("region", { name: "The lender view" });
    expect(section.textContent).toContain("27 of 180 verified days");
    expect(section.textContent).toContain(truck.plate);
    expect(section.textContent).toContain(truck.trust.scoreText);
    expect(within(section).getByRole("link", { name: /Open the lender view/ }).getAttribute("href")).toBe("/trucks/rj14-gb-4521");
  });
});

describe("Roadmap and Metrics", () => {
  it("shows three phases and the not-building list", () => {
    const { container } = render(<Roadmap phases={ROADMAP} notBuilding={NOT_BUILDING} copy={ROADMAP_COPY} order={order} />);
    expect([...container.querySelectorAll(".ov-phase h3")].map((h) => h.textContent)).toEqual(ROADMAP.map((p) => `${p.name} ${p.window}`));
    expect([...container.querySelectorAll(".ov-not-list li")].map((li) => li.textContent)).toEqual([...NOT_BUILDING]);
  });

  it("leads with the North Star, verified truck-months, and its definition", () => {
    const { container } = render(
      <Metrics northStar={NORTH_STAR} primary={PRIMARY_METRICS} guardrails={GUARDRAILS} copy={METRICS_COPY} order={order} />,
    );
    expect(container.querySelector(".ov-nsm-name")?.textContent).toBe("Verified truck-months");
    const def = [...container.querySelectorAll(".ov-nsm-def > li")];
    expect(def.map((li) => li.textContent?.slice(0, 40))).toEqual(NORTH_STAR.definition.map((c) => c.text.slice(0, 40)));
    expect(def[0].textContent).toContain("Assumption");
    expect(container.querySelectorAll(".ov-guardrails li")).toHaveLength(GUARDRAILS.length);
    expect(container.textContent).toContain("Under 10%");
  });
});

describe("Hypotheses", () => {
  it("renders H1–H7 as closed details, each summary saying untested", () => {
    const { container } = render(<Hypotheses hypotheses={HYPOTHESES} copy={HYPOTHESES_COPY} order={order} />);
    const details = [...container.querySelectorAll("details")];
    expect(details).toHaveLength(7);
    for (const [i, d] of details.entries()) {
      expect(d.open).toBe(false);
      const summary = d.querySelector("summary")!;
      expect(summary.textContent).toContain(HYPOTHESES[i].id);
      expect(summary.textContent).toContain(UNTESTED);
      expect(d.textContent).toContain(HYPOTHESES[i].verdict);
    }
    expect(details[5].textContent).toContain("Assumption");
  });
});

describe("/bet page", () => {
  it("keeps the h1, lists every section in the in-page nav, and ends with Sources covering every [n]", () => {
    const { container } = render(<BetPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Munshi → credit");
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(within(nav).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(OVERVIEW_SECTIONS.map((s) => `#ov-${s.id}`));
    for (const s of OVERVIEW_SECTIONS) expect(container.querySelector(`#ov-${s.id}`), s.id).not.toBeNull();

    const sources = screen.getByRole("region", { name: "Sources" });
    const ids = within(sources).getAllByRole("listitem").map((li) => li.id);
    expect(ids).toEqual(order.map((id) => `src-${id}`));
    const links = [...container.querySelectorAll("main a.cite-n")];
    const hrefs = links.map((a) => a.getAttribute("href")!.slice(1));
    for (const h of hrefs) expect(ids).toContain(h);
    for (const id of ids) expect(hrefs).toContain(id);
    // The [n] numbers first appear in reading order: 1, 2, 3…
    const firsts = [...new Set(links.map((a) => Number(/\[(\d+)\]/.exec(a.textContent ?? "")![1])))];
    expect(firsts).toEqual(firsts.map((_, i) => i + 1));
    const sections = container.querySelectorAll("main > section");
    expect(sections[sections.length - 1]).toBe(sources);
  });

  it("states every BET_OVERVIEW claim exactly once", () => {
    const { container } = render(<BetPage />);
    const items = [...container.querySelectorAll("main .bet-claims > li")].map((li) => li.textContent ?? "");
    for (const c of BET_OVERVIEW.claims) expect(items.filter((t) => t.startsWith(c.text)), c.text).toHaveLength(1);
  });

  it("uses no accusing word", () => {
    const { container } = render(<BetPage />);
    expect(container.textContent).not.toMatch(/\b(theft|stolen|steal|thief)\b|चोरी|चुरा/i);
  });
});
