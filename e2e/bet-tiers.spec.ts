import { axeBuilder } from "./axe";
import { expect, test } from "./fixtures";

// TASK-27: /bet/tiers at 375 / 768 / 1440: the tier table, the price chart, who pays, axe, reflow.

test.beforeEach(async ({ page }) => {
  await page.goto("/bet/tiers");
});

test("the tier table shows the four tiers at ₹0, ₹299, ₹499 and ₹799", async ({ page }) => {
  const table = page.getByRole("table", { name: /four tiers/i });
  await expect(table.locator('thead th[scope="col"]')).toHaveText(["Free", "Munshi", "Pro", "Autopilot"]);
  await expect(table.locator(".tt-price")).toHaveText(["₹0", "₹299", "₹499", "₹799"]);
  const region = page.getByRole("region", { name: /tier table/i });
  await expect(region).toHaveAttribute("tabindex", "0");
});

test("the price chart has an accessible name and a text summary", async ({ page }) => {
  const chart = page.getByRole("img", { name: /price per truck per month/i });
  await expect(chart).toBeVisible();
  await expect(page.locator("#pc-summary")).toContainText("Every paid tier is priced above");
  await expect(chart.locator(".pc-dot")).toHaveCount(4);
});

test("who pays includes the labelled assumption", async ({ page }) => {
  const section = page.getByRole("region", { name: "Who pays", exact: true });
  await expect(section).toContainText("Assumption");
  await expect(section.getByRole("article", { name: "Consent basis" })).toContainText("Assumption");
  await expect(section).toContainText("5–16 years");
});

test("axe finds no violations", async ({ page }) => {
  await page.waitForLoadState("networkidle");
  const { violations } = await axeBuilder(page).analyze();
  expect(violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});

test("no horizontal page scroll; the tier table scrolls inside its region on a phone", async ({ page }, info) => {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  if (info.project.name === "phone") {
    const region = page.getByRole("region", { name: /tier table/i });
    const { sw, cw } = await region.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
    expect(sw).toBeGreaterThan(cw);
  }
});

test("the tier table fits the 768 tablet without clipping or a sideways scroll", async ({ page }, info) => {
  test.skip(info.project.name !== "tablet", "tablet-only");
  const region = page.getByRole("region", { name: /tier table/i });
  const { sw, cw } = await region.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
});

for (const width of [320, 375]) {
  test(`at ${width} the cost table stacks and nothing overflows`, async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "phone-only");
    await page.setViewportSize({ width, height: 812 });
    const table = page.getByRole("table", { name: /cost to serve/i });
    const box = await table.evaluate((el) => {
      const section = el.closest("section")!;
      const s = section.getBoundingClientRect();
      // Body cells: the header row is visually hidden on a phone (read, not shown).
      const cells = [...el.querySelectorAll("tbody th, tbody td")].filter((c) => c.getBoundingClientRect().width > 1);
      return {
        tableRight: el.getBoundingClientRect().right,
        sectionRight: s.right,
        overflowing: cells.filter((c) => c.scrollWidth > c.clientWidth + 1 || c.getBoundingClientRect().right > s.right).length,
      };
    });
    expect(box.tableRight).toBeLessThanOrEqual(box.sectionRight);
    expect(box.overflowing).toBe(0);
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    // The basis sits below the line and its amount, full width.
    const row = table.getByRole("row").nth(1);
    const head = await row.getByRole("rowheader").boundingBox();
    const basis = await row.locator(".ct-basis").boundingBox();
    expect(basis!.y).toBeGreaterThan(head!.y);
  });
}
