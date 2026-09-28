import { expect, test, type Page } from "@playwright/test";

// TKT-03 AC2 + AC5 (TC-022, TC-031 shell): the top bar on every route, the
// ≤760px menu, no horizontal scroll at 375 / 768 / 1440, ⌘K hidden on touch.

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test("the top bar renders with Today current and no console errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  const bar = page.locator("header.topbar");
  await expect(bar).toBeVisible();
  await expect(bar.getByRole("link", { name: "Urja, Today" })).toBeVisible();
  const pills = page.locator('nav[aria-label="Main"] a.pill');
  await expect(pills).toHaveCount(4);
  await expect(page.locator('nav[aria-label="Main"] a[aria-current="page"]')).toHaveAttribute("aria-label", "Today");
  await expect(page.locator('nav[aria-label="Main"] a[aria-current="page"]')).toHaveCount(1);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("the top bar shows the fleet chip and the sprite resolves its icons", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator("svg[aria-hidden='true'] symbol#i-mark")).toHaveCount(1);
  const icon = page.locator(info.project.name === "phone" ? ".m-menu summary svg.i" : ".pill svg.i").first();
  const box = (await icon.boundingBox())!;
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
  await expect(page.locator(".fleet .avatar")).toHaveText("SR");
  // The body font comes from next/font's Inter, not a system face.
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family).toMatch(/Inter/);
});

test("no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
});

test.describe("phone", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== "phone", "phone-only");
  });

  test("the menu opens and lists all 6 destinations", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.locator(".navpills")).toBeHidden();
    await expect(page.locator(".askbar")).toBeHidden();
    const toggle = page.locator("details.m-menu > summary[aria-label=\"Menu\"]");
    await expect(toggle).toBeVisible();
    await toggle.click();
    const menu = page.getByRole("navigation", { name: "Main (mobile)" });
    await expect(menu).toBeVisible();
    const items = menu.getByRole("link");
    await expect(items).toHaveText(["Morning brief", "Today", "Trucks", "Trips", "Why Urja", "Ask Urja"]);
    for (const item of await items.all()) {
      const box = (await item.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await expect(menu.getByRole("link", { name: "Today" })).toHaveAttribute("aria-current", "page");
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    // The Escape listener arrives with hydration; retry until it has.
    await expect(async () => {
      if (!(await menu.isVisible())) await toggle.click();
      await expect(menu).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden({ timeout: 500 });
    }).toPass();
    expect(errors).toEqual([]);
  });

  test("the ⌘K hint is hidden on a coarse pointer", async ({ page }) => {
    await page.goto("/");
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    const display = await page.locator(".kbd").evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe("none");
  });
});

test.describe("desktop and tablet", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name === "phone", "pointer: fine only");
  });

  test("the Ask trigger is visible, announces a dialog, and shows ⌘K", async ({ page }) => {
    await page.goto("/");
    const ask = page.getByRole("button", { name: /ask about any truck, trip or driver/i });
    await expect(ask).toBeVisible();
    await expect(ask).toHaveAttribute("aria-haspopup", "dialog");
    await expect(page.locator(".askbar .kbd")).toBeVisible();
    await expect(page.locator("details.m-menu")).toBeHidden();
    // The click handler arrives with hydration; retry until it has.
    await expect(async () => {
      const fired = await page.evaluate(
        () =>
          new Promise<boolean>((resolve) => {
            window.addEventListener("urja:ask-open", () => resolve(true), { once: true });
            (document.querySelector(".askbar") as HTMLButtonElement).click();
            setTimeout(() => resolve(false), 300);
          }),
      );
      expect(fired).toBe(true);
    }).toPass();
  });
});

test("the top bar is on other routes, with the matching pill current", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "pills are hidden on the phone");
  const errors = collectErrors(page);
  await page.goto("/trips");
  await expect(page.locator("header.topbar")).toBeVisible();
  await expect(page.locator('nav[aria-label="Main"] a[aria-current="page"]')).toHaveAttribute("aria-label", "Trips");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("an unknown address shows the 404 page with the top bar and a way back", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.locator("header.topbar")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("There’s no page at this address.");
  await expect(page.getByRole("link", { name: "Back to Today" })).toHaveAttribute("href", "/");
});
