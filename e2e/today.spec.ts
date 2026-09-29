import AxeBuilder from "@axe-core/playwright";
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
  const results = await new AxeBuilder({ page }).analyze();
  const bad = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(bad).toEqual([]);
});
