// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import BetArtifactsPage from "@/app/(site)/bet/artifacts/page";
import BetMarketPage from "@/app/(site)/bet/market/page";
import BetPage from "@/app/(site)/bet/page";
import BetPlanPage from "@/app/(site)/bet/plan/page";
import BetProductPage from "@/app/(site)/bet/product/page";
import { ARTIFACTS, ARTIFACTS_NOTE, NEW_TAB_CUE } from "@/content/bet/artifacts";
import { BOARD_COPY, BOARD_JOBS, BOARD_ROWS, DROPPED } from "@/content/bet/board";
import { BET_OVERVIEW } from "@/content/bet/copy";
import { HYPOTHESES, HYPOTHESES_COPY, UNTESTED } from "@/content/bet/hypotheses";
import { HYPE, HYPE_COPY, STRUCTURAL } from "@/content/bet/hype";
import { GUARDRAILS, METRICS_COPY, NORTH_STAR, PRIMARY_METRICS, PRODUCT_NORTH_STAR } from "@/content/bet/metrics";
import {
  AUTONOMY,
  BOARD_INTRO,
  HEADLINES,
  LOOP,
  TEASERS,
  TENX,
  marketClaims,
  overviewSummaryClaims,
  planClaims,
  productClaims,
} from "@/content/bet/overview";
import { NOT_BUILDING, ROADMAP, ROADMAP_COPY } from "@/content/bet/roadmap";
import { citedSourceIds, isCited, type Claim } from "@/content/bet/sources";
import { BET_TABS } from "@/content/bet/tabs";
import { getTiersView } from "@/lib/bet/views/tiers";
import { getTruckView } from "@/lib/bet/views/truck";
import { Autonomy } from "./Autonomy";
import { BetLoop } from "./BetLoop";
import { Board } from "./Board";
import { Headlines } from "./Headlines";
import { Hypotheses } from "./Hypotheses";
import { Metrics } from "./Metrics";
import { Roadmap } from "./Roadmap";
import { Shifts } from "./Shifts";
import { StartHere } from "./StartHere";
import { TenX } from "./TenX";

// TASK-28, split into tabs by TASK-32 (EXE49): the bet's sections, rendered from content/bet and
// the bet views only, and the four tab pages they make up.

afterEach(cleanup);

