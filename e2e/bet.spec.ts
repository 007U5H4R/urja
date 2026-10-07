import { axeBuilder } from "./axe";
import { expect, test, type Page } from "./fixtures";

// TASK-28: the /bet overview at 375 / 768 / 1440: the board, the links out, the North Star, the
// hypotheses, axe with the details closed and opened, and reflow.

async function axeViolations(page: Page): Promise<string[]> {
  const { violations } = await axeBuilder(page).analyze();
  return violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/bet");
});

test("the h1 stays 'Munshi → credit'", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Munshi → credit");
});

test("the board: small trucks × books says Chosen, in a labelled, focusable scroll region", async ({ page }) => {
  const region = page.getByRole("region", { name: "Board table, segments by jobs" });
  await expect(region).toHaveAttribute("tabindex", "0");
  const table = region.getByRole("table", { name: /The board: segments by jobs/ });
  const small = table.getByRole("row").filter({ has: page.getByRole("rowheader", { name: /Small trucks/ }) });
  await expect(small.getByRole("cell").first()).toContainText("Chosen");
  await expect(table.locator(".ov-cell-chosen")).toHaveCount(1);
  await expect(table.locator(".ov-cell-chosen .ov-state")).toHaveText("Chosen");
  await expect(table.getByRole("rowheader", { name: /EV 2W\/3W/ })).toContainText("Phase 2");
});

test("the links to the flag lab, the tiers and the lender view resolve, and the flag-lab anchor exists", async ({ page, request }) => {
  const hrefs = ["/trips/0926-04#flag-lab", "/bet/tiers", "/trucks/rj14-gb-4521"];
  for (const href of hrefs) {
    await expect(page.locator(`main a[href="${href}"]`).first()).toBeVisible();
    const res = await request.get(href.split("#")[0]);
    expect(res.status(), href).toBe(200);
  }
  await expect(page.getByRole("link", { name: /See it on a real flag/ })).toHaveAttribute("href", "/trips/0926-04#flag-lab");
  await page.goto("/trips/0926-04#flag-lab");
  await expect(page.locator("section#flag-lab")).toHaveCount(1);
});

test("the tiers teaser shows the four prices; the lender teaser shows 27 of 180 verified days", async ({ page }) => {
  await expect(page.getByRole("region", { name: "Four tiers" }).locator(".ov-price")).toHaveText(["₹0", "₹299", "₹499", "₹799"]);
  await expect(page.getByRole("region", { name: "The lender view" })).toContainText("27 of 180 verified days");
});

test("the North Star says verified truck-months, with its definition", async ({ page }) => {
  const metrics = page.getByRole("region", { name: "Metrics" });
  await expect(metrics.locator(".ov-nsm-name")).toHaveText("Verified truck-months");
  await expect(metrics.locator(".ov-nsm")).toContainText(/verified truck-months/i);
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

test("the in-page nav jumps to each section", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "On this page" });
  await expect(nav.getByRole("link")).toHaveCount(10);
  await nav.getByRole("link", { name: "Hypotheses" }).click();
  await expect(page).toHaveURL(/#ov-hypotheses$/);
  await expect(page.getByRole("heading", { name: "Hypotheses", level: 2 })).toBeInViewport();
});

test("axe finds no violations with the hypotheses closed", async ({ page }) => {
  await page.waitForLoadState("networkidle");
  expect(await axeViolations(page)).toEqual([]);
});

test("axe finds no violations with every hypothesis opened", async ({ page }) => {
  await page.waitForLoadState("networkidle");
  const summaries = page.locator("#ov-hypotheses details > summary");
  for (const s of await summaries.all()) await s.click();
  await expect(page.locator("#ov-hypotheses details[open]")).toHaveCount(7);
  expect(await axeViolations(page)).toEqual([]);
});

test("no horizontal page scroll; on a phone the board scrolls inside its region", async ({ page }, info) => {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  if (info.project.name === "phone") {
    const region = page.getByRole("region", { name: "Board table, segments by jobs" });
    const { sw, cw } = await region.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
    expect(sw).toBeGreaterThan(cw);
  }
});

test("at 320 nothing overflows the page, details opened too", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone-only");
  await page.setViewportSize({ width: 320, height: 720 });
  for (const s of await page.locator("#ov-hypotheses details > summary").all()) await s.click();
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
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
