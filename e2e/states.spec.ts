import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

// TKT-11 (TASK-15): every data view's states. TC-024 (copy and computed numbers on
// Today, the brief and Trip; visible, focusable retries; unknown ?state= falls
// through), TC-022 (no horizontal scroll and no text under 12 px: this spec runs in
// the desktop 1440, tablet 768 and phone 375 projects) and TC-031 (axe) per state.

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Typographic apostrophes and no-break spaces → plain, as the test cases spell them. */
const plain = (s: string | null) => (s ?? "").replace(/’/g, "'").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const R = "₹";

async function expectNoSideScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

async function expectNoSmallText(page: Page) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("main *")]
      .filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .filter((el) => el.closest("svg") === null && !el.classList.contains("sr"))
      .map((el) => ({ t: el.textContent!.trim().slice(0, 30), fs: parseFloat(getComputedStyle(el).fontSize) }))
      .filter((x) => x.fs < 12),
  );
  expect(small).toEqual([]);
}

async function expectAxeClean(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const bad = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(bad).toEqual([]);
}

const card = (page: Page) => page.locator("main section.state");

/** The state card's checks, the same on Today and on the brief. */
const STATE_CHECKS: Record<string, (page: Page) => Promise<void>> = {
  async loading(page) {
    const c = card(page);
    // aria-busy on the skeleton only, never on the section holding the status line
    await expect(c).not.toHaveAttribute("aria-busy", /.*/);
    await expect(c.locator("[data-skeleton='today']")).toHaveAttribute("aria-busy", "true");
    expect(plain(await c.locator("h1").textContent())).toBe("Loading · reconciling yesterday's trips");
    await expect(c.locator(".sk").first()).toBeVisible();
    expect(plain(await c.getByRole("status").textContent())).toBe("Checking 17 trips against fuel, FASTag and GPS · 11 of 17 done");
    await expect(c.locator(".progress b")).toHaveText("11 of 17 done");
    await expect(c.locator(".rail.trips")).toHaveAttribute("aria-label", "Progress: 11 of 17 trips checked, 6 still to check");
    await expect(c.locator(".rail.trips line")).toHaveCount(17);
  },
  async empty(page) {
    const c = card(page);
    await expect(c.locator("h1")).toHaveText("No trips finished yesterday.");
    const copy = plain(await c.locator(".copy").textContent());
    expect(copy).toContain("11 trucks are still on the road and 13 were in the yard or workshop.");
    expect(copy).toContain("Next brief: tomorrow, 7:00 AM.");
    await expect(c.getByRole("link", { name: "See where trucks are now" })).toHaveAttribute("href", "/?view=fleet");
    await expect(c.getByRole("link", { name: "Open September so far" })).toBeVisible();
  },
  async clean(page) {
    const c = page.locator("main section.state.clean");
    expect(plain(await c.locator("h1").textContent())).toBe(`All 17 trips add up. ${R}1,94,800 earned, nothing unaccounted.`);
    await expect(c.locator("h1 .lit")).toHaveText(`${R}1,94,800`);
    expect(plain(await c.locator(".copy").textContent())).toBe("Diesel, tolls and km matched on every trip. That's the 4th clean day this month.");
    await expect(c.locator(".copy b")).toHaveText("4th clean day");
    expect(plain(await c.locator(".st-tag").textContent())).toBe("Working · a clean day · Thu 24 Sep");
    await expect(c.locator(".rail-ends span")).toHaveText(["17 trips reconciled", "0 flags"]);
    await expect(c.getByRole("link", { name: "See the ledger" })).toHaveAttribute("href", /^\/trips\/\d{4}-\d\d#led-h$/);
  },
  async error(page) {
    const c = card(page);
    await expect(c).toHaveAttribute("role", "alert");
    expect(plain(await c.locator("h1").textContent())).toBe("Yesterday's trips haven't reached Urja yet.");
    expect(plain(await c.locator(".copy").textContent())).toBe(
      "6 trucks haven't sent data since 2 AM, most likely no mobile network on the Udaipur stretch. Nothing is lost: the devices store data and send it when they reconnect. The other 11 trips are ready.",
    );
    const ready = c.getByRole("button", { name: "Show the 11 ready trips" });
    const retry = c.getByRole("button", { name: "Try again" });
    await expect(ready).toBeVisible();
    await expect(retry).toBeVisible();
    // keyboard: both are reachable, in order
    await ready.focus();
    await expect(ready).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(retry).toBeFocused();
  },
};

for (const path of ["/", "/brief"]) {
  for (const state of ["loading", "empty", "clean", "error"]) {
    test(`TC-024 · ${path}?state=${state} renders the computed specimen (TC-022, 0 console errors)`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(`${path}?state=${state}`);
      await expect(page.locator("main.st-view")).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      await STATE_CHECKS[state](page);
      // the working view is gone: no verdict, no brief
      await expect(page.locator(".pagehead, .p-brief .earned")).toHaveCount(0);
      await page.waitForLoadState("networkidle");
      await expectNoSideScroll(page);
      await expectNoSmallText(page);
      expect(errors).toEqual([]);
    });
  }
}

test("TC-031 · axe finds no serious or critical violations in any state", async ({ page }) => {
  test.slow();
  for (const url of ["/?state=loading", "/?state=empty", "/?state=clean", "/?state=error", "/brief?state=error", "/trips/0926-04?state=error"]) {
    await page.goto(url);
    await expect(page.locator("main section.state, main .verdict")).toBeVisible();
    await expectAxeClean(page);
  }
});