const order = citedSourceIds([...overviewSummaryClaims(), ...marketClaims(), ...productClaims(), ...planClaims()]);
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

  it("lists the dropped candidates compactly: name, a one-line reason, then its evidence", () => {
    const { container } = renderBoard();
    const items = [...container.querySelectorAll(".ov-dropped-item")];
    expect(items.map((li) => li.querySelector("h4")?.textContent)).toEqual(DROPPED.map((d) => d.name));
    for (const [i, d] of DROPPED.entries()) {
      const reason = items[i].querySelector(".ov-drop-reason")!;
      expect(reason.textContent?.startsWith(d.claims[0].text), d.id).toBe(true);
      expect(reason.querySelector(".bet-assume-tag")?.textContent, d.id).toBe("Assumption");
      // The long basis waits in the page's assumptions list.
      if (!isCited(d.claims[0])) expect(reason.textContent, d.id).not.toContain(d.claims[0].basis);
      expect(items[i].querySelectorAll(".ov-drop-ev > li"), d.id).toHaveLength(d.claims.length - 1);
    }
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

describe("Headlines", () => {
  it("shows the three figures from content, each with its claim's citation or Assumption tag", () => {
    const { container } = render(<Headlines headlines={HEADLINES} order={order} />);
    const items = [...container.querySelectorAll(".ov-head")];
    expect(items.map((li) => li.querySelector(".ov-head-value")?.textContent)).toEqual(HEADLINES.map((h) => h.value));
    expect(items[0].querySelector("a.cite-n")?.getAttribute("href")).toBe("#src-zinka-prospectus");
    expect(items[1].querySelector(".bet-assume-tag")?.textContent).toBe("Assumption");
    expect(items[2].querySelector("a.cite-n")?.getAttribute("href")).toBe("#src-fastag-98");
  });
});

describe("StartHere", () => {
  const renderCards = () => render(<StartHere tabs={BET_TABS} tiers={tiers} truck={truckProps} />);

  it("has one card per tab but the overview, each with a one-line summary and a link to it", () => {
    renderCards();
    const section = screen.getByRole("region", { name: "Start here" });
    const cards = within(section).getAllByRole("listitem").filter((li) => li.classList.contains("ov-start-card"));
    const others = BET_TABS.filter((t) => t.id !== "overview");
    expect(cards).toHaveLength(others.length);
    for (const [i, t] of others.entries()) {
      expect(within(cards[i]).getByRole("heading", { level: 3 }).textContent).toBe(t.label);
      expect(cards[i].textContent).toContain(t.summary);
      expect(within(cards[i]).getByRole("link").getAttribute("href")).toBe(t.href);
    }
  });

  it("keeps the four prices from getTiersView() and the lender view's figures in their cards", () => {
    const { container } = renderCards();
    const tiersCard = container.querySelector(".ov-start-tiers")!;
    expect([...tiersCard.querySelectorAll(".ov-price")].map((p) => p.textContent)).toEqual(tiers.map((t) => t.price));
    const lender = container.querySelector(".ov-start-lender")!;
    expect(lender.textContent).toContain("27 of 180 verified days");
    expect(lender.textContent).toContain(truck.plate);
    expect(lender.textContent).toContain(truck.trust.scoreText);
  });
});

describe("Roadmap and Metrics", () => {
  it("shows three phases and the not-building list", () => {
    const { container } = render(<Roadmap phases={ROADMAP} notBuilding={NOT_BUILDING} copy={ROADMAP_COPY} order={order} />);
    expect([...container.querySelectorAll(".ov-phase h3")].map((h) => h.textContent)).toEqual(ROADMAP.map((p) => `${p.name} ${p.window}`));
    expect([...container.querySelectorAll(".ov-not-list li")].map((li) => li.textContent)).toEqual([...NOT_BUILDING]);
  });

  it("EXE50: leads with the North Star in two layers: Urja's, guarded, then the bet's", () => {
    const { container } = render(
      <Metrics product={PRODUCT_NORTH_STAR} northStar={NORTH_STAR} primary={PRIMARY_METRICS} guardrails={GUARDRAILS} copy={METRICS_COPY} order={order} />,
    );
    const layers = [...container.querySelectorAll(".ov-nsm-layers > .ov-nsm")];
    expect(layers).toHaveLength(2);
    expect(layers.map((l) => l.querySelector(".ov-kicker")?.textContent)).toEqual([PRODUCT_NORTH_STAR.label, NORTH_STAR.label]);
    expect(layers[0].querySelector(".ov-nsm-product-name")?.textContent).toBe("₹ recovered per truck per month");
    expect(layers[0].querySelector(".ov-nsm-guard")?.textContent).toBe(PRODUCT_NORTH_STAR.guardrail);
    expect(layers[0].querySelector(".ov-nsm-why")?.textContent).toBe(PRODUCT_NORTH_STAR.why);
    expect(layers[0].querySelector(".ov-nsm-name")).toBeNull();
    expect(layers[1].querySelector(".ov-nsm-name")?.textContent).toBe("Verified truck-months");
  });

  it("leads with the North Star, verified truck-months, and its definition", () => {
    const { container } = render(
      <Metrics product={PRODUCT_NORTH_STAR} northStar={NORTH_STAR} primary={PRIMARY_METRICS} guardrails={GUARDRAILS} copy={METRICS_COPY} order={order} />,
    );
    expect(container.querySelector(".ov-nsm-name")?.textContent).toBe("Verified truck-months");
    const def = [...container.querySelectorAll(".ov-nsm-def > li")];
    expect(def.map((li) => li.textContent?.slice(0, 40))).toEqual(NORTH_STAR.definition.map((c) => c.text.slice(0, 40)));
    expect(def[0].textContent).toContain("Assumption");
    expect(container.querySelectorAll(".ov-guardrails li")).toHaveLength(GUARDRAILS.length);
    expect(container.textContent).toContain("Under 10%");
  });

  it("EXE46: the roadmap says who funds Free until a lender signs, labelled an assumption", () => {
    const { container } = render(<Roadmap phases={ROADMAP} notBuilding={NOT_BUILDING} copy={ROADMAP_COPY} order={order} />);
    const items = [...container.querySelectorAll(".bet-claims > li")];
    expect(items.map((li) => li.textContent?.split(" Assumption")[0])).toEqual([ROADMAP_COPY.claim.text, ROADMAP_COPY.funding.text]);
    for (const li of items) expect(li.querySelector(".bet-assume-tag")?.textContent).toBe("Assumption");
  });

  it("EXE47: each target shows its line with the Assumption tag and basis; driver retention alone has no line", () => {
    const { container } = render(
      <Metrics product={PRODUCT_NORTH_STAR} northStar={NORTH_STAR} primary={PRIMARY_METRICS} guardrails={GUARDRAILS} copy={METRICS_COPY} order={order} />,
    );
    const rows = [...container.querySelectorAll(".ov-metric-list > li")];
    expect(rows).toHaveLength(PRIMARY_METRICS.length + GUARDRAILS.length);
    const withTarget = rows.filter((li) => li.querySelector(".ov-target"));
    expect(withTarget).toHaveLength(5);
    for (const li of withTarget) {
      expect(li.querySelector(".ov-target .ov-line")?.textContent).not.toBe("");
      expect(li.querySelector(".ov-target .bet-assume-tag")?.textContent).toBe("Assumption");
      expect(li.querySelector(".ov-target .bet-assume")?.textContent).toContain("Our target; to calibrate in the pilot (EXE47)");
    }
    const churn = rows.find((li) => li.textContent?.startsWith("Owner churn"))!;
    expect(churn.querySelector(".ov-line")?.textContent).toBe("Under 3% a month");
    expect([...container.querySelectorAll(".ov-line-none")].map((s) => s.closest("li")?.firstElementChild?.textContent)).toEqual([
      "Driver 90-day retention",
    ]);
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

/** The page's Sources entries cover every [n] link, first appear in reading order, and come last. */
function expectOwnSources(container: HTMLElement, claims: readonly Claim[]) {
  const pageOrder = citedSourceIds(claims);
  const sources = screen.getByRole("region", { name: "Sources" });
  const ids = within(sources).getAllByRole("listitem").map((li) => li.id);
  expect(ids).toEqual(pageOrder.map((id) => `src-${id}`));
  const links = [...container.querySelectorAll("main a.cite-n")];
  const hrefs = links.map((a) => a.getAttribute("href")!.slice(1));
  for (const h of hrefs) expect(ids).toContain(h);
  for (const id of ids) expect(hrefs).toContain(id);
  const firsts = [...new Set(links.map((a) => Number(/\[(\d+)\]/.exec(a.textContent ?? "")![1])))];
  expect(firsts).toEqual(firsts.map((_, i) => i + 1));
  const sections = container.querySelectorAll("main > section");
  expect(sections[sections.length - 1]).toBe(sources);
}

/** The page's assumptions, bases and all, in its closed "Assumptions behind this page" list. */
function expectAssumptions(container: HTMLElement, claims: readonly Claim[]) {
  const details = container.querySelector("details.bet-assumptions") as HTMLDetailsElement;
  expect(details).not.toBeNull();
  expect(details.open).toBe(false);
  expect(details.querySelector("summary")?.textContent).toContain("Assumptions behind this page");
  const text = details.textContent ?? "";
  for (const c of claims) if (!isCited(c)) expect(text, c.text).toContain(c.basis);
}

const bodyClaims = (container: HTMLElement) =>
  [...container.querySelectorAll("main .bet-claims > li")].filter((li) => !li.closest(".bet-assumptions")).map((li) => li.textContent ?? "");

describe("/bet, the overview", () => {
  it("keeps the h1 and the head, shows the tab bar with Overview current, and drops the in-page nav", () => {
    render(<BetPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Munshi → credit");
    const tabs = screen.getByRole("navigation", { name: "The bet" });
    expect(within(tabs).getAllByRole("link")).toHaveLength(7);
    expect(tabs.querySelector('[aria-current="page"]')?.textContent).toBe("Overview");
    expect(screen.queryByRole("navigation", { name: "On this page" })).toBeNull();
  });

  it("is short: the loop, three figures and the start-here cards, then its assumptions and Sources", () => {
    const { container } = render(<BetPage />);
    expect(screen.getByRole("figure", { name: LOOP.caption })).toBeTruthy();
    expect(container.querySelectorAll(".ov-head")).toHaveLength(3);
    expect(container.querySelectorAll(".ov-start-card")).toHaveLength(6);
    expect(container.querySelector(".ov-board, .ov-hyps, .ov-tenx")).toBeNull();
    expectAssumptions(container, overviewSummaryClaims());
    expectOwnSources(container, overviewSummaryClaims());
  });
});

describe("/bet/market", () => {
  it("has its h1, the board and structural vs hype, its assumptions and its own Sources", () => {
    const { container } = render(<BetMarketPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Where we play");
    expect(screen.getByRole("navigation", { name: "The bet" }).querySelector('[aria-current="page"]')?.textContent).toBe("Where we play");
    expect(screen.getByRole("table", { name: /The board: segments by jobs/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: HYPE_COPY.structuralHeading })).toBeTruthy();
    expectAssumptions(container, marketClaims());
    expectOwnSources(container, marketClaims());
  });

  it("states every BET_OVERVIEW claim exactly once outside the assumptions list", () => {
    const { container } = render(<BetMarketPage />);
    const items = bodyClaims(container);
    for (const c of BET_OVERVIEW.claims) expect(items.filter((t) => t.startsWith(c.text)), c.text).toHaveLength(1);
  });
});

describe("/bet/product", () => {
  it("has its h1, the 5–10x, streams × autonomy and the flag-lab link, its assumptions and its own Sources", () => {
    const { container } = render(<BetProductPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("The product");
    expect(screen.getByRole("navigation", { name: "The bet" }).querySelector('[aria-current="page"]')?.textContent).toBe("Product");
    expect(container.querySelectorAll(".ov-tenx-card")).toHaveLength(4);
    expect(container.querySelectorAll(".ov-rung")).toHaveLength(5);
    expect(screen.getByRole("link", { name: /See it on a real flag/ }).getAttribute("href")).toBe("/trips/0926-04#flag-lab");
    expectAssumptions(container, productClaims());
    expectOwnSources(container, productClaims());
  });
});

describe("/bet/plan", () => {
  it("has its h1, the roadmap, the metrics and H1–H7, its assumptions and its own Sources", () => {
    const { container } = render(<BetPlanPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Roadmap, metrics and what we're testing");
    expect(screen.getByRole("navigation", { name: "The bet" }).querySelector('[aria-current="page"]')?.textContent).toBe("Plan");
    expect(container.querySelector(".ov-nsm-name")?.textContent).toBe("Verified truck-months");
    expect(container.querySelector(".ov-nsm-product-name")?.textContent).toBe("₹ recovered per truck per month");
    expect(container.querySelectorAll(".ov-hyp")).toHaveLength(7);
    expectAssumptions(container, [ROADMAP_COPY.claim, ROADMAP_COPY.funding, ...NORTH_STAR.definition, METRICS_COPY.claim]);
    expectOwnSources(container, planClaims());
  });
});

describe("/bet/artifacts", () => {
  it("has one card per deliverable, each link opening in a new tab, the note, and no Sources", () => {
    const { container } = render(<BetArtifactsPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Artifacts");
    expect(screen.getByRole("navigation", { name: "The bet" }).querySelector('[aria-current="page"]')?.textContent).toBe("Artifacts");
    const cards = [...container.querySelectorAll(".bet-artifact")];
    expect(cards).toHaveLength(ARTIFACTS.length);
    for (const [i, a] of ARTIFACTS.entries()) {
      expect(within(cards[i] as HTMLElement).getByRole("heading", { level: 2 }).textContent).toBe(a.title);
      expect(cards[i].textContent).toContain(a.description);
      expect(cards[i].textContent).toContain(a.format);
      expect(cards[i].textContent).toContain(a.access === "shared" ? "Opens if shared with you" : "Public");
      const link = within(cards[i] as HTMLElement).getByRole("link");
      expect(link.getAttribute("href")).toBe(a.href);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      expect(link.textContent).toContain("(opens in a new tab)");
    }
    const note = container.querySelector(".bet-artifacts-note")!;
    expect(note.textContent?.replace(` ↗ ${NEW_TAB_CUE}`, "")).toBe(ARTIFACTS_NOTE.text);
    expect(note.querySelector("a")?.getAttribute("href")).toBe(ARTIFACTS_NOTE.href);
    expect(screen.queryByRole("region", { name: "Sources" })).toBeNull();
    for (const a of container.querySelectorAll('a[target="_blank"]')) expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("the bet's tab pages", () => {
  const pages = [BetPage, BetMarketPage, BetProductPage, BetPlanPage, BetArtifactsPage];

  it("use no accusing word", () => {
    for (const Page of pages) {
      const { container } = render(<Page />);
      expect(container.textContent).not.toMatch(/\b(theft|stolen|steal|thief)\b|चोरी|चुरा/i);
      cleanup();
    }
  });

  it("render every claim the old single page rendered, across them", () => {
    const seen = new Set<string>();
    for (const Page of pages) {
      const { container } = render(<Page />);
      for (const li of container.querySelectorAll("main .bet-claims > li")) seen.add(li.textContent ?? "");
      for (const el of container.querySelectorAll(".ov-mech, .ov-target, .ov-head")) seen.add(el.textContent ?? "");
      cleanup();
    }
    const all = [...overviewSummaryClaims(), ...marketClaims(), ...productClaims(), ...planClaims()];
    for (const c of all) expect([...seen].some((t) => t.includes(c.text)), c.text).toBe(true);
  });
});
