import { axeBuilder } from "./axe";
import { expect, test, type Page } from "./fixtures";

// TSK-04.5 · TKT-04 (TC-006..TC-008 UI, TC-021, TC-022, TC-031): Needs your eyes,
// the September cards and the trucks table, at 1440 / 768 / 375 (the three projects).

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** The mockup sets typographic apostrophes and no-break spaces before units. */
const plain = (s: string | null) => (s ?? "").replace(/’/g, "'").replace(/ /g, " ");

test("TC-022: no horizontal scroll on Today, with no console errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  // Expanded, the table must still fit.
  // Retry until hydration has attached the handler (as shell.spec does).
  await expect(async () => {
    const btn = page.getByRole("button", { name: "All 24 trucks" });
    if ((await btn.getAttribute("aria-expanded")) !== "true") await btn.click();
    await expect(page.locator("#trucks tbody tr")).toHaveCount(24, { timeout: 500 });
  }).toPass();
  const expandedWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(expandedWidth).toBeLessThanOrEqual(innerWidth);
  expect(errors).toEqual([]);
});

test("Needs your eyes lists the three flags by confidence, then ₹, with Evidence links", async ({ page }) => {
  await page.goto("/");
  const panel = page.locator("article.eyes");
  await expect(panel.locator(".sec-head .count")).toHaveText("3 of 17 trips");
  await expect(panel.locator(".sec-head .delta.loss")).toHaveText("₹11,430");
  const rows = panel.locator(".eye");
  await expect(rows).toHaveCount(3);
  await expect(rows.locator(".plate")).toHaveText(["RJ14 GB 4521", "RJ14 GA 1182", "RJ14 GC 3309"]);
  await expect(rows.locator(".amt")).toHaveText(["₹3,420", "₹4,500", "₹3,510"]);
  await expect(rows.locator(".conf")).toHaveText(["High", "Likely", "Check"]);
  const what = (await rows.locator(".what").allTextContents()).map(plain);
  expect(what).toEqual([
    "38 L diesel unaccounted while parked near Behror, 2:08–2:44 AM",
    "Fuel bill says 250 L, the tank rose only 200 L · Kishangarh pump, 4:50 PM",
    "Used 39 L (12%) more diesel than this truck's normal over 1,150 km",
  ]);
  await expect(rows.locator(".chip")).toHaveText(["Ramesh not asked yet", "Vikram explained · review", "Anil not asked yet"]);
  const hrefs = await rows.locator("a.open").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs).toEqual(["/trips/0926-04", "/trips/0927-02", "/trips/0926-11"]);
  await expect(rows.locator("a.open").first()).toBeVisible();
  expect(plain(await panel.locator("p.clean").textContent())).toBe(
    "The other 14 trips add up: diesel, tolls and km all match. Urja only points at what doesn't add up. You decide.",
  );
});

test("selecting a row moves the lit bar", async ({ page }) => {
  await page.goto("/");
  const sel = page.locator("article.eyes button.eye-sel");
  await expect(sel).toHaveCount(3);
  await expect(sel.nth(0)).toHaveAttribute("aria-pressed", "true");
  await expect(async () => {
    await sel.nth(2).click();
    await expect(sel.nth(2)).toHaveAttribute("aria-pressed", "true", { timeout: 500 });
  }).toPass();
  await expect(sel.nth(0)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("article.eyes .eye").nth(2)).toHaveClass(/\bon\b/);
});