test("TC-024 · Today's error recovers: Try again opens the working view", async ({ page }) => {
  await page.goto("/?state=error");
  await card(page).getByRole("button", { name: "Try again" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".pagehead h1.verdict")).toBeVisible();
  await expect(page.locator("main.st-view")).toHaveCount(0);
  // focus lands on the working view's h1, never on <body>
  await expect(page.locator(".pagehead h1.verdict")).toBeFocused();
});

test("TC-024 · the brief's error recovers: Show the 11 ready trips opens the brief", async ({ page }) => {
  await page.goto("/brief?state=error&lang=en");
  await card(page).getByRole("button", { name: "Show the 11 ready trips" }).click();
  await expect(page).toHaveURL(/\/brief\?lang=en$/);
  await expect(page.locator(".p-brief .earned")).toBeVisible();
  await expect(page.locator(".p-brief h1")).toBeFocused();
});

test("TC-024 · /trips/0926-04?state=loading is the skeleton of the head and flag card only", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/trips/0926-04?state=loading");
  const main = page.locator("main:has([data-skeleton='trip'])");
  await expect(main).toBeVisible();
  await expect(main).not.toHaveAttribute("aria-busy", /.*/);
  await expect(main.locator("[data-skeleton='trip']")).toHaveAttribute("aria-busy", "true");
  await expect(main.getByRole("status")).toHaveText("Loading this trip");
  await expect(main.locator("[data-skeleton='flag'] .sk").first()).toBeVisible();
  await expect(page.locator(".triphead h1, .timeline")).toHaveCount(0);
  // no invented progress: the skeleton holds no figures
  expect(await main.textContent()).not.toMatch(/\d/);
  await expectNoSideScroll(page);
  expect(errors).toEqual([]);
});

test("TC-024 · /trips/0926-04?state=error says what happened, that nothing is lost, and retries", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/trips/0926-04?state=error");
  await expect(page.locator("h1")).toHaveText(/^Couldn.t load this trip$/);
  await expect(page.locator("main")).toContainText("Nothing is lost");
  await expect(page.locator("h1")).toBeFocused();
  const retry = page.getByRole("button", { name: "Try again" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await expect(retry).toBeFocused();
  await expectNoSideScroll(page);
  await expectNoSmallText(page);
  expect(errors).toEqual([]);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/trips\/0926-04$/);
  await expect(page.locator(".triphead h1")).toHaveText("Jaipur → Delhi (Okhla)");
  await expect(page.locator(".triphead h1")).toBeFocused();
});

test("DES-19 · the brief's clean day looks like Today's: bright headline, the card's own spacing and rail", async ({ page }) => {
  const look = async (url: string) => {
    await page.goto(url);
    const c = page.locator("main section.state.clean");
    await expect(c).toBeVisible();
    return c.evaluate((sec) => {
      const cs = getComputedStyle(sec);
      const h1 = getComputedStyle(sec.querySelector("h1:not(.st-tag)")!);
      const rail = getComputedStyle(sec.querySelector(".rail svg")!);
      return {
        h1: [h1.color, h1.fontSize],
        card: [cs.color, cs.fontSize, cs.padding, cs.gap, cs.alignItems],
        rail: [rail.color, rail.marginTop, rail.flex],
      };
    });
  };
  const today = await look("/?state=clean");
  const brief = await look("/brief?state=clean");
  expect(brief).toEqual(today);
  // --fg, not --fg-muted: the same colour as the plain text of the page.
  expect(today.h1[0]).toBe(await page.evaluate(() => getComputedStyle(document.body).color));
});

test("DES-24 · the trip error heading takes focus without drawing a focus ring", async ({ page }) => {
  await page.goto("/trips/0926-04?state=error");
  const h1 = page.locator("h1");
  await expect(h1).toBeFocused();
  expect(await h1.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("none");
  // The buttons keep theirs.
  const retry = page.getByRole("button", { name: "Try again" });
  await page.keyboard.press("Tab");
  await expect(retry).toBeFocused();
  expect(await retry.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
});

test("DES-4 · on a coarse pointer the state actions are 44 px tall (TC-023)", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "pointer: coarse only");
  const urls = ["/?state=empty", "/?state=error", "/brief?state=empty", "/brief?state=clean", "/brief?state=error"];
  for (const url of urls) {
    await page.goto(url);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    const buttons = page.locator("main.st-view .actions .btn");
    await expect(buttons.first(), url).toBeVisible();
    for (const h of await buttons.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) expect(h, url).toBeGreaterThanOrEqual(44);
  }
  await page.goto("/trips/0926-04?state=error");
  const tripButtons = page.locator("main .btn");
  await expect(tripButtons).toHaveCount(2);
  await expect(tripButtons.first()).toBeVisible();
  for (const h of await tripButtons.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) expect(h).toBeGreaterThanOrEqual(44);
});

test("TC-024 · unknown or unsupported ?state= renders the normal view", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/?state=foo");
  await expect(page.locator(".pagehead h1.verdict")).toBeVisible();
  await expect(page.locator("main.st-view")).toHaveCount(0);

  await page.goto("/brief?state=foo&lang=en");
  await expect(page.locator(".p-brief .earned")).toBeVisible();
  await expect(page.locator("main.st-view")).toHaveCount(0);

  for (const s of ["foo", "empty", "clean"]) {
    await page.goto(`/trips/0926-04?state=${s}`);
    await expect(page.locator(".triphead h1")).toHaveText("Jaipur → Delhi (Okhla)");
    await expect(page.locator("[data-skeleton]")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
