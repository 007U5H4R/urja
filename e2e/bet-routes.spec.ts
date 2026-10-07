import { axeBuilder } from "./axe";
import { expect, test, type Page } from "./fixtures";

// TASK-21: the bet section's page shells (/bet, /bet/tiers, /trucks/[plate]) at 375 / 768 / 1440.
// They sit in the site layout with the normal top bar, and nothing in the nav links to them yet.

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

const PAGES = [
  { path: "/bet", h1: "Munshi → credit" },
  { path: "/bet/tiers", h1: "Four tiers, and who pays for each" },
  { path: "/trucks/rj14-gb-4521", h1: "RJ14 GB 4521 the lender view" },
] as const;

for (const { path, h1 } of PAGES) {
  test(`${path}: 200, one h1, the prototype note, cited sources, and no console errors`, async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("header.topbar")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    await expect(page.locator("main")).toContainText("Prototype, simulated data");

    // Every [n] link lands on an entry of the page's source list, and each entry says Unverified.
    const sources = page.getByRole("region", { name: "Sources" });
    const items = sources.getByRole("listitem");
    expect(await items.count()).toBeGreaterThan(0);
    await expect(items.filter({ hasText: "Unverified" })).toHaveCount(await items.count());
    const ids = await items.evaluateAll((lis) => lis.map((li) => li.id));
    const hrefs = await page.locator("main a.cite-n").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(ids).toContain(href!.slice(1));

    // No top-bar pill is current: the bet pages are not nav destinations.
    await expect(page.locator('nav[aria-label="Main"] a[aria-current="page"]')).toHaveCount(0);

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test(`${path}: axe finds no violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { violations } = await axeBuilder(page).analyze();
    expect(violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}

test("an unknown truck slug is the 404 page", async ({ page }) => {
  const res = await page.goto("/trucks/xx-00-zz-0000");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("There’s no page at this address.");
});

test("the other truck pages are prerendered too", async ({ request }) => {
  // The first and last trucks of the fleet's rank order.
  for (const path of ["/trucks/rj14-gc-7710", "/trucks/rj14-gc-3309"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test("nothing on Today or Why Urja links to the bet pages yet", async ({ page }) => {
  for (const path of ["/", "/why"]) {
    await page.goto(path);
    await expect(page.locator('a[href^="/bet"], a[href^="/trucks/"]'), path).toHaveCount(0);
  }
});

test("on the phone, the menu on /bet still lists exactly the 6 destinations", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone-only");
  const errors = collectErrors(page);
  await page.goto("/bet");
  const toggle = page.locator('details.m-menu > summary[aria-label="Menu"]');
  await expect(toggle).toBeVisible();
  await toggle.click();
  const menu = page.getByRole("navigation", { name: "Main (mobile)" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link")).toHaveText(["Morning brief", "Today", "Trucks", "Trips", "Why Urja", "Ask Urja"]);
  await expect(menu.locator('a[aria-current="page"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