test("the September cards show the month's numbers (TC-006, TC-007, TC-008)", async ({ page }) => {
  await page.goto("/");
  const sec = page.locator("section[aria-labelledby='month-h']");
  await expect(sec.locator(".sec-head .count")).toHaveText("1–27 Sep · 212 trips");
  const cards = sec.locator("article.kpi");
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(0).locator(".v")).toHaveText("412L");
  await expect(cards.nth(0).locator(".vrow .delta")).toHaveText("+217 L this week");
  await expect(cards.nth(0).locator("footer")).toContainText("Worth ₹37,080");
  await expect(cards.nth(0).locator("footer")).toContainText("Behror stretch · 5 of 9");
  await expect(cards.nth(1).locator(".v")).toHaveText("₹21,600");
  await expect(cards.nth(1).locator("footer")).toContainText("Flagged ₹58,240");
  await expect(cards.nth(1).locator(".vrow .delta")).toHaveText("37% of flagged");
  await expect(cards.nth(2).locator(".v")).toHaveText("2of 23 flags");
  await expect(cards.nth(2).locator(".vrow .delta")).toHaveText("9% · limit 10%");
  expect(plain(await cards.nth(2).locator("footer").textContent())).toContain("Both cleared by the driver's side");
  await expect(cards.nth(2).locator("footer")).toContainText("3 waiting on you");
  await expect(cards.nth(3).locator(".v")).toHaveText("₹31.8best");
  await expect(cards.nth(3).locator(".vrow .plate")).toHaveText("RJ14 GC 7710");
  await expect(cards.nth(3).locator("footer")).toContainText("Mahesh Meena · no flags");
  await expect(cards.nth(3).locator("footer")).toContainText("Bottom 3 all flagged");
  for (const card of await cards.all()) await expect(card).toBeVisible();

  // Chart meaning is in words (TKT-04 AC3).
  await expect(sec.getByRole("img", { name: /^Running total of diesel unaccounted in September: 412 litres/ })).toHaveCount(1);
  await expect(sec.getByRole("img", { name: /^Money flagged and recovered by week\./ })).toHaveCount(1);
  await expect(sec.getByRole("img", { name: /^23 flags in September: 18 confirmed, 3 waiting for you, 2 were wrong/ })).toHaveCount(1);
  await expect(sec.getByRole("img", { name: /^Profit per km for all 24 trucks this month, from ₹31\.8 for RJ14 GC 7710/ })).toHaveCount(1);
});

test("the KPI cards go 4 across on desktop, 2 × 2 on tablet and one per row on the phone", async ({ page }, info) => {
  await page.goto("/");
  const tops = await page.locator("article.kpi").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  const rowsOf = new Set(tops).size;
  expect(rowsOf).toBe({ desktop: 1, tablet: 2, phone: 4 }[info.project.name]);
});

test("the phone and tablet stack Needs your eyes before the September cards and the table (Design.md §16)", async ({ page }) => {
  await page.goto("/");
  const top = (sel: string) => page.locator(sel).evaluate((e) => e.getBoundingClientRect().top);
  const [ledger, eyes, kpis, table] = [await top("section.ledgerbar"), await top("article.eyes"), await top(".kpis"), await top("#trucks")];
  expect(ledger).toBeLessThan(eyes);
  expect(eyes).toBeLessThan(kpis);
  expect(kpis).toBeLessThan(table);
});

test("the trucks table shows ranks 1–5, the gap row and 22–24; 'All 24 trucks' expands and collapses by keyboard (TC-008)", async ({ page }, info) => {
  await page.goto("/");
  const table = page.locator("#trucks table.tbl");
  const rows = table.locator("tbody tr");
  await expect(rows).toHaveCount(9);
  await expect(table.locator("tbody tr.gap")).toHaveText("16 more trucks between ₹16.9 and ₹25.0 per km");
  await expect(table.locator("tbody .rk")).toHaveText(["1", "2", "3", "4", "5", "22", "23", "24"]);
  await expect(table.locator("tbody tr:not(.gap) td:nth-child(5)")).toHaveText(["₹31.8", "₹29.6", "₹28.1", "₹26.7", "₹25.2", "₹16.4", "₹15.1", "₹12.7"]);
  await expect(table.locator("tbody tr:not(.gap) td:nth-child(7)")).toHaveText(["₹0", "₹0", "₹900", "₹0", "₹1,480", "₹8,100", "₹9,630", "₹11,250"]);
  if (info.project.name === "phone") await expect(table.locator("tbody td.hide-sm").first()).toBeHidden();
  else await expect(table.locator("tbody tr").first().locator("td.hide-sm").first()).toHaveText("Mahesh Meena");

  const btn = page.getByRole("button", { name: "All 24 trucks" });
  await expect(btn).toHaveAttribute("aria-expanded", "false");
  await expect(async () => {
    await btn.focus();
    if ((await btn.getAttribute("aria-expanded")) !== "true") await page.keyboard.press("Enter");
    await expect(btn).toHaveAttribute("aria-expanded", "true", { timeout: 500 });
  }).toPass();
  await expect(rows).toHaveCount(24);
  await expect(table.locator("tbody tr.gap")).toHaveCount(0);
  await expect(table.locator("tbody .rk")).toHaveText(Array.from({ length: 24 }, (_, i) => String(i + 1)));
  await expect(async () => {
    await btn.focus();
    if ((await btn.getAttribute("aria-expanded")) !== "false") await page.keyboard.press("Space");
    await expect(btn).toHaveAttribute("aria-expanded", "false", { timeout: 500 });
  }).toPass();
  await expect(rows).toHaveCount(9);
});

