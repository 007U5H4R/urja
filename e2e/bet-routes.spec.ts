import { axeBuilder } from "./axe";
import { expect, test, type Page } from "./fixtures";

// TASK-21: the bet section's page shells (/bet, /bet/tiers, /trucks/[plate]) at 375 / 768 / 1440.
// They sit in the site layout with the normal top bar; since EXE48 its The bet pill leads to them.

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

    // EXE48: The bet pill is current, and no other.
    const current = page.locator('nav[aria-label="Main"] a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("aria-label", "The bet");
    await expect(current).toHaveAttribute("href", "/bet");

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

// TASK-29 (EXE37): the bet is reached from Why Urja (and the trip pages), never from the content of Today,
// the brief or the message. EXE48 adds the nav's The bet item (the top bar's pill, the phone screens' menu),
// so the check covers each page's main content, outside its menu.
test("Today, the brief and the message don't link to the bet pages outside the nav; Why Urja does", async ({ page }) => {
  for (const path of ["/", "/brief", "/message"]) {
    await page.goto(path);
    await expect(page.locator("main"), path).toHaveCount(1);
    await expect(page.locator('main a[href^="/bet"]:not(.m-menu a), main a[href^="/trucks"]:not(.m-menu a)'), path).toHaveCount(0);
    // Nowhere on the page outside the nav either; the nav's only bet link is The bet itself.
    const nav = "header.topbar nav a, .m-menu nav a";
    await expect(page.locator(`a[href^="/bet"]:not(${nav}), a[href^="/trucks"]`), path).toHaveCount(0);
    const navBet = await page.locator(nav).evaluateAll((as) => as.map((a) => a.getAttribute("href")!).filter((h) => h.startsWith("/bet")));
    // On Today: the pill and the menu item; on the phone screens: their menu's item.
    expect(navBet, path).toEqual(path === "/" ? ["/bet", "/bet"] : ["/bet"]);
  }
  await page.goto("/why");
  expect(await page.locator('a[href="/bet"]').count()).toBeGreaterThan(0);
});

// EXE48: 7 destinations, The bet among them and current.
test("on the phone, the menu on /bet lists the 7 destinations, with The bet current", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone-only");
  const errors = collectErrors(page);
  await page.goto("/bet");
  const toggle = page.locator('details.m-menu > summary[aria-label="Menu"]');
  await expect(toggle).toBeVisible();
  await toggle.click();
  const menu = page.getByRole("navigation", { name: "Main (mobile)" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link")).toHaveText(["Morning brief", "Today", "Trucks", "Trips", "Why Urja", "The bet", "Ask Urja"]);
  await expect(menu.locator('a[aria-current="page"]')).toHaveText(["The bet"]);
  expect(errors).toEqual([]);
});
