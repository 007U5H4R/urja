import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// TKT-05 (TASK-9): the Trip evidence page. TC-003 (UI), TC-004/005 render, the
// 404 deep links (review focus #3), the /trips redirect, honest driver actions,
// TC-022 (no horizontal scroll) and TC-031 (axe).

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Typographic apostrophes → ASCII, as the test cases spell them. */
const plain = (s: string | null) => (s ?? "").replace(/’/g, "'").replace(/ /g, " ");

/** The visible fuel-and-speed chart: desktop above 760 px, phone below. */
const wave = (page: Page, project: string) => page.locator(project === "phone" ? ".wave-mob" : ".wave-desk");

test("TC-003 · /trips/0926-04 shows the computed head, flag card, timeline and ledger, with no console errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/trips/0926-04");
  await expect(page).toHaveTitle("Trip 0926-04 · Urja — Sharma Roadlines");
  await expect(page.locator("h1")).toHaveCount(1);

  // Head
  await expect(page.locator(".triphead .plate.lg")).toHaveText("RJ14 GB 4521");
  await expect(page.locator(".triphead h1")).toHaveText("Jaipur → Delhi (Okhla)");
  await expect(page.locator(".triphead .meta")).toHaveText(
    "Sat 26 Sep, 9:05 PM → Sun 27 Sep, 6:40 AM · 286 km on NH48 · 24 t cement · Driver Ramesh Kumar",
  );
  await expect(page.locator(".triphead .big")).toHaveText("₹13,240profit");
  await expect(page.locator(".triphead .vs .delta.loss")).toHaveText("₹3,420 below");
  expect(plain(await page.locator(".triphead .vs").textContent())).toBe("₹3,420 belowthis route's normal of ₹16,660");

  // Flag card
  const card = page.locator("article.flagcard");
  await expect(card.locator(".rule .chip.warn")).toHaveText("Stationary fuel drop");
  await expect(card.locator(".rule .conf")).toHaveText("High confidence");
  await expect(card.locator("h2")).toHaveText("38 L diesel unaccounted");
  await expect(card.locator(".amt .lit-loss")).toHaveText("₹3,420");
  await expect(card.locator(".amt .muted")).toHaveText("at ₹90 / L");
  await expect(card.locator(".evidence li > span:not(.src)")).toHaveText([
    "Fuel fell 168 → 130 L in 26 minutes",
    "Parked with ignition off, 2:08–2:44 AM",
    "1.6 km off NH48; nearest pump is 3.1 km away",
    "Same stretch flagged 4 more times this month",
  ]);
  await expect(card.locator(".evidence .src")).toHaveText(["Fuel sensor", "GPS · ignition", "Geofence", "Fleet history"]);
  await expect(card.locator(".why").first()).toContainText("±2 L");
  await expect(card.locator(".why").first()).toContainText("about 19×");
  expect(plain(await card.locator(".block .chip").textContent())).toBe("Ramesh hasn't been asked yet");
  await expect(card.locator(".fine").first()).toContainText("Fuel dropped 38 L near Behror at 2:14 AM on 27 Sep.");

  // Timeline: 10 events
  const tl = page.locator("ol.timeline > li");
  await expect(tl).toHaveCount(10);
  await expect(page.locator("ol.timeline .t")).toHaveText(["9:05 PM", "10:40 PM", "11:48 PM", "2:08 AM", "2:14 AM", "2:44 AM", "3:10 AM", "3:31 AM", "5:52 AM", "6:40 AM"]);
  await expect(tl.nth(2).locator(".v")).toHaveText("₹705");
  await expect(tl.nth(4).locator(".v")).toHaveText("−38 L");
  await expect(tl.nth(6).locator(".v")).toHaveText("₹12,600");
  await expect(tl.nth(6).locator(".e small")).toHaveText("Bill 140 L · tank rose 138 L, matches");
  await expect(tl.nth(9).locator(".e small")).toHaveText("Fuel 230 L");

  // Ledger
  await expect(page.locator(".ledgerp .row")).toHaveText([
    "Freight · 24 t cement₹28,000",
    "Diesel used · 118 L × ₹90−₹10,620",
    "of which unaccounted · 38 L−₹3,420",
    "Tolls · FASTag, 3 plazas−₹2,140",
    "Driver allowance−₹1,200",
    "Loading & other−₹800",
    "Profit₹13,240",
  ]);

  // Route chart: 14 bars, the reference line at ₹16,660
  const route = page.locator(".routechart .chart");
  await expect(route).toHaveAttribute("role", "img");
  await expect(route).toHaveAttribute("aria-label", /^Profit on the Jaipur to Delhi route for the last 14 trips: 13 trips between ₹15,800 and ₹17,400, and this trip at ₹13,240, ₹3,420 below the normal of ₹16,660\.$/);
  await expect(route.locator("svg > rect")).toHaveCount(14);
  await expect(page.locator(".routechart p")).toHaveText("This route, last 14 trips- - normal ₹16,660");

  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("TC-003 · the fuel-and-speed chart shows its notes and time ticks", async ({ page }, info) => {
  await page.goto("/trips/0926-04");
  const w = wave(page, info.project.name);
  await expect(w).toBeVisible();
  await expect(w).toHaveAttribute(
    "aria-label",
    info.project.name === "phone"
      ? "Fuel and speed chart: a 38 litre drop while parked near Behror at 2:14 AM, then a refuel at Neemrana that matches the bill."
      : /^Fuel and speed chart\. Fuel falls slowly while driving, stays flat at the dhaba stop, then drops 38 litres between 2:14 and 2:40 AM while speed is zero near Behror\./,
  );
  if (info.project.name === "phone") {
    await expect(w.locator("text", { hasText: "−38 L, parked" })).toHaveCount(1);
    await expect(w.locator("text", { hasText: "+138 L ✓" })).toHaveCount(1);
  } else {
    await expect(w.locator("text", { hasText: "−38 L in 26 min" })).toHaveCount(1);
    await expect(w.locator("text", { hasText: "+138 L refuel · bill 140 L ✓" })).toHaveCount(1);
    await expect(w.locator("text", { hasText: "6:40 AM" })).toHaveCount(1);
  }
  await expect(page.locator(".chartpanel .note")).toHaveText("Top: litres in the tank. Below the line: speed. The drop happened while the truck wasn’t moving.");
});