test("the Trucks nav target #trucks exists", async ({ page }) => {
  await page.goto("/#trucks");
  await expect(page.locator("section#trucks")).toHaveCount(1);
  await expect(page.locator("h2#trucks-h")).toHaveText("Trucks by profit per km");
});

test("TC-031: axe finds no serious or critical violations on Today, and there is one h1", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1")).toHaveCount(1);
  const results = await axeBuilder(page).analyze();
  const bad = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(bad).toEqual([]);
});

/* ---------- Stage 8 fixes (S1: DES-2, 3, 4, 5, 7, 10, 15, 33) ---------- */

type Box = { left: number; right: number; top: number; bottom: number; width: number; height: number };
const box = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((e): Box => {
    const r = e.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  });
const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

test("DES-2: the glass card and rail box keep their backdrop blur in the production CSS", async ({ page }) => {
  await page.goto("/");
  for (const sel of ["#rb", "#mapcard .glass.scene-tag", "#fc"]) {
    expect(await page.locator(sel).evaluate((e) => getComputedStyle(e).backdropFilter), sel).toBe("blur(14px) saturate(1.15)");
  }
});

test("DES-3: the trucks table fits at 320, 761–900 and desktop widths, and scrolls in a labelled region when it can't", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "sets its own viewports");
  await page.goto("/");
  const region = page.getByRole("region", { name: "Trucks by profit per km" }).and(page.locator(".tbl-scroll"));
  await expect(region).toHaveAttribute("tabindex", "0");
  await expect(region).toHaveAttribute("aria-labelledby", "trucks-h");
  await expect(region.locator("table.tbl")).toHaveCount(1);
  expect(await region.evaluate((e) => getComputedStyle(e).overflowX)).toBe("auto");
  for (const width of [320, 340, 761, 800, 860, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const fit = await region.evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth }));
    expect(fit.sw, `table fits its card at ${width}`).toBeLessThanOrEqual(fit.cw);
    // The loss figures, the column that matters most, are whole and on screen.
    const unaccounted = await region.locator("tbody tr:not(.gap) td:nth-child(7)").evaluateAll((tds) => tds.map((td) => td.getBoundingClientRect().right));
    const right = (await box(page, ".tbl-scroll")).right;
    for (const r of unaccounted) expect(r, `Unaccounted inside the card at ${width}`).toBeLessThanOrEqual(right + 0.5);
  }
  // Text-only resizing to 200% (WCAG 1.4.4) at 375: too wide to fit, so the region scrolls instead of clipping.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  const scroll = await region.evaluate((e) => {
    e.scrollLeft = 10_000;
    return { sw: e.scrollWidth, cw: e.clientWidth, left: e.scrollLeft };
  });
  expect(scroll.sw).toBeGreaterThan(scroll.cw);
  expect(scroll.left).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test("DES-4: the Evidence links are at least 24 px tall (44 px on a coarse pointer) without moving the row", async ({ page }, info) => {
  await page.goto("/");
  const min = info.project.name === "phone" ? 44 : 24;
  const heights = await page.locator(".eye a.open").evaluateAll((as) => as.map((a) => a.getBoundingClientRect().height));
  expect(heights).toHaveLength(3);
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(min);
  // The rows look as before: the same boxes as with the links at their old 19.5 px line.
  const layout = () => page.locator(".eye").evaluateAll((es) => es.map((e) => [e.getBoundingClientRect().height, e.querySelector(".open")!.getBoundingClientRect().top + e.querySelector(".open")!.getBoundingClientRect().height / 2]));
  const now = await layout();
  await page.addStyleTag({ content: ".eye .open { min-height: 0 !important; margin-block: 0 !important; }" });
  expect(now).toEqual(await layout());
});

