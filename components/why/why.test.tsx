// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { quotes, type Quote } from "@/content/field-notes";
import { BET_CHAPTER, BYLINE, FIRST_90_DAYS, getWhyView, METRICS, METRICS_LAYER, ORIGIN, PIPELINE, WHY_TITLE } from "@/content/why";
import { getDataset } from "@/lib/data";
import { dayKey } from "@/lib/clock";
import { FLEET } from "@/lib/data/fleet";
import { FieldNotes } from "./FieldNotes";
import { Metrics } from "./Metrics";
import { Pipeline } from "./Pipeline";
import { WhyEssay } from "./WhyEssay";

// TKT-08 (TSK-08.1): final/why.html chapters 01–07, fleet numbers from lib/data.
// TASK-29 (EXE37): chapter 08, the bet, and the slim banner below the hero.
// TASK-34 (EXE50): chapter 01 is the user's own story; 05 is the North Star in two layers; 06 the user's plan.

afterEach(cleanup);

const view = getWhyView();
const ASSUMPTION = "ASSUMPTION: quotes are placeholders until the field conversations happen. None will be invented.";
const ILLUSTRATIVE =
  "Illustrative quotes, not from interviews: composites written to show what fleet owners commonly describe. Real field notes will replace them.";
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

describe("content", () => {
  it("ships only the four illustrative quotes, each flagged as illustrative (never presented as interviews)", () => {
    expect(quotes.map((q) => `${q.role}, ${q.fleetSize}, ${q.city}`)).toEqual([
      "Owner, 18 trucks, Jaipur",
      "Munshi, 30 trucks, Kishangarh",
      "Owner, 9 trucks, Ajmer",
      "Owner, 24 trucks, Bhiwandi",
    ]);
    expect(quotes[3].text).toBe("The GPS app tells me where the truck is. It doesn’t tell me whether the trip made money.");
    for (const q of quotes) expect(q.illustrative).toBe(true);
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
    expect(view.byline).toBe("A concept for Bytebeam · Tushar Pathak · Product Manager · September 2026");
    expect(BYLINE).toMatchObject({ author: "Tushar Pathak", role: "Product Manager" });
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
      { text: "First quote.", role: "Owner", fleetSize: "12 trucks", city: "Jaipur", illustrative: false },
      { text: "Second quote.", role: "Munshi", fleetSize: "40 trucks", city: "Kishangarh", illustrative: false },
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
    expect(container.textContent).not.toContain("Illustrative");
  });

  it("labels the quotes as illustrative whenever any quote is illustrative, and drops the placeholder", () => {
    const real: Quote = { text: "Heard quote.", role: "Owner", fleetSize: "12 trucks", city: "Jaipur", illustrative: false };
    const made: Quote = { text: "Composite quote.", role: "Munshi", fleetSize: "30 trucks", city: "Kishangarh", illustrative: true };
    for (const list of [[made], [real, made], [made, real]]) {
      const { container, unmount } = render(<FieldNotes quotes={list} />);
      const label = container.querySelector("p.assume")!;
      expect(norm(label.textContent)).toBe(ILLUSTRATIVE);
      expect(label.querySelector("b")!.textContent).toBe("Illustrative quotes, not from interviews:");
      // The label comes before the quotes, so no quote is read without it.
      expect(container.firstElementChild).toBe(label);
      // Each illustrative card carries its own chip; a heard quote doesn't.
      const figs = [...container.querySelectorAll("figure.quote")];
      expect(figs.map((f) => f.querySelector(".chip.wait")?.textContent ?? null)).toEqual(
        list.map((q) => (q.illustrative ? "Illustrative" : null)),
      );
      expect(container.textContent).not.toContain("Placeholder");
      expect(container.textContent).not.toContain("ASSUMPTION");
      unmount();
    }
  });
});

