import { axeBuilder } from "./axe";
import { expect, test, type Page } from "./fixtures";

// TASK-33 (EXE49): /demo, the six-step guided path "Start the demo" opens on Why Urja.
// TASK-34 (EXE50): told as the story, from the lunch stop to what a lender sees.
// Not a nav destination (TC-023 stays at EXE48's count): no pill or menu item is current on it.

const STEPS: [string, string][] = [
  ["7 AM: one message, in Hindi", "/message"],
  ["Rupees, not data", "/"],
  ["Tap for the evidence", "/trips/0926-04#flag-lab"],
  ["When the money is trusted, the record becomes credit", "/bet"],
  ["Who pays", "/bet/tiers"],
  ["What a lender sees", "/trucks/rj14-gb-4521"],
];

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

const steps = (page: Page) => page.locator("main ol.demo-steps > li");

test("/demo answers 200 with one h1, the prototype intro and six numbered steps", async ({ page }) => {
  const errors = collectErrors(page);
  const res = await page.goto("/demo");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("The 3-minute demo");
  const intro = page.locator("main .demo-intro");
  await expect(intro).toContainText("prototype");
  await expect(intro).toContainText("simulated");
  await expect(intro).toContainText("Mon 28 Sep 2026, 7:12 AM");
  await expect(page.locator("main .demo-story")).toContainText("It started with a lunch stop");
  await expect(page.locator("main .demo-meet")).toHaveText("Urja is built for owners like him. Meet Mr. Sharma: 24 trucks out of Jaipur (simulated).");
  await expect(steps(page)).toHaveCount(6);
  await expect(steps(page).locator("h2")).toHaveText(STEPS.map(([t]) => t));
  // Today's figures, computed from the data (HANDOFF.md fixed numbers).
  await expect(steps(page).nth(1)).toContainText("₹1,86,400");
  await expect(steps(page).nth(1)).toContainText("₹11,430");
  // Trip 0926-04's evidence, from the trip view.
  for (const fact of ["RJ14 GB 4521", "near Behror", "2:14 AM", "38 L in 26 minutes", "₹3,420", "doesn’t add up"]) {
    await expect(steps(page).nth(2)).toContainText(fact);
  }
  await expect(steps(page).nth(5)).toContainText("27 of 180 verified days");
  await expect(page.locator("main .demo-close")).toHaveText(
    "One morning. One answer. In rupees. With evidence. And with the driver’s side of the story.",
  );
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("each step's link resolves to 200, the trip's Flag lab anchor included", async ({ page }) => {
  await page.goto("/demo");
  const hrefs = await steps(page).locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  expect(hrefs).toEqual(STEPS.map(([, h]) => h));
  for (const href of hrefs) expect((await page.request.get(href)).status(), href).toBe(200);
  await page.goto("/trips/0926-04#flag-lab");
  await expect(page.locator("#flag-lab")).toHaveCount(1);
});

test("Start the demo on /why lands on /demo", async ({ page }) => {
  await page.goto("/why");
  await page.locator("header.topbar").getByRole("link", { name: "Start the demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.locator("h1")).toHaveText("The 3-minute demo");
});

test("/demo has the regular top bar, and no nav pill or menu item is current", async ({ page }, info) => {
  await page.goto("/demo");
  await expect(page.locator("header.topbar")).toBeVisible();
  await expect(page.locator("header.topbar a[aria-current]")).toHaveCount(0);
  if (info.project.name !== "phone") {
    await expect(page.locator('nav[aria-label="Main"] a.pill')).toHaveText(["Today", "Trucks", "Trips", "Why Urja", "The bet"]);
  }
  await expect(page.locator('header.topbar a[href="/demo"]')).toHaveCount(0);
});

test("/demo: step links are big enough to hit", async ({ page }, info) => {
  await page.goto("/demo");
  const min = info.project.name === "phone" ? 44 : 24;
  for (const box of await steps(page).locator("a").evaluateAll((as) => as.map((a) => a.getBoundingClientRect().toJSON()))) {
    expect(box.height).toBeGreaterThanOrEqual(min);
    expect(box.width).toBeGreaterThanOrEqual(min);
  }
});

test("/demo: axe finds no violations", async ({ page }) => {
  await page.goto("/demo");
  await page.waitForLoadState("networkidle");
  const { violations } = await axeBuilder(page).analyze();
  expect(violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});

for (const width of [320, 375]) {
  test(`/demo at ${width}px: no horizontal scroll`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "sets its own viewport");
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/demo");
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(sw).toBeLessThanOrEqual(cw);
  });
}
