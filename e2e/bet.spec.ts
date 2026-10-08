import { axeBuilder } from "./axe";
import { expect, test, type Page } from "./fixtures";

// TASK-28, split into tabs by TASK-32 (EXE49): the bet's pages at 375 / 768 / 1440. The overview
// is short and maps the tabs; the market, product, plan and artifacts pages hold the rest. Every
// page carries the tab bar with the right tab current, passes axe, and reflows at 320.

async function axeViolations(page: Page): Promise<string[]> {
  const { violations } = await axeBuilder(page).analyze();
  return violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

async function noPageScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

const TABS = [
  { label: "Overview", href: "/bet" },
  { label: "Where we play", href: "/bet/market" },
  { label: "Product", href: "/bet/product" },
  { label: "Tiers", href: "/bet/tiers" },
  { label: "Lender view", href: "/trucks/rj14-gb-4521" },
  { label: "Plan", href: "/bet/plan" },
  { label: "Artifacts", href: "/bet/artifacts" },
] as const;

/** Every bet page, and the tab it sits under. */
const PAGES = [
  { path: "/bet", current: "Overview" },
  { path: "/bet/market", current: "Where we play" },
  { path: "/bet/product", current: "Product" },
  { path: "/bet/tiers", current: "Tiers" },
  { path: "/trucks/rj14-gb-4521", current: "Lender view" },
  { path: "/trucks/rj14-gc-7710", current: "Lender view" },
  { path: "/bet/plan", current: "Plan" },
  { path: "/bet/artifacts", current: "Artifacts" },
] as const;

for (const { path, current } of PAGES) {
  test(`${path}: the tab bar shows the 7 tabs, with ${current} and only it current`, async ({ page }) => {
    await page.goto(path);
    const tabs = page.getByRole("navigation", { name: "The bet", exact: true });
    await expect(tabs.getByRole("link")).toHaveText(TABS.map((t) => t.label));
    const hrefs = await tabs.getByRole("link").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs).toEqual(TABS.map((t) => t.href));
    await expect(tabs.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(tabs.locator('[aria-current="page"]')).toHaveText(current);
    // WCAG 2.5.8: each tab is a big enough target.
    for (const h of await tabs.getByRole("link").evaluateAll((as) => as.map((a) => a.getBoundingClientRect().height))) {
      expect(h).toBeGreaterThanOrEqual(24);
    }
  });

  test(`${path}: axe finds no violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await axeViolations(page)).toEqual([]);
  });

  test(`${path}: at 320 nothing overflows the page, its details opened too`, async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "phone-only");
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(path);
    for (const s of await page.locator("main details > summary").all()) await s.click();
    await noPageScroll(page);
    // The tab bar scrolls inside its own box.
    const box = await page.getByRole("navigation", { name: "The bet", exact: true }).boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  });
}

// Fix round 1: on a phone the row scrolls, so the current tab is centred into view on load, even
// when it is one of the last tabs.
for (const path of ["/bet/artifacts", "/trucks/rj14-gb-4521"]) {
  test(`${path}: on a phone the current tab is inside the tab bar's visible box`, async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "phone-only");
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const nav = page.getByRole("navigation", { name: "The bet", exact: true });
    const scroller = nav.locator(".bet-tabs-scroll");
    // The row is wider than the screen, so this is a real check.
    expect(await scroller.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await expect
      .poll(async () => {
        const navBox = (await nav.boundingBox())!;
        const tab = (await nav.locator('[aria-current="page"]').boundingBox())!;
        return tab.x >= navBox.x && tab.x + tab.width <= navBox.x + navBox.width;
      })
      .toBe(true);
  });
}

test.describe("/bet, the overview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bet");
  });

  test("keeps the h1 'Munshi → credit', and drops the in-page nav", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Munshi → credit");
    await expect(page.getByRole("navigation", { name: "On this page" })).toHaveCount(0);
  });

  test("the start-here cards link to each other tab, and their links resolve", async ({ page, request }) => {
    const cards = page.getByRole("region", { name: "Start here" }).locator(".ov-start-card");
    await expect(cards).toHaveCount(6);
    const hrefs = await cards.getByRole("link").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs).toEqual(TABS.slice(1).map((t) => t.href));
    for (const href of hrefs) expect((await request.get(href!)).status(), href!).toBe(200);
  });

  test("the tiers card shows the four prices; the lender card shows 27 of 180 verified days", async ({ page }) => {
    await expect(page.locator(".ov-start-tiers .ov-price")).toHaveText(["₹0", "₹299", "₹499", "₹799"]);
    await expect(page.locator(".ov-start-lender")).toContainText("27 of 180 verified days");
  });

  test("shows three headline figures", async ({ page }) => {
    await expect(page.getByRole("region", { name: "In three numbers" }).locator(".ov-head")).toHaveCount(3);
  });
});