test("DES-4: on a coarse pointer the hero switch, full screen and 'All 24 trucks' are 44 px targets; the switch looks the same", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "coarse pointer (phone project)");
  await page.goto("/");
  for (const name of ["Scene", "Map", "Fleet", "Full screen map", "All 24 trucks"]) {
    const b = await page.getByRole("button", { name, exact: true }).evaluate((e) => e.getBoundingClientRect().height);
    expect(b, name).toBeGreaterThanOrEqual(44);
  }
  // The segmented control keeps its 38 px frame and the pressed fill its 30 px.
  expect((await box(page, ".seg")).height).toBe(38);
  const fill = await page.locator('.seg button[aria-pressed="true"]').evaluate((b) => {
    const s = getComputedStyle(b, "::before");
    return { h: b.getBoundingClientRect().height - parseFloat(s.top) - parseFloat(s.bottom), bg: s.backgroundColor };
  });
  expect(fill.h).toBe(30);
  expect(fill.bg).not.toBe("rgba(0, 0, 0, 0)");
});

test("DES-5: focus moved into view never lands under the sticky top bar", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  // What Shift+Tab does: move focus to a control above the viewport.
  await page.locator(".eye a.open").first().evaluate((a: HTMLElement) => a.focus());
  const bar = await box(page, "header.topbar");
  const link = await box(page, ".eye a.open");
  expect(link.top).toBeGreaterThanOrEqual(bar.bottom);
});

test("DES-7: the eyes list comes first in the tab order; desktop keeps the hero left of it, stacked widths put it above", async ({ page }, info) => {
  await page.goto("/");
  const map = await box(page, "#mapcard");
  const eyes = await box(page, "article.eyes");
  if (info.project.name === "desktop") {
    expect(map.right).toBeLessThanOrEqual(eyes.left);
    expect(map.top).toBe(eyes.top);
  } else {
    expect(eyes.bottom).toBeLessThanOrEqual(map.top);
  }
  const order = await page.locator("section.hero-row").evaluate((row) =>
    [...row.querySelectorAll<HTMLElement>("button, a[href]")].slice(0, 2).map((el) => el.getAttribute("aria-label") ?? el.textContent),
  );
  expect(order).toEqual([expect.stringMatching(/^Show on map: RJ14 GB 4521, /), "Evidence for RJ14 GB 4521, trip 0926-04"]);
});

test("DES-10: with flag 2 selected the rail knob's caption sits clear of the rail box's head", async ({ page }) => {
  await page.goto("/");
  await expect(async () => {
    await page.locator("button.eye-sel").nth(1).click();
    await expect(page.locator("#rb .rail .knob b")).toHaveText("4:50 PM · bill ≠ tank", { timeout: 500 });
  }).toPass();
  const cap = await box(page, "#rb .rail .knob b");
  for (const sel of ["#rb .rb-head b", "#rb .rb-head span", "#rb .rail-ends span:last-child"]) {
    const visible = await page.locator(sel).evaluate((e) => getComputedStyle(e).display !== "none");
    if (visible) expect(overlaps(cap, await box(page, sel)), sel).toBe(false);
  }
  // The rail box doesn't grow into the glass card above it.
  if (await page.locator("#fc").isVisible()) expect(overlaps(await box(page, "#fc"), await box(page, "#rb"))).toBe(false);
});

test("DES-15: the four KPI footers stay on one line, rules aligned, at 1440", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "four across at 1440 only");
  await page.goto("/");
  const footers = await page.locator(".kpi footer").evaluateAll((fs) =>
    fs.map((f) => ({ top: Math.round(f.getBoundingClientRect().top), spans: [...f.children].map((s) => Math.round(s.getBoundingClientRect().top)) })),
  );
  expect(new Set(footers.map((f) => f.top)).size).toBe(1);
  for (const f of footers) expect(new Set(f.spans).size).toBe(1);
});

test("DES-33: at 320 the eyes rows show the driver and route instead of an ellipsis", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone width");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const who = await page.locator(".eye .who").evaluateAll((ws) => ws.map((w) => ({ sw: w.scrollWidth, cw: w.clientWidth, text: w.textContent })));
  for (const w of who) expect(w.sw, w.text ?? "").toBeLessThanOrEqual(w.cw);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