describe("WhyEssay (chapters 01–08)", () => {
  function renderEssay() {
    return render(<WhyEssay view={view} quotes={quotes} />);
  }

  it("is one main.essay with exactly one h1 and eight numbered chapters", () => {
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
    expect(chaps.map((c) => c.getAttribute("aria-labelledby"))).toEqual(["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"]);
    expect(chaps.map((c) => c.querySelector(".kicker b")!.textContent)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08"]);
    expect(chaps.map((c) => norm(c.querySelector(".kicker")!.textContent))).toEqual([
      "01 · How it started",
      "02 · The owner",
      "03 · Why not another dashboard",
      "04 · Built on Bytebeam",
      "05 · How we’ll know",
      "06 · First 90 days",
      "07 · About this prototype",
      "08 · The bet",
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

  it("DES-27: repeats each gap inside its 'does well' cell, for the ≤860px table that hides the last column", () => {
    renderEssay();
    const table = screen.getByRole("table");
    const rows = [...table.querySelectorAll("tbody tr")];
    const lines = rows.map((tr) => tr.querySelector("td:not(.hide-sm) .lacks"));
    // Every competitor's gap, word for word as in its own column; Urja's row has none.
    expect(lines.slice(0, 4).map((l) => norm(l?.textContent))).toEqual(
      rows.slice(0, 4).map((tr) => `What the small-fleet owner still lacks: ${norm(tr.querySelector("td.hide-sm")!.textContent)}`),
    );
    expect(lines[4]).toBeNull();
    // The column's name is read before the line, not shown.
    for (const l of lines.slice(0, 4)) expect(l!.querySelector(".sr")!.textContent).toBe("What the small-fleet owner still lacks: ");
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

  it("EXE50: shows the North Star tile (lit), ₹ recovered per truck per month, and the guardrail tile, wrong flags under 10%", () => {
    const { container } = renderEssay();
    const tiles = [...container.querySelectorAll(".tiles > article.panel.tile")];
    expect(tiles.map((t) => t.getAttribute("aria-label"))).toEqual([
      "North Star: ₹ recovered per truck per month",
      "Guardrail: wrong flags under 10 percent",
    ]);
    expect(tiles[0].classList.contains("lit")).toBe(true);
    expect(tiles[1].classList.contains("lit")).toBe(false);
    expect(tiles.map((t) => t.querySelector(".k")!.textContent)).toEqual(["North Star", "Guardrail"]);
    expect(tiles.map((t) => [...t.querySelectorAll(".big > span")].map((s) => `${s.className}:${s.textContent}`))).toEqual([
      ["n lit:₹ recovered", "u:per truck per month"],
      ["n:< 10%", "u:wrong flags"],
    ]);
    expect(tiles[0].querySelector(".d > b")!.textContent).toBe("Urja wins when owners recover money they’d otherwise lose.");
    expect(norm(tiles[0].querySelector(".d")!.textContent)).toBe(
      "Urja wins when owners recover money they’d otherwise lose. Leading signals: share of mornings the owner opens the brief; share of flags acted on within 24 hours.",
    );
    expect(norm(tiles[1].querySelector(".d")!.textContent)).toBe(
      "Wrong flags under 10%: flags the driver disputes and the owner accepts as innocent. If Urja cries wolf, trust disappears, and good drivers leave. Watch driver 90-day retention too.",
    );
    expect(tiles[1].querySelector(".d > b")!.textContent).toBe("Wrong flags under 10%:");
  });

  it("EXE50: one line under the tiles names the bet's layer above, verified truck-months", () => {
    const { container } = renderEssay();
    const c5 = container.querySelector("section[aria-labelledby='c5']")!;
    const line = c5.querySelector(".tiles + .body > p")!;
    expect(norm(line.textContent)).toBe(METRICS_LAYER);
    expect(METRICS_LAYER).toBe(
      "For the SuprFleet bet, the layer above is verified truck-months: the record a lender can finance against.",
    );
  });

  it("EXE50: lays out the user's first 90 days in three phases, in order", () => {
    const { container } = renderEssay();
    expect(norm(container.querySelector("h2#c6")!.textContent)).toBe("Can we reliably find money owners didn’t know they were losing?");
    expect([...container.querySelectorAll("ol.plan > li > p.ph")].map((p) => p.textContent)).toEqual([
      "Days 1–30",
      "Days 31–60",
      "Days 61–90",
    ]);
    const texts = [...container.querySelectorAll("ol.plan > li > p:not(.ph)")].map((p) => norm(p.textContent));
    expect(texts).toEqual(FIRST_90_DAYS.map((p) => p.text));
    expect(texts).toEqual([
      "Sit with 15 fleet owners and their munshis. Map how a trip is reconciled today, and what they do when the money doesn’t add up.",
      "Run the five rules on 3 fleets’ real CAN/telematics data. Measure the wrong-flag rate, and improve the rules before any owner sees a flag.",
      "Ship the morning brief and Ask Urja to the pilot owners. Then go or no-go, on ₹ recovered per truck and the wrong-flag guardrail.",
    ]);
    // The plan's steps, in the user's order.
    const plan = texts.join(" ");
    const order = ["15 fleet owners", "3 fleets", "wrong-flag rate", "improve the rules", "morning brief and Ask Urja", "go or no-go"];
    const at = order.map((s) => plan.indexOf(s));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("chapters 01–02: the story first, then the illustrative quotes, the research figures, and the 1–20 truck owner", () => {
    const { container } = renderEssay();
    const h2 = (n: number) => norm(container.querySelector(`h2#c${n}`)!.textContent);
    expect(h2(1)).toBe("It started with a lunch stop.");
    expect(h2(2)).toBe("1 to 20 trucks, run from a phone.");
    const c1 = container.querySelector("section[aria-labelledby='c1'] .body")!;
    expect([...c1.querySelectorAll(":scope > p:not(.assume)")].map((p) => norm(p.textContent))).toEqual([
      ...ORIGIN.body,
      "What published research says, to be tested against the field: fuel is about 45–55% of a truck’s operating cost, and diesel leakage is often cited at about 8% of fuel filled (a soft figure; vendor blogs claim more). Those numbers are directional, not proven.",
    ]);
    // The story's paragraphs come before the quotes; the research line after them.
    const kids = [...c1.children];
    const firstQuote = kids.findIndex((k) => k.matches("p.assume, figure.quote"));
    expect(kids.slice(0, firstQuote).map((k) => norm(k.textContent))).toEqual([...ORIGIN.body]);
    const essay = norm(container.querySelector("main.essay")!.textContent);
    for (const stale of ["went and asked", "10 to 100", "35–45%", "15–20%", "bill fraud"]) expect(essay).not.toContain(stale);
  });

  it("says what is simulated, with the fleet numbers from the data, and that it isn't a Bytebeam product", () => {
    const { container } = renderEssay();
    const about = container.querySelector("section[aria-labelledby='c7'] .body > p")!;
    expect(norm(about.textContent)).toBe(
      `${view.fleetName} is fictional, and its ${view.truckCount} trucks and ${view.tripDays} days of trips are simulated. That’s a little above the 1-to-20-truck owner in chapter 02; the rules check each trip the same way at any fleet size. The leakage rules really run on that data, every rupee on screen is computed, and Ask Urja is a live model answering only from it. Nothing here is a Bytebeam product.`,
    );
    const other = render(<WhyEssay view={{ ...view, truckCount: 7, tripDays: 12 }} quotes={[]} />);
    expect(other.container.querySelector("section[aria-labelledby='c7'] .body > p")!.textContent).toContain(
      "its 7 trucks and 12 days of trips",
    );
  });

  it("shows the illustrative label and the four quotes in chapter 01, and no placeholder", () => {
    const { container } = renderEssay();
    const c1 = container.querySelector("section[aria-labelledby='c1']")!;
    expect(norm(c1.querySelector("p.assume")!.textContent)).toBe(ILLUSTRATIVE);
    expect(c1.querySelectorAll("figure.quote")).toHaveLength(4);
    expect(c1.textContent).not.toContain("Placeholder");
  });

  it("shows the placeholder and ASSUMPTION line in chapter 01 while quotes is empty", () => {
    const { container } = render(<WhyEssay view={view} quotes={[]} />);
    const c1 = container.querySelector("section[aria-labelledby='c1']")!;
    expect(c1.querySelector("figure.quote .chip.wait")!.textContent).toBe("Placeholder");
    expect(norm(c1.querySelector("p.assume")!.textContent)).toBe(ASSUMPTION);
  });

  it("puts the bet banner right below the hero, before chapter 01, and leaves the hero untouched", () => {
    const { container } = renderEssay();
    const main = container.querySelector("main.essay")!;
    const hero = main.querySelector("section.w-hero")!;
    expect(main.firstElementChild).toBe(hero);
    const banner = hero.nextElementSibling!;
    expect(banner.matches("p.bet-banner")).toBe(true);
    expect(banner.nextElementSibling!.getAttribute("aria-labelledby")).toBe("c1");
    expect(banner.querySelector("a")!.getAttribute("href")).toBe("/bet");
    expect(hero.querySelector(".bet-banner")).toBeNull();
    // The h1 is still the first heading on the page.
    expect(main.querySelector("h1, h2")!.id).toBe("w-h1");
  });

  it("ends with chapter 08, the bet: a short honest body, /bet as the one primary link, then a map of the bet's tabs", () => {
    const { container } = renderEssay();
    const chaps = container.querySelectorAll("section.chap");
    const c8 = chaps[chaps.length - 1];
    expect(c8.getAttribute("aria-labelledby")).toBe("c8");
    expect(c8.querySelector("h2#c8")!.textContent).toBe(BET_CHAPTER.title);
    const paras = [...c8.querySelectorAll(".body > p")].map((p) => norm(p.textContent));
    // TASK-34 (EXE50): a lead-in sentence links the story to the bet, then the body.
    expect(paras).toEqual([BET_CHAPTER.lead, ...BET_CHAPTER.body]);
    expect(BET_CHAPTER.lead).toBe("Once the owner trusts the morning answer, the same verified record becomes credit.");
    const primary = [...c8.querySelectorAll("a.btn")];
    expect(primary.map((a) => [a.className, norm(a.textContent), a.getAttribute("href")])).toEqual([
      ["btn btn-lamp", "See the bet", "/bet"],
    ]);
    // TASK-33 (EXE49): one line and one link per tab; Product also links the Flag lab.
    const items = [...c8.querySelectorAll("ul.bet-more > li")];
    expect(items.map((li) => [...li.querySelectorAll("a")].map((a) => [norm(a.textContent), a.getAttribute("href")]))).toEqual([
      [["Where we play", "/bet/market"]],
      [["Product", "/bet/product"], ["Flag lab", "/trips/0926-04#flag-lab"]],
      [["Tiers", "/bet/tiers"]],
      [["Lender view", "/trucks/rj14-gb-4521"]],
      [["Plan", "/bet/plan"]],
      [["Artifacts", "/bet/artifacts"]],
    ]);
    items.forEach((li, i) => expect(norm(li.textContent)).toContain(norm(BET_CHAPTER.more[i].line)));
    const list = c8.querySelector("ul.bet-more")!;
    expect(c8.querySelector(`#${list.getAttribute("aria-labelledby")}`)!.textContent).toBe(BET_CHAPTER.moreLabel);
  });
});

describe("chapter 01 content (the story, EXE50)", () => {
  const text = ORIGIN.body.join(" ");

  it("is labelled and titled as the story", () => {
    expect(ORIGIN.label).toBe("How it started");
    expect(ORIGIN.title).toBe("It started with a lunch stop.");
  });

  it("is brief: three to five short paragraphs", () => {
    expect(ORIGIN.body.length).toBeGreaterThanOrEqual(3);
    expect(ORIGIN.body.length).toBeLessThanOrEqual(5);
    for (const p of ORIGIN.body) expect(p.length, p).toBeLessThanOrEqual(360);
  });

  it("tells the user's story in the first person, with its facts and no others", () => {
    expect(text).toMatch(/\bI\b/);
    for (const fact of [
      "Bengaluru to Mysore",
      "dhaba",
      "“24.”",
      "“How much money did your fleet actually make yesterday?”",
      "munshi",
      "registers",
      "phone calls",
      "month end",
      "a trust and visibility problem, not a dashboard problem",
      "every morning",
      "doesn’t add up",
      "evidence",
    ]) {
      expect(text, fact).toContain(fact);
    }
  });

  it("is honest that it was one conversation, not a study", () => {
    expect(text).toContain("one conversation");
    expect(text).not.toMatch(/interviews|survey|study showed/i);
  });

  it("is English only, with no rupee amount and none of the banned words", () => {
    const all = [ORIGIN.label, ORIGIN.title, text].join(" ");
    expect(all).not.toMatch(/[ऀ-ॿ]/);
    expect(all).not.toMatch(/₹\s*\d/);
    expect(all).not.toMatch(/theft|stolen|steal|thief/i);
  });
});

describe("chapter 08 content (the bet)", () => {
  const text = [
    BET_CHAPTER.title,
    BET_CHAPTER.lead,
    ...BET_CHAPTER.body,
    BET_CHAPTER.cta,
    BET_CHAPTER.moreLabel,
    ...BET_CHAPTER.more.flatMap((m) => [m.tab, m.line, m.lab?.lead ?? "", m.lab?.label ?? "", m.lab?.after ?? ""]),
  ].join(" ");

  it("is short: a one-or-two-sentence intro plus the honesty line (two or three sentences)", () => {
    expect(BET_CHAPTER.n).toBe("08");
    expect(BET_CHAPTER.label).toBe("The bet");
    const sentences = BET_CHAPTER.body.join(" ").split(/(?<=[.!?])\s+/);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences.length).toBeLessThanOrEqual(3);
  });

  it("tells the arc: the munshi core, closed books, verified truck-months, a consented lending partnership", () => {
    for (const phrase of ["munshi", "closed books", "verified truck-months", "consent", "lend"]) {
      expect(text.toLowerCase()).toContain(phrase);
    }
    expect(text).toContain("SuprFleet");
  });

  it("maps all six tabs after the overview, each with a single line", () => {
    expect(BET_CHAPTER.more.map((m) => m.tab)).toEqual(["Where we play", "Product", "Tiers", "Lender view", "Plan", "Artifacts"]);
    for (const m of BET_CHAPTER.more) {
      expect(m.line.split(/(?<=[.!?])\s+/).length, m.tab).toBe(1);
      expect(m.line.length, m.tab).toBeLessThanOrEqual(110);
    }
  });

  it("is honest: a prototype, simulated data, research unverified", () => {
    const body = BET_CHAPTER.body.join(" ").toLowerCase();
    for (const phrase of ["prototype", "simulated", "unverified"]) expect(body).toContain(phrase);
  });

  it("is English only, with no rupee amount and none of the banned words", () => {
    expect(text).not.toMatch(/[ऀ-ॿ]/);
    expect(text).not.toMatch(/₹\s*\d/);
    expect(text).not.toMatch(/theft|stolen|steal|thief/i);
  });
});
