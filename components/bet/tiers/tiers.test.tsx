// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import BetTiersPage from "@/app/(site)/bet/tiers/page";
import { getTiersView } from "@/lib/bet/views/tiers";
import { CostTable } from "./CostTable";
import { PriceChart } from "./PriceChart";
import { TierTable } from "./TierTable";
import { WhoPays } from "./WhoPays";

// TASK-27: the /bet/tiers sections, rendered from getTiersView() and nothing else.

afterEach(cleanup);

const view = getTiersView();
const order = view.sourceIds;

describe("TierTable", () => {
  it("is a real table with a caption, the four tiers as column headers, and scoped row headers", () => {
    render(<TierTable rows={view.rows} hardware={view.hardware} table={view.table} order={order} />);
    const table = screen.getByRole("table", { name: /four tiers/i });
    const cols = within(table).getAllByRole("columnheader");
    expect(cols.filter((th) => th.getAttribute("scope") === "col").map((th) => th.textContent)).toEqual([
      "Free",
      "Munshi",
      "Pro",
      "Autopilot",
    ]);
    const rowHeads = within(table).getAllByRole("rowheader");
    expect(rowHeads.map((th) => th.querySelector(".tt-rowlabel")?.textContent)).toEqual(Object.values(view.table.rowLabels));
    for (const th of rowHeads) expect(th.getAttribute("scope")).toBe("row");
    expect(table.querySelector("caption")?.textContent).toBe(view.table.caption);
  });

  it("shows each tier's price, autonomy, margin, share of recovered ₹ and where its price sits, in words", () => {
    render(<TierTable rows={view.rows} hardware={view.hardware} table={view.table} order={order} />);
    const table = screen.getByRole("table");
    const priceRow = within(table).getByRole("rowheader", { name: "Price" }).closest("tr")!;
    expect(within(priceRow).getAllByRole("cell").map((td) => td.querySelector(".tt-price")?.textContent)).toEqual([
      "₹0",
      "₹299",
      "₹499",
      "₹799",
    ]);
    for (const r of view.rows) {
      expect(table.textContent).toContain(r.autonomy);
      expect(table.textContent).toContain(r.levels);
      expect(table.textContent).toContain(r.margin);
      expect(table.textContent).toContain(r.vsWtp);
      expect(table.textContent).toContain(r.vsFleetx);
      expect(table.textContent).toContain(r.paidByText);
      if (r.marginPct) expect(table.textContent).toContain(r.marginPct);
      if (r.shareOfRecoveredText) expect(table.textContent).toContain(r.shareOfRecoveredText);
      for (const f of r.features) expect(table.textContent).toContain(f);
    }
  });

  it("marks the share of recovered ₹ as simulated: it rests on the simulated fleet's recovered ₹", () => {
    render(<TierTable rows={view.rows} hardware={view.hardware} table={view.table} order={order} />);
    const head = screen.getByRole("rowheader", { name: /Share of recovered ₹/ });
    expect(head.querySelector(".bet-sim")?.textContent).toBe("Simulated");
  });

  it("scrolls inside its own labelled, focusable region", () => {
    render(<TierTable rows={view.rows} hardware={view.hardware} table={view.table} order={order} />);
    const region = screen.getByRole("region", { name: "Tier table" });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(within(region).getByRole("table")).toBeTruthy();
  });

  it("states the no-new-hardware design first, labelled, then the cited rails and what measuring fuel costs today", () => {
    const { container } = render(<TierTable rows={view.rows} hardware={view.hardware} table={view.table} order={order} />);
    const items = [...container.querySelectorAll(".bet-tier-hw li")];
    expect(items.map((li) => li.textContent?.slice(0, 30))).toEqual(
      [view.hardware.design, view.hardware.line, view.hardware.today].map((c) => c.text.slice(0, 30)),
    );
    expect(items[0].textContent).toContain("Assumption");
    expect(items[1].querySelectorAll("a.cite-n").length).toBe(4);
  });

  it("keeps each ₹ range on one line", () => {
    const { container } = render(<TierTable rows={view.rows} hardware={view.hardware} table={view.table} order={order} />);
    const kept = [...container.querySelectorAll("table .bet-nowrap")].map((el) => el.textContent);
    expect(kept).toContain("₹150–300");
    expect(kept).toContain("₹300–600");
  });
});

describe("PriceChart", () => {
  it("is an SVG image with an accessible name and a text summary", () => {
    render(<PriceChart chart={view.priceChart} recovered={view.recovered} />);
    const img = screen.getByRole("img", { name: view.priceChart.label });
    expect(img.tagName.toLowerCase()).toBe("svg");
    const descId = img.getAttribute("aria-describedby")!;
    expect(document.getElementById(descId)?.textContent).toBe(view.priceChart.summary);
  });

  it("draws one dot per tier, plus the cost and recovered lines and both bands", () => {
    const { container } = render(<PriceChart chart={view.priceChart} recovered={view.recovered} />);
    expect(container.querySelectorAll(".pc-dot")).toHaveLength(4);
    expect(container.querySelector(".pc-mark-cost")).toBeTruthy();
    expect(container.querySelector(".pc-mark-recovered")).toBeTruthy();
    expect(container.querySelector(".pc-band-wtp")).toBeTruthy();
    expect(container.querySelector(".pc-band-fleetx")).toBeTruthy();
    // role="img" hides the SVG's children, so it carries no <title> tooltips; the summary says it all.
    expect(container.querySelectorAll("svg title")).toHaveLength(0);
  });

  it("names every reference in a text legend, so nothing rests on colour alone", () => {
    render(<PriceChart chart={view.priceChart} recovered={view.recovered} />);
    const legend = screen.getByRole("list", { name: /legend/i });
    for (const label of [...view.priceChart.bands.map((b) => b.label), ...view.priceChart.marks.map((m) => m.label)]) {
      expect(legend.textContent).toContain(label);
    }
  });

  it("marks recovered ₹ as simulated", () => {
    const { container } = render(<PriceChart chart={view.priceChart} recovered={view.recovered} />);
    expect(container.textContent).toContain(view.recovered.label);
    expect(container.querySelector(".bet-sim")?.textContent).toBe("Simulated");
  });
});

