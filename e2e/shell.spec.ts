import { expect, test, type Page } from "./fixtures";

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

/* ---------- Stage 8 fixes (S1: DES-5, 6, 28, 29, 32) ---------- */

for (const path of ["/", "/trips/0926-04", "/why"]) {
  test(`DES-32: "Skip to content" is the first Tab stop on ${path}, shows when focused, and moves focus into main`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).not.toBeInViewport();
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await expect(async () => {
      await skip.focus();
      await page.keyboard.press("Enter");
      expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("MAIN");
    }).toPass();
  });
}

test("DES-6: at 320 px the Ask drawer's submit button stays on screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const drawer = page.getByRole("dialog", { name: "Ask Urja" });
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(drawer).toBeVisible({ timeout: 500 });
  }).toPass();
  await expect.poll(() => page.locator("#ask-drawer").evaluate((el) => getComputedStyle(el).transform)).toBe("none");
  const submit = await page.locator("#ask-drawer form.composer button[type=submit]").evaluate((b) => b.getBoundingClientRect().right);
  expect(submit).toBeLessThanOrEqual(320);
  expect(await page.locator("#ask-drawer").evaluate((d) => d.scrollWidth <= d.clientWidth)).toBe(true);
});

test("DES-29: the brief's Ask dock shows the standard 2 px focus ring when its field has keyboard focus", async ({ page }) => {
  await page.goto("/brief?lang=en");
  const form = page.locator(".dock form");
  const input = page.locator("#ask-dock-q");
  await input.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  const ring = await form.evaluate((f) => {
    const s = getComputedStyle(f);
    return { style: s.outlineStyle, width: s.outlineWidth };
  });
  expect(ring).toEqual({ style: "solid", width: "2px" });
});

test("DES-5: on the brief, focus moved into view never lands under the Ask dock", async ({ page }) => {
  await page.goto("/brief?lang=en");
  await page.evaluate(() => window.scrollTo(0, 0));
  const items = page.locator("main a[href^='/trips/']");
  const last = (await items.count()) - 1;
  await items.nth(last).evaluate((a: HTMLElement) => a.focus());
  const dock = await page.locator(".dock form").evaluate((f) => f.getBoundingClientRect().top);
  const link = await items.nth(last).evaluate((a) => a.getBoundingClientRect().bottom);
  expect(link).toBeLessThanOrEqual(dock);
});

test("DES-28: with the text alone at 200%, the top bar grows instead of overflowing, and nothing in it clips", async ({ page }, info) => {
  if (info.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  // clientWidth, not innerWidth: on a mobile viewport innerWidth widens to whatever overflows.
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
  const clipped = await page.evaluate(() => [
    ...[...document.querySelectorAll<HTMLElement>("header.topbar *, .btn, .askbar")]
      .filter((e) => e.offsetParent != null && !e.matches(".sr, .sr *, .plate") && e.scrollHeight > e.clientHeight + 1)
      .map((e) => `${e.className}: ${e.textContent}`),
    // a plate's box is at least its 1em line (line-height: 1), so its glyphs sit on the yellow
    ...[...document.querySelectorAll<HTMLElement>(".plate")]
      .filter((e) => e.offsetParent !== null && e.getBoundingClientRect().height + 0.5 < parseFloat(getComputedStyle(e).fontSize))
      .map((e) => `${e.className}: ${e.textContent}`),
  ]);
  expect(clipped).toEqual([]);
  const bar = await page.locator("header.topbar").evaluate((h) => ({ sw: h.scrollWidth, cw: h.clientWidth }));
  expect(bar.sw).toBeLessThanOrEqual(bar.cw);
});

test("DES-28: at 100% text the boxes keep their fixed sizes; flex and grid parents don't stretch them", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "fine pointer: the coarse-pointer rules size these to 44 px");
  for (const path of ["/brief", "/brief?lang=en"]) {
    await page.goto(path);
    const plates = await page.locator("main .item .plate").evaluateAll((ps) => ps.map((p) => p.getBoundingClientRect().height));
    expect(plates.length, path).toBeGreaterThan(0);
    for (const h of plates) expect(h, `${path} plate`).toBe(24);
    expect(await page.locator(".dock form .btn").evaluate((b) => b.getBoundingClientRect().height), `${path} dock Ask`).toBe(40);
  }
  await page.goto("/");
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByRole("dialog", { name: "Ask Urja" })).toBeVisible({ timeout: 500 });
  }).toPass();
  expect(await page.locator("#ask-drawer form.composer button[type=submit]").evaluate((b) => b.getBoundingClientRect().height)).toBe(40);
});
