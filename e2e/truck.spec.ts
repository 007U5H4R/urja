import { axeBuilder } from "./axe";
import { expect, test, type Page } from "./fixtures";

// TASK-26: the truck lender view (bet-spec §8) at 375 / 768 / 1440. The trust meter, the verified
// days with no projected months, illustrative loan lines, consent as an assumption, the share
// action (prototype note, no request), flag links to trip pages, axe, and no horizontal scroll.

const GB = "/trucks/rj14-gb-4521";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

async function expectNoAxeViolations(page: Page) {
  const { violations } = await axeBuilder(page).analyze();
  expect(violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

test(`${GB}: the trust meter, verified days, loan lines, consent and flags, with no console errors`, async ({ page }) => {
  const errors = collectErrors(page);
  expect((await page.goto(GB))?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("RJ14 GB 4521 the lender view");
  await expect(page.locator("main")).toContainText("Prototype, simulated data");
  await expect(page.locator(".bet-head .greet")).toHaveText(/^Truck · Ramesh Kumar, driver since \d{4}$/);

  // The headline's Unaccounted is the truck's trucks() figure, as on Today.
  const figures = page.getByRole("region", { name: "September from the ledger" });
  await expect(figures.locator("dt", { hasText: /^Unaccounted$/ }).locator("+ dd")).toHaveText("₹9,630");

  // Trust score: an ARIA meter with a text value, the score as visible text, and "Provisional".
  const meter = page.getByRole("meter", { name: "Trust score" });
  await expect(meter).toHaveAttribute("aria-valuenow", "76.8");
  await expect(meter).toHaveAttribute("aria-valuetext", /^76\.8 of 100, Provisional/);
  const trust = page.getByRole("region", { name: "Trust score", exact: true });
  await expect(trust.locator(".tk-score-v")).toHaveText("76.8of 100");
  await expect(trust.locator(".tk-score .chip")).toHaveText(/^Provisional \(27 days\)$/);
  const breakdown = page.getByRole("table", { name: "Trust score breakdown" });
  await expect(breakdown.locator("tbody tr")).toHaveCount(5);
  await expect(breakdown.locator("thead th", { hasText: /^Score$/ })).toHaveCount(1);
  await expect(breakdown.locator("tbody tr").nth(2)).toContainText("5.6% of diesel ₹");
  // The thresholds and the verified-day definitions are labelled assumptions; the benchmark is cited.
  await expect(page.locator('a.cite-n[href="#src-fuel-leakage-8pct"]')).toHaveCount(1);

  // The daily ledger: a named chart, and a table fallback for screen readers.
  await expect(page.getByRole("img", { name: /^Daily profit, 1 Sep to 27 Sep/ })).toBeVisible();
  await expect(page.getByRole("table", { name: "Daily ledger, day by day" }).locator("tbody tr")).toHaveCount(27);

  // Verified days: 27 of 180, September recorded, Oct–Feb not yet recorded and carrying no ₹.
  const verified = page.getByRole("region", { name: "Verified days" });
  await expect(verified.getByText("27 of 180 verified days")).toBeVisible();
  const months = verified.getByRole("list", { name: "Months on the way to the target" }).getByRole("listitem");
  await expect(months).toHaveCount(6);
  await expect(months.first()).toContainText("Sep");
  await expect(months.first()).toContainText("₹97,848");
  for (const [i, label] of ["Oct", "Nov", "Dec", "Jan", "Feb"].entries()) {
    const slot = months.nth(i + 1);
    await expect(slot).toHaveText(`${label}Not yet recorded`);
    expect(await slot.textContent()).not.toMatch(/₹|\d/);
  }

  // Loan readiness: illustrative lines; consent and partnership labelled Assumption.
  const loan = page.getByRole("region", { name: "Loan readiness" });
  const lines = loan.getByRole("list", { name: "From the verified days" }).getByRole("listitem");
  await expect(lines.filter({ hasText: /illustrative/i })).not.toHaveCount(0);
  await expect(lines.filter({ hasText: "not a forecast or an offer" })).toHaveCount(1);
  const consent = loan.getByRole("group", { name: "Consent and partnership" }).getByRole("listitem");
  await expect(consent).toHaveCount(2);
  await expect(consent.first()).toContainText("Account Aggregator");
  await expect(consent.first()).toContainText("Assumption");
  await expect(consent.nth(1)).toContainText("Assumption");

  // Flags: words for status, a link to each trip.
  const flags = page.getByRole("list", { name: "September flags" }).getByRole("listitem");
  await expect(flags).toHaveCount(2);
  await expect(flags.nth(0)).toContainText("Confirmed");
  await expect(flags.nth(1)).toContainText("Waiting on you");
  await expect(page.getByRole("link", { name: /^Open trip/ })).toHaveCount(2);

  await expectNoHorizontalScroll(page);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test(`${GB}: the share action shows the consent step and the prototype note, and makes no request`, async ({ page }) => {
  await page.goto(GB);
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));

  const button = page.getByRole("button", { name: "Share with a lending partner" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("group", { name: "First, the owner's consent" })).toBeVisible();
  const status = page.getByRole("region", { name: "Loan readiness" }).getByRole("status");
  await expect(status).toContainText("Prototype, simulated data");
  await expect(status).toContainText("Nothing was sent to a lending partner.");
  await page.waitForTimeout(500);
  expect(requests).toEqual([]);

  await expectNoAxeViolations(page);
  await expectNoHorizontalScroll(page);
});

test(`${GB}: each flag link goes to a trip page that answers 200`, async ({ page, request }) => {
  await page.goto(GB);
  const hrefs = await page.getByRole("link", { name: /^Open trip/ }).evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs).toEqual(["/trips/0912-05", "/trips/0926-04"]);
  for (const href of hrefs) expect((await request.get(href!)).status(), href!).toBe(200);
});

test("/trucks/rj14-gc-5021: Unaccounted is ₹0 even though a flag (marked wrong) was raised", async ({ page }) => {
  await page.goto("/trucks/rj14-gc-5021");
  const figures = page.getByRole("region", { name: "September from the ledger" });
  await expect(figures.locator("dt", { hasText: /^Unaccounted$/ }).locator("+ dd")).toHaveText("₹0");
});

test("/trucks/rj14-gc-3309: shows the golden trust score 63.9", async ({ page }) => {
  await page.goto("/trucks/rj14-gc-3309");
  await expect(page.getByRole("meter", { name: "Trust score" })).toHaveAttribute("aria-valuenow", "63.9");
  await expect(page.locator(".tk-score-v .lit")).toHaveText("63.9");
  // Its low-confidence flags say "Check".
  await expect(page.getByRole("list", { name: "September flags" }).getByText("Check")).toHaveCount(3);
});

test(`${GB}: axe finds no violations on load`, async ({ page }) => {
  await page.goto(GB);
  await page.waitForLoadState("networkidle");
  await expectNoAxeViolations(page);
});

test(`${GB}: the daily ledger chart and the trust breakdown fit their panels`, async ({ page }) => {
  await page.goto(GB);
  const fit = await page.locator(".tk-chart").evaluate((el) => {
    const panel = el.closest(".panel")!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { left: r.left >= panel.left - 0.5, right: r.right <= panel.right + 0.5, scroll: el.scrollWidth <= el.clientWidth + 1 };
  });
  expect(fit).toEqual({ left: true, right: true, scroll: true });
  // The trust breakdown can scroll in its own region, but fits at every viewport.
  const table = page.getByRole("region", { name: "Trust score breakdown" });
  expect(await table.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await expectNoHorizontalScroll(page);
});