describe("CostTable", () => {
  it("lists each cost line with its amount and its claims, and the total", () => {
    render(<CostTable costs={view.costs} order={order} />);
    const table = screen.getByRole("table", { name: /cost to serve/i });
    const body = within(table).getAllByRole("row").slice(1);
    expect(body).toHaveLength(view.costs.rows.length + 1);
    view.costs.rows.forEach((r, i) => {
      expect(within(body[i]).getByRole("rowheader").textContent).toBe(r.label);
      expect(body[i].textContent).toContain(r.amount);
      for (const c of r.claims) expect(body[i].textContent).toContain(c.text);
    });
    expect(within(body[body.length - 1]).getByRole("rowheader").textContent).toBe("Total");
    expect(body[body.length - 1].textContent).toContain(view.costs.total);
  });

  it("keeps table semantics in its explicit roles, so the stacked phone layout still reads as a table", () => {
    const { container } = render(<CostTable costs={view.costs} order={order} />);
    const table = container.querySelector("table")!;
    expect(table.getAttribute("role")).toBe("table");
    for (const tr of table.querySelectorAll("tr")) expect(tr.getAttribute("role")).toBe("row");
    for (const th of table.querySelectorAll("tbody th")) expect(th.getAttribute("role")).toBe("rowheader");
    for (const th of table.querySelectorAll("thead th")) expect(th.getAttribute("role")).toBe("columnheader");
    for (const td of table.querySelectorAll("td")) expect(td.getAttribute("role")).toBe("cell");
  });

  it("cites the WhatsApp price and labels its message volume an assumption", () => {
    render(<CostTable costs={view.costs} order={order} />);
    const row = screen.getByRole("rowheader", { name: view.costs.rows[0].label }).closest("tr")!;
    expect(within(row).getAllByRole("link").length).toBeGreaterThan(0);
    expect(row.textContent).toContain("Assumption");
  });
});

describe("WhoPays", () => {
  it("has the three payers, each with its claims", () => {
    render(<WhoPays rows={view.whoPays} steps={view.subsidySteps} subsidy={view.subsidy} subsidyClaims={view.subsidyClaims} order={order} />);
    const heads = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(heads).toEqual(["Owner", "Lending partner", "Consent basis", "What one referral fee buys"]);
    for (const r of view.whoPays) for (const c of r.claims) expect(document.body.textContent).toContain(c.text);
  });

  it("keeps the consent row's assumption visibly labelled", () => {
    render(<WhoPays rows={view.whoPays} steps={view.subsidySteps} subsidy={view.subsidy} subsidyClaims={view.subsidyClaims} order={order} />);
    const consent = screen.getByRole("heading", { level: 3, name: "Consent basis" }).closest("article")!;
    expect(within(consent).getAllByText("Assumption").length).toBeGreaterThan(0);
    expect(consent.textContent).toContain(view.whoPays[2].pays);
  });

  it("works the ₹10 lakh loan → ₹5,000–15,000 fee → 5–16 years of Free", () => {
    render(<WhoPays rows={view.whoPays} steps={view.subsidySteps} subsidy={view.subsidy} subsidyClaims={view.subsidyClaims} order={order} />);
    const steps = screen.getByRole("list", { name: /referral fee/i });
    expect(within(steps).getAllByRole("listitem").map((li) => li.querySelector(".ws-value")?.textContent)).toEqual(
      view.subsidySteps.map((s) => s.value),
    );
    expect(document.body.textContent).toContain(view.subsidy);
  });
});

describe("/bet/tiers page", () => {
  it("keeps the h1 and ends with the sources every rendered [n] points at", () => {
    const { container } = render(<BetTiersPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Four tiers, and who pays for each");
    const sources = screen.getByRole("region", { name: "Sources" });
    const ids = within(sources).getAllByRole("listitem").map((li) => li.id);
    expect(ids).toEqual(view.sourceIds.map((id) => `src-${id}`));
    const hrefs = [...container.querySelectorAll("main a.cite-n")].map((a) => a.getAttribute("href")!.slice(1));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) expect(ids).toContain(h);
    // The [n] numbers first appear in reading order: 1, 2, 3…
    const firsts = [...new Set([...container.querySelectorAll("main a.cite-n")].map((a) => Number(/\[(\d+)\]/.exec(a.textContent ?? "")![1])))];
    expect(firsts).toEqual(firsts.map((_, i) => i + 1));
    // Every source is cited somewhere on the page.
    for (const id of ids) expect(hrefs).toContain(id);
    // Every claim the view carries is on the page, each exactly once.
    const items = [...container.querySelectorAll("main .bet-claims > li")].map((li) => li.textContent ?? "");
    for (const c of view.claims) expect(items.filter((t) => t.startsWith(c.text)), c.text).toHaveLength(1);
    // Sources is the last section.
    const sections = container.querySelectorAll("main > section");
    expect(sections[sections.length - 1]).toBe(sources);
  });

  it("uses no accusing word", () => {
    const { container } = render(<BetTiersPage />);
    expect(container.textContent).not.toMatch(/\b(theft|stolen|steal|thief)\b|चोरी|चुरा/i);
  });
});