test("TC-004 · the R2 page (0927-02) renders its own evidence, chart variant and ledger", async ({ page }, info) => {
  const errors = collectErrors(page);
  await page.goto("/trips/0927-02");
  const card = page.locator("article.flagcard");
  await expect(card.locator(".rule .chip")).toHaveText("Refuel mismatch");
  await expect(card.locator(".rule .conf")).toHaveText("Likely");
  await expect(card.locator("h2")).toHaveText("50 L diesel unaccounted");
  await expect(card.locator(".amt .lit-loss")).toHaveText("₹4,500");
  await expect(card.locator(".evidence li").first()).toContainText("Bill says 250 L (₹22,500); the tank rose 200 L");
  await expect(card.locator(".block .chip.wait")).toHaveText("Vikram explained · review");
  await expect(wave(page, info.project.name).locator("text", { hasText: "bill 250 L · tank +200 L" })).toHaveCount(1);
  await expect(page.locator(".ledgerp .row.indent")).toHaveText("of which unaccounted · 50 L−₹4,500");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("TC-005 · the R3 page (0926-11) renders its own evidence, chart variant and ledger", async ({ page }, info) => {
  const errors = collectErrors(page);
  await page.goto("/trips/0926-11");
  const card = page.locator("article.flagcard");
  await expect(card.locator(".rule .chip")).toHaveText("Excess consumption");
  await expect(card.locator(".rule .conf")).toHaveText("Check");
  await expect(card.locator("h2")).toHaveText("Used 39 L more diesel than usual");
  await expect(card.locator(".amt .lit-loss")).toHaveText("₹3,510");
  await expect(card.locator(".evidence")).toContainText("Spread across the trip, no single stop");
  await expect(card.locator(".evidence")).toContainText("Load 26 t (usual 22 t)");
  await expect(wave(page, info.project.name).locator("text", { hasText: "used 364 L · normal 325 L" })).toHaveCount(1);
  await expect(page.locator(".ledgerp .row.indent")).toHaveText("of which unaccounted · 39 L−₹3,510");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

for (const path of ["/trips/0926-4", "/trips/%3Cx%3E", "/trips/0999-99"]) {
  test(`review focus #3 · ${path} is a 404 page, not a crash`, async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    // dynamicParams = false: Next answers an id outside generateStaticParams with the root 404 page.
    await expect(page.locator("h1")).toHaveText("There’s no page at this address.");
    await expect(page.locator("header.topbar")).toBeVisible();
    // The browser logs the 404 document load itself; nothing else may error.
    expect(errors.filter((e) => !/status of 404/.test(e))).toEqual([]);
  });
}

test("/trips redirects (307) to the top flagged trip", async ({ page, request }) => {
  const res = await request.get("/trips", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(new URL(res.headers()["location"], "http://x").pathname).toBe("/trips/0926-04");
  await page.goto("/trips");
  await expect(page).toHaveURL(/\/trips\/0926-04$/);
  await expect(page.locator(".triphead h1")).toHaveText("Jaipur → Delhi (Okhla)");
});

test("driver actions change local state, say nothing was sent, and make no request", async ({ page }) => {
  await page.goto("/trips/0926-04");
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));

  const note = page.getByRole("status");
  await expect(note).toHaveText("");
  await page.getByRole("button", { name: "Ask Ramesh on WhatsApp" }).click();
  await expect(page.locator("article.flagcard .block .chip.wait")).toHaveText("Asked · waiting for Ramesh");
  await expect(note).toHaveText("Asked · waiting for Ramesh. Prototype: no message was sent. In Urja this goes to Ramesh on WhatsApp.");
  await page.getByRole("button", { name: "Mark as explained" }).click();
  await expect(page.locator("article.flagcard .block .chip.wait")).toHaveText("Explained · you decide");
  await expect(note).toHaveText(/^Explained · you decide\. Prototype: no message was sent\./);
  await page.getByRole("button", { name: "Call Ramesh" }).click();
  await page.getByRole("button", { name: "Message Ramesh" }).click();
  // Any request the clicks set off would start at once; give it a moment to show up, event-driven.
  const late = await page.waitForEvent("request", { timeout: 750 }).then((r) => r.url(), () => null);
  expect(late).toBeNull();
  expect(requests).toEqual([]);
});

for (const path of ["/trips/0926-04", "/trips/0927-02", "/trips/0926-11"]) {
  test(`TC-022 · no horizontal scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    await expect(page.locator("article.flagcard h2")).toBeInViewport();
  });
}

test("TC-022 · no text smaller than 12 px on /trips/0926-04", async ({ page }) => {
  await page.goto("/trips/0926-04");
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("main *")]
      .filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
      .filter((el) => (el as HTMLElement).offsetParent !== null || el instanceof SVGElement)
      .filter((el) => el.closest("svg") === null)
      .map((el) => ({ t: el.textContent!.trim().slice(0, 30), fs: parseFloat(getComputedStyle(el).fontSize) }))
      .filter((x) => x.fs < 12),
  );
  expect(small).toEqual([]);
});

test("TC-022 · phone order: flag card, map, fuel chart, timeline, ledger", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone layout only");
  await page.goto("/trips/0926-04");
  const tops = await page.evaluate(() =>
    ["article.flagcard", "article.mapcard", ".chartpanel", "article.lpanel:not(.ledgerp)", "article.ledgerp"].map(
      (s) => document.querySelector(s)!.getBoundingClientRect().top,
    ),
  );
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);
});

test("TC-031 · axe finds no serious or critical violations on /trips/0926-04", async ({ page }) => {
  await page.goto("/trips/0926-04");
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).analyze();
  const bad = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(bad).toEqual([]);
});
