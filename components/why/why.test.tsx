// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { quotes, type Quote } from "@/content/field-notes";
import { getWhyView, METRICS, PIPELINE, WHY_TITLE } from "@/content/why";
import { getDataset } from "@/lib/data";
import { dayKey } from "@/lib/clock";
import { FLEET } from "@/lib/data/fleet";
import { FieldNotes } from "./FieldNotes";
import { Metrics } from "./Metrics";
import { Pipeline } from "./Pipeline";
import { WhyEssay } from "./WhyEssay";

// TKT-08 (TSK-08.1): final/why.html chapters 01–07, fleet numbers from lib/data.

afterEach(cleanup);

const view = getWhyView();
const ASSUMPTION = "ASSUMPTION: quotes are placeholders until the field conversations happen. None will be invented.";
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

describe("content", () => {
  it("ships no invented field quotes", () => {
    expect(quotes).toEqual([]);
  });

  it("takes the fleet numbers from the dataset", () => {
    expect(view.truckCount).toBe(FLEET.length);
    expect(view.truckCount).toBe(24);
    expect(view.tripDays).toBe(new Set(getDataset().trips.map((t) => dayKey(t.end))).size);
    expect(view.tripDays).toBe(30);
    expect(view.fleetName).toBe("Sharma Roadlines");
  });

  it("names the page as the brand line says", () => {
    expect(WHY_TITLE).toBe("Why Urja · a concept for Bytebeam");
    expect(view.byline).toBe("A concept for Bytebeam · Tushar Pathak · September 2026");
  });
});

describe("FieldNotes (chapter 01)", () => {
  it("shows the placeholder card and the ASSUMPTION line when there are no quotes", () => {
    const { container } = render(<FieldNotes quotes={[]} />);
    const fig = container.querySelector("figure.quote")!;
    expect(fig.querySelector("span.chip.wait")!.textContent).toBe("Placeholder");
    expect(fig.querySelector("blockquote > p")!.textContent).toBe("[Field quote 1 — from conversations by 1 Oct]");
    expect(fig.querySelector("figcaption")!.textContent).toBe("[Role, fleet size, city]");
    const assume = container.querySelector("p.assume")!;
    expect(assume.querySelector("b")!.textContent).toBe("ASSUMPTION:");
    expect(norm(assume.textContent)).toBe(ASSUMPTION);
  });

  it("shows real quotes, without the placeholder or the ASSUMPTION line, once they exist", () => {
    const heard: Quote[] = [
      { text: "First quote.", role: "Owner", fleetSize: "12 trucks", city: "Jaipur" },
      { text: "Second quote.", role: "Munshi", fleetSize: "40 trucks", city: "Kishangarh" },
    ];
    const { container } = render(<FieldNotes quotes={heard} />);
    const figs = [...container.querySelectorAll("figure.quote")];
    expect(figs.map((f) => f.querySelector("blockquote > p")!.textContent)).toEqual(["First quote.", "Second quote."]);
    expect(figs.map((f) => f.querySelector("figcaption")!.textContent)).toEqual([
      "Owner, 12 trucks, Jaipur",
      "Munshi, 40 trucks, Kishangarh",
    ]);
    expect(container.querySelector(".chip")).toBeNull();
    // A repeated quote still renders (keys stay unique).
    const twice = render(<FieldNotes quotes={[heard[0], heard[0]]} />);
    expect(twice.container.querySelectorAll("figure.quote")).toHaveLength(2);
    expect(container.querySelector("p.assume")).toBeNull();
  });
});