test.describe("/bet/market", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bet/market");
  });

  test("has its h1", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where we play");
  });

  test("the board: small trucks × books says Chosen, in a labelled, focusable scroll region", async ({ page }) => {
    const region = page.getByRole("region", { name: "Board table, segments by jobs" });
    await expect(region).toHaveAttribute("tabindex", "0");
    const table = region.getByRole("table", { name: /The board: segments by jobs/ });
    const small = table.getByRole("row").filter({ has: page.getByRole("rowheader", { name: /Small trucks/ }) });
    await expect(small.getByRole("cell").first()).toContainText("Chosen");
    await expect(table.locator(".ov-cell-chosen")).toHaveCount(1);
    await expect(table.locator(".ov-cell-chosen .ov-state")).toHaveText("Chosen");
    const ev = table.getByRole("row").filter({ has: page.getByRole("rowheader", { name: /EV 2W\/3W/ }) });
    await expect(ev.getByRole("rowheader")).toContainText("Phase 2");
    await expect(ev.getByRole("cell").first()).toHaveText("Phase 2");
  });

  test("the board's scroll hint shows where the board scrolls, and stays screen-reader-only where it fits", async ({ page }, info) => {
    const hint = page.locator(".ov-board-hint");
    await expect(hint).toHaveCount(1);
    const region = page.getByRole("region", { name: "Board table, segments by jobs" });
    const scrolls = await region.evaluate((el) => el.scrollWidth > el.clientWidth);
    const box = await hint.boundingBox();
    const shown = !!box && box.width > 1 && box.height > 1;
    expect(shown, info.project.name).toBe(scrolls);
    if (info.project.name === "phone") expect(shown).toBe(true);
    if (info.project.name === "desktop") expect(shown).toBe(false);
  });

  test("lists the six dropped candidates compactly", async ({ page }) => {
    const items = page.locator(".ov-dropped-item");
    await expect(items).toHaveCount(6);
    await expect(items.first().locator(".ov-drop-reason .bet-assume-tag")).toHaveText("Assumption");
  });

  test("no horizontal page scroll; on a phone the board scrolls inside its region", async ({ page }, info) => {
    await noPageScroll(page);
    if (info.project.name === "phone") {
      const region = page.getByRole("region", { name: "Board table, segments by jobs" });
      const { sw, cw } = await region.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
      expect(sw).toBeGreaterThan(cw);
    }
  });
});

test.describe("/bet/product", () => {
  test("has its h1, and the flag-lab link resolves to the flag lab", async ({ page, request }) => {
    await page.goto("/bet/product");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The product");
    const link = page.getByRole("link", { name: /See it on a real flag/ });
    await expect(link).toHaveAttribute("href", "/trips/0926-04#flag-lab");
    expect((await request.get("/trips/0926-04")).status()).toBe(200);
    await link.click();
    await expect(page).toHaveURL(/\/trips\/0926-04#flag-lab$/);
    await expect(page.locator("section#flag-lab")).toHaveCount(1);
  });
});

test.describe("/bet/plan", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bet/plan");
  });

  test("has its h1", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Roadmap, metrics and what we're testing");
  });

  test("the North Star says verified truck-months, with its definition", async ({ page }) => {
    const metrics = page.getByRole("region", { name: "Metrics" });
    await expect(metrics.locator(".ov-nsm-name")).toHaveText("Verified truck-months");
    await expect(metrics.locator(".ov-nsm-def")).toContainText("at least 25 verified days");
  });

  test("every hypothesis says untested, closed and opened", async ({ page }) => {
    const details = page.locator("#ov-hypotheses details");
    await expect(details).toHaveCount(7);
    for (const d of await details.all()) await expect(d.locator("summary")).toContainText("Untested: no field calls");
    await details.first().locator("summary").click();
    await expect(details.first()).toHaveAttribute("open", "");
    await expect(details.first()).toContainText("Research against");
  });

  test("axe finds no violations with every hypothesis and the assumptions opened", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    for (const s of await page.locator("main details > summary").all()) await s.click();
    await expect(page.locator("#ov-hypotheses details[open]")).toHaveCount(7);
    await expect(page.locator("details.bet-assumptions[open]")).toHaveCount(1);
    expect(await axeViolations(page)).toEqual([]);
  });
});

test.describe("/bet/artifacts", () => {
  test("has six cards, each link https and opening safely in a new tab, and the research note", async ({ page }) => {
    await page.goto("/bet/artifacts");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Artifacts");
    const cards = page.locator(".bet-artifact");
    await expect(cards).toHaveCount(6);
    for (const card of await cards.all()) {
      const link = card.getByRole("link");
      expect(await link.getAttribute("href")).toMatch(/^https:\/\/(claude\.ai|github\.com)\//);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      await expect(link).toContainText("(opens in a new tab)");
    }
    await expect(page.locator(".bet-artifacts-note")).toContainText("Research figures are unverified; see the research report");
    await expect(page.getByRole("region", { name: "Sources" })).toHaveCount(0);
  });
});
