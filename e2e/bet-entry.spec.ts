import { axeBuilder } from "./axe";
import { expect, test, type Page } from "./fixtures";

// TASK-29 (EXE37): the ways into the bet at 375 / 768 / 1440. Why Urja gets chapter 08 and a slim
// banner below the hero; the trip pages get the banner under the breadcrumbs. Today, the brief and
// the message get nothing, and the nav keeps its 6 destinations (TC-023).

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

async function noSideScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

const banner = (page: Page) => page.locator("p.bet-banner");

test("/why ends with chapter 08, the bet, whose links all resolve", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/why");
  const c8 = page.locator("section.chap[aria-labelledby='c8']");
  await expect(c8.locator(".kicker")).toHaveText("08 · The bet");
  await expect(page.locator("section.chap").last()).toHaveAttribute("aria-labelledby", "c8");
  await expect(c8.getByRole("heading", { level: 2 })).toHaveText("From closed books to credit, with the owner’s consent.");
  await expect(c8).toContainText("prototype on simulated data");
  await expect(c8).toContainText("unverified");

  const primary = c8.getByRole("link", { name: "See the bet" });
  await expect(primary).toHaveAttribute("href", "/bet");
  await expect(primary).toHaveClass(/btn-lamp/);
  const hrefs = await c8.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  expect(hrefs).toEqual(["/bet", "/trips/0926-04#flag-lab", "/bet/tiers", "/trucks/rj14-gb-4521"]);
  for (const href of hrefs) expect((await page.request.get(href)).status(), href).toBe(200);

  await c8.scrollIntoViewIfNeeded();
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("/why: the banner comes after the hero, and the hero's h1 is still the first heading", async ({ page }) => {
  await page.goto("/why");
  await expect(banner(page)).toHaveCount(1);
  await expect(banner(page).getByRole("link", { name: "See the bet" })).toHaveAttribute("href", "/bet");
  const order = await page.evaluate(() => {
    const hero = document.querySelector("section.w-hero")!;
    const b = document.querySelector("p.bet-banner")!;
    const first = document.querySelector("main h1, main h2")!;
    return {
      afterHero: !!(hero.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING),
      outsideHero: !hero.contains(b),
      heroFirstInMain: document.querySelector("main")!.firstElementChild === hero,
      firstHeading: first.id,
    };
  });
  expect(order).toEqual({ afterHero: true, outsideHero: true, heroFirstInMain: true, firstHeading: "w-h1" });
  // Below the poster on screen too, so it can't take the LCP from the hero.
  const scene = (await page.locator("figure.w-scene").boundingBox())!;
  const b = (await banner(page).boundingBox())!;
  expect(b.y).toBeGreaterThanOrEqual(scene.y + scene.height);
  await expect(banner(page).locator("img, picture, video, canvas")).toHaveCount(0);
});

test("/trips/0926-04 shows the banner under the breadcrumbs, linking to /bet", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/trips/0926-04");
  await expect(banner(page)).toHaveCount(1);
  await expect(banner(page)).toBeVisible();
  await expect(banner(page)).toContainText("The SuprFleet bet: from Munshi to credit.");
  const link = banner(page).getByRole("link", { name: "See the bet" });
  await expect(link).toHaveAttribute("href", "/bet");
  const box = (await link.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(24);
  // Under the breadcrumbs, before the trip head; the flag lab is still there.
  const prev = await banner(page).evaluate((el) => el.previousElementSibling?.matches("nav.crumbs") ?? false);
  expect(prev).toBe(true);
  await expect(page.locator("#flag-lab")).toHaveCount(1);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("a ?state= specimen on a trip page replaces the banner with the rest of the page", async ({ page }) => {
  await page.goto("/trips/0926-04?state=loading");
  await expect(page.locator("main [data-skeleton='trip']")).toBeVisible();
  await expect(banner(page)).toHaveCount(0);
  await page.goto("/trips/0926-04?state=error");
  await expect(page.locator("h1")).toHaveText(/^Couldn.t load this trip$/);
  await expect(banner(page)).toHaveCount(0);
});

test("Today, the brief and the message show no banner", async ({ page }) => {
  for (const path of ["/", "/brief", "/message", "/brief?lang=en", "/message?lang=en"]) {
    await page.goto(path);
    await expect(page.locator("body"), path).toBeVisible();
    await expect(banner(page), path).toHaveCount(0);
    await expect(page.locator('a[href^="/bet"]'), path).toHaveCount(0);
  }
});

test("the nav still has exactly its 6 destinations, and none is the bet", async ({ page }, info) => {
  await page.goto("/trips/0926-04");
  if (info.project.name === "phone") {
    await page.locator('details.m-menu > summary[aria-label="Menu"]').click();
    const menu = page.getByRole("navigation", { name: "Main (mobile)" });
    await expect(menu.getByRole("link")).toHaveText(["Morning brief", "Today", "Trucks", "Trips", "Why Urja", "Ask Urja"]);
  } else {
    await expect(page.locator('nav[aria-label="Main"] a.pill')).toHaveText(["Today", "Trucks", "Trips", "Why Urja"]);
  }
  await expect(page.locator('header.topbar a[href^="/bet"]')).toHaveCount(0);
});

for (const path of ["/why", "/trips/0926-04"]) {
  test(`${path}: no horizontal scroll, and axe finds no violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await noSideScroll(page);
    const { violations } = await axeBuilder(page).analyze();
    expect(violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