describe("WhyEssay (chapters 01–07)", () => {
  function renderEssay() {
    return render(<WhyEssay view={view} quotes={quotes} />);
  }

  it("is one main.essay with exactly one h1 and seven numbered chapters", () => {
    const { container } = renderEssay();
    const main = container.querySelector("main.essay")!;
    expect(main).not.toBeNull();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    const h1 = main.querySelector("section.w-hero[aria-labelledby='w-h1'] h1#w-h1")!;
    expect(norm(h1.textContent)).toBe(
      "Fleet owners learn where their money leaked at month end. Urja tells them the next morning.",
    );
    expect(h1.querySelector("em.lit")!.textContent).toBe("Urja tells them the next morning.");
    const chaps = [...main.querySelectorAll("section.chap")];
    expect(chaps.map((c) => c.getAttribute("aria-labelledby"))).toEqual(["c1", "c2", "c3", "c4", "c5", "c6", "c7"]);
    expect(chaps.map((c) => c.querySelector(".kicker b")!.textContent)).toEqual(["01", "02", "03", "04", "05", "06", "07"]);
    expect(chaps.map((c) => norm(c.querySelector(".kicker")!.textContent))).toEqual([
      "01 · What I heard",
      "02 · The owner",
      "03 · Why not another dashboard",
      "04 · Built on Bytebeam",
      "05 · How we’ll know",
      "06 · First 90 days",
      "07 · About this prototype",
    ]);
    for (const c of chaps) expect(c.querySelector(`h2#${c.getAttribute("aria-labelledby")}`)).not.toBeNull();
  });

  it("carries the byline and the two CTAs, primary first", () => {
    const { container } = renderEssay();
    expect(container.querySelector(".w-hero > p.kicker")!.textContent).toBe(view.byline);
    const actions = [...container.querySelectorAll(".w-hero .actions a")];
    expect(actions.map((a) => [a.className, norm(a.textContent), a.getAttribute("href")])).toEqual([
      ["btn btn-lamp", "See the 7 AM brief", "/message"],
      ["btn btn-line", "Open a flagged trip", "/trips"],
    ]);
    expect(actions[0].querySelector("svg.i use")!.getAttribute("href")).toBe("#i-right");
  });

  // M-004 perf (EXE17): on a phone the poster is inside the first viewport and is /why's LCP element,
  // so it must not lazy-load; it is fetched eagerly at high priority.
  it("puts the poster in the 16:9 slot, decorative and eager (the phone LCP element)", () => {
    const { container } = renderEssay();
    const fig = container.querySelector("figure.w-scene")!;
    expect(fig.getAttribute("aria-hidden")).toBe("true");
    expect([...fig.querySelectorAll("svg [id]")].map((e) => e.id)).toEqual(["why-road", "why-fade", "why-hatchG"]);
    const img = fig.querySelector("img")!;
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("loading")).not.toBe("lazy");
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(img.getAttribute("sizes")).toBeTruthy();
    expect(img.getAttribute("src")).toContain("truck-scene.png");
  });

  it("renders the market as a real table with column and row headers", () => {
    renderEssay();
    const table = screen.getByRole("table");
    expect(table.className).toBe("cmp");
    expect(table.getAttribute("aria-labelledby")).toBe("c3");
    expect(screen.getByRole("table", { name: "The market has tools. The owner still finds out too late." })).toBe(table);
    const dash = table.querySelector("tr.us td.hide-sm")!;
    expect(dash.querySelector("span[aria-hidden='true']")!.textContent).toBe("—");
    expect(dash.querySelector("span.sr")!.textContent).toBe("nothing missing");
    const cols = within(table).getAllByRole("columnheader");
    expect(cols.map((c) => norm(c.textContent))).toEqual([
      "Product",
      "What it does well",
      "What the small-fleet owner still lacks",
    ]);
    expect(cols[0].querySelector("span.sr")).not.toBeNull();
    const rows = within(table).getAllByRole("rowheader");
    expect(rows.map((r) => r.textContent)).toEqual(["Fleetx", "Intangles", "LocoNav", "Samsara", "Urja"]);
    expect(table.querySelector("tr.us > th")!.textContent).toBe("Urja");
    expect(table.querySelectorAll("tbody td.hide-sm")).toHaveLength(5);
  });

  it("lights only the two new pipeline nodes", () => {
    const { container } = renderEssay();
    const pipe = container.querySelector("ol.pipe")!;
    expect(pipe.getAttribute("aria-label")).toBe("From the truck to the owner’s WhatsApp: four parts exist, two are new");
    const nodes = [...pipe.querySelectorAll("li.node")];
    expect(nodes.map((n) => [n.classList.contains("new"), n.querySelector(".st")!.textContent, n.querySelector("b")!.textContent])).toEqual([
      [false, "exists", "CAN / DBC parsers"],
      [false, "exists", "Streams"],
      [false, "exists", "Geofences"],
      [true, "new", "Leakage rules"],
      [true, "new", "Brief + Ask Urja"],
      [false, "exists", "WhatsApp alerts"],
    ]);
  });

  it("counts the pipeline's parts for its label", () => {
    const { container } = render(<Pipeline nodes={[PIPELINE[0], PIPELINE[3]]} />);
    expect(container.querySelector("ol.pipe")!.getAttribute("aria-label")).toBe(
      "From the truck to the owner’s WhatsApp: one part exists, one is new",
    );
  });

  it("renders the metric tiles from content", () => {
    const { container } = render(<Metrics tiles={[{ ...METRICS[1], lead: undefined, detail: "Just this." }]} />);
    expect(container.querySelector(".tile .d")!.textContent).toBe("Just this.");
    expect(container.querySelector(".tile .d b")).toBeNull();
  });

  it("shows the metric tile (lit) and the guardrail tile", () => {
    const { container } = renderEssay();
    const tiles = [...container.querySelectorAll(".tiles > article.panel.tile")];
    expect(tiles.map((t) => t.getAttribute("aria-label"))).toEqual([
      "Success metric: rupees recovered per truck per month",
      "Guardrail: under 10 percent wrong flags",
    ]);
    expect(tiles[0].classList.contains("lit")).toBe(true);
    expect(tiles[1].classList.contains("lit")).toBe(false);
    expect(tiles.map((t) => [...t.querySelectorAll(".big > span")].map((s) => `${s.className}:${s.textContent}`))).toEqual([
      ["n lit:₹ recovered", "u:/ truck / month"],
      ["n:< 10%", "u:wrong flags"],
    ]);
    expect(norm(tiles[1].querySelector(".d")!.textContent)).toBe(
      "False-accusation rate under 10%: flags the driver disputes and the owner accepts as innocent. If Urja works too well, owners blame drivers for sensor glitches and good drivers leave. Watch driver 90-day retention too.",
    );
    expect(tiles[1].querySelector(".d > b")!.textContent).toBe("False-accusation rate under 10%:");
  });

  it("lays out the first 90 days in three phases", () => {
    const { container } = renderEssay();
    expect([...container.querySelectorAll("ol.plan > li > p.ph")].map((p) => p.textContent)).toEqual([
      "Days 1–30",
      "Days 31–60",
      "Days 61–90",
    ]);
  });

  it("says what is simulated, with the fleet numbers from the data, and that it isn't a Bytebeam product", () => {
    const { container } = renderEssay();
    const about = container.querySelector("section[aria-labelledby='c7'] .body > p")!;
    expect(norm(about.textContent)).toBe(
      `${view.fleetName} is fictional, and its ${view.truckCount} trucks and ${view.tripDays} days of trips are simulated. The leakage rules really run on that data, every rupee on screen is computed, and Ask Urja is a live model answering only from it. Nothing here is a Bytebeam product.`,
    );
    const other = render(<WhyEssay view={{ ...view, truckCount: 7, tripDays: 12 }} quotes={[]} />);
    expect(other.container.querySelector("section[aria-labelledby='c7'] .body > p")!.textContent).toContain(
      "its 7 trucks and 12 days of trips",
    );
  });

  it("shows the placeholder and ASSUMPTION line in chapter 01 while quotes is empty", () => {
    const { container } = renderEssay();
    const c1 = container.querySelector("section[aria-labelledby='c1']")!;
    expect(c1.querySelector("figure.quote .chip.wait")!.textContent).toBe("Placeholder");
    expect(norm(c1.querySelector("p.assume")!.textContent)).toBe(ASSUMPTION);
  });
});
