import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "./fixtures";

// TSK-10.4 · TKT-10 (TASK-14): the hero map and the trip route map.
// TC-025 (list ↔ map linking), review focus #4 (the map never loads), TC-028 (tiles blocked),
// reduced motion, TC-055 (MapLibre is not in the initial JS of /), TC-022 and TC-031.
//
// No spec here needs live tiles except the ones tagged @tiles: the shared fixture (fixtures.ts)
// serves a minimal offline style for Carto, so MapLibre loads (WebGL via SwiftShader) without
// the network. Specs that need Carto to fail or hang register their own route, which wins.

const CARTO_STYLE = "**/basemaps.cartocdn.com/gl/**/style.json";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

const eyeSel = (page: Page) => page.locator("article.eyes button.eye-sel");
const hero = (page: Page) => page.locator("article.mapcard");
const glass = (page: Page) => page.locator("article.mapcard #fc");
const railbox = (page: Page) => page.locator("article.mapcard #rb");
const seg = (page: Page, name: string) => hero(page).getByRole("button", { name, exact: true });

/** Clicks once hydration has attached the handler (retrying, as shell.spec does). */
async function clickUntil(page: Page, click: () => Promise<void>, check: () => Promise<void>) {
  await expect(async () => {
    await click();
    await check();
  }).toPass();
}

/**
 * Records marker n's screen position on every animation frame while `act` runs and for `ms`
 * after, then summarises the motion: how many distinct positions it passed through and how long
 * it took from the first move to the last. A fly-to passes through many; a jump through none.
 */
async function trackMarker(page: Page, n: number, act: () => Promise<void>, ms = 2800) {
  await page.evaluate(
    ({ n, ms }) => {
      const el = document.querySelector(`.fmark[aria-label="Show flag ${n} on the map"]`)!;
      // Measured against the map, so a page scroll caused by the click (on a phone) isn't counted as map motion.
      const map = el.closest(".maplibregl-map")!;
      const out: [number, number, number][] = [];
      (window as unknown as { __track: typeof out }).__track = out;
      const t0 = performance.now();
      const tick = () => {
        const r = el.getBoundingClientRect();
        const m = map.getBoundingClientRect();
        out.push([performance.now() - t0, Math.round(r.x - m.x), Math.round(r.y - m.y)]);
        if (performance.now() - t0 < ms) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { n, ms },
  );
  await act();
  await page.waitForTimeout(ms + 300);
  const samples = await page.evaluate(() => (window as unknown as { __track: [number, number, number][] }).__track);
  const key = (s: [number, number, number]) => `${s[1]},${s[2]}`;
  const first = key(samples[0]);
  const last = key(samples[samples.length - 1]);
  const moved = samples.findIndex((s) => key(s) !== first);
  const settled = samples.findIndex((s, i) => samples.slice(i).every((x) => key(x) === last));
  return {
    moved: moved >= 0,
    positions: new Set(samples.map(key)).size,
    ms: moved >= 0 ? samples[settled][0] - samples[moved][0] : 0,
  };
}

test.describe("TC-025 · list ↔ map linking", () => {
  test("rows and markers select a flag; rows 2–3 switch Scene → Map; Fleet shows the fleet", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(seg(page, "Scene")).toHaveAttribute("aria-pressed", "true");
    await expect(hero(page)).toHaveClass(/\bis-scene\b/);

    // Row 2: Scene → Map, row 2 lit, glass card and rail follow.
    await clickUntil(
      page,
      () => eyeSel(page).nth(1).click(),
      () => expect(seg(page, "Map")).toHaveAttribute("aria-pressed", "true", { timeout: 500 }),
    );
    await expect(hero(page)).not.toHaveClass(/\bis-scene\b/);
    await expect(eyeSel(page).nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("article.eyes .eye").nth(1)).toHaveClass(/\bon\b/);
    await expect(glass(page).locator(".fc-head .plate")).toHaveText("RJ14 GA 1182");
    await expect(glass(page).locator(".fc-head .subtle")).toHaveText("Trip 0927-02");
    await expect(railbox(page).locator(".rail .knob b")).toHaveText("4:50 PM · bill ≠ tank");

    // The map loads and lights marker 2.
    await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
    await expect(page.locator(".fmark")).toHaveCount(3);
    await expect(page.locator(".fmark.on")).toHaveText("2");

    // Marker 3 selects row 3.
    await page.getByRole("button", { name: "Show flag 3 on the map" }).click();
    await expect(eyeSel(page).nth(2)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".fmark.on")).toHaveText("3");
    await expect(page.locator('.fmark[aria-pressed="true"]')).toHaveText("3");
    await expect(glass(page).locator(".fc-head .plate")).toHaveText("RJ14 GC 3309");

    // Fleet: the fleet's counts.
    await seg(page, "Fleet").click();
    await expect(seg(page, "Fleet")).toHaveAttribute("aria-pressed", "true");
    await expect(glass(page).locator(".fc-head b")).toHaveText("24 trucks");
    await expect(glass(page).locator("dl div")).toHaveText(["On a trip11", "In a yard12", "Workshop1"]);
    await expect(railbox(page).locator(".rb-head b")).toHaveText("Now, 7:12 AM");
    await expect(page.locator("#heroMap")).toHaveAttribute(
      "aria-label",
      "Map of all 24 trucks now: 11 on a trip, 12 in a yard, 1 in the workshop. Numbered markers are yesterday’s 3 flags.",
    );
    await expect(page.locator(".fmark.on")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("the map flies to the selected flag over about 1.4 s", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/?view=map");
    await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
    const motion = await trackMarker(page, 3, () => eyeSel(page).nth(2).click());
    // Many in-between frames over roughly 1.4 s (the curve eases in and out, so the ends are still).
    expect(motion.moved).toBe(true);
    expect(motion.positions).toBeGreaterThan(4);
    expect(motion.ms).toBeGreaterThan(700);
    expect(motion.ms).toBeLessThan(2400);
    expect(errors).toEqual([]);
  });

  test("row 1 keeps the Scene, and back to Scene resets to flag 1", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await clickUntil(
      page,
      () => eyeSel(page).nth(2).click(),
      () => expect(eyeSel(page).nth(2)).toHaveAttribute("aria-pressed", "true", { timeout: 500 }),
    );
    await seg(page, "Scene").click();
    await eyeSel(page).nth(0).click();
    await expect(seg(page, "Scene")).toHaveAttribute("aria-pressed", "true");
    await expect(glass(page).locator(".fc-head .plate")).toHaveText("RJ14 GB 4521");
    await expect(page.locator(".truck3d#scene img")).toHaveAttribute("src", /\/_next\/image\?url=%2Ftruck-scene\.png/);
    expect(errors).toEqual([]);
  });
});

test("review focus #4 · with a map that never loads, the lit row, glass card and rail still follow the selection", async ({ page }) => {
  const errors = collectErrors(page);
  const held: Route[] = [];
  // The style request never answers, so MapLibre never fires `load`.
  await page.route(CARTO_STYLE, (r) => {
    held.push(r);
  });
  await page.goto("/");
  await clickUntil(
    page,
    () => eyeSel(page).nth(1).click(),
    () => expect(seg(page, "Map")).toHaveAttribute("aria-pressed", "true", { timeout: 500 }),
  );
  await expect.poll(() => held.length).toBeGreaterThan(0);
  await expect(hero(page)).toHaveAttribute("data-map", "loading");
  await expect(glass(page).locator(".fc-head .plate")).toHaveText("RJ14 GA 1182");
  await expect(railbox(page).locator(".rail .knob b")).toHaveText("4:50 PM · bill ≠ tank");
  await eyeSel(page).nth(2).click();
  await expect(page.locator("article.eyes .eye").nth(2)).toHaveClass(/\bon\b/);
  await expect(glass(page).locator(".fc-head .plate")).toHaveText("RJ14 GC 3309");
  await expect(railbox(page).locator(".rb-head b")).toHaveText("26–27 Sep");
  await eyeSel(page).nth(0).click();
  await expect(glass(page).locator(".fc-head .subtle")).toHaveText("Trip 0926-04");
  await expect(railbox(page).locator(".rail .knob b")).toHaveText("2:14 AM · −38 L");
  await expect(hero(page)).toHaveAttribute("data-map", "loading");
  expect(errors).toEqual([]);
});

test.describe("TC-028 · map unavailable", () => {
  test("blocked Carto: the hero says so, and the switch and selection keep working", async ({ page }) => {
    const errors = collectErrors(page);
    await page.route("**/basemaps.cartocdn.com/**", (r) => r.abort());
    await page.goto("/?view=map");
    const overlay = hero(page).locator(".map-fail");
    await expect(overlay).toHaveText("Map unavailable; every event is in the timeline", { timeout: 15_000 });
    await expect(overlay).toBeVisible();
    await expect(hero(page)).toHaveAttribute("data-map", "failed");
    await eyeSel(page).nth(1).click();
    await expect(glass(page).locator(".fc-head .plate")).toHaveText("RJ14 GA 1182");
    await seg(page, "Fleet").click();
    await expect(glass(page).locator(".fc-head b")).toHaveText("24 trucks");
    await seg(page, "Scene").click();
    await expect(hero(page)).toHaveClass(/\bis-scene\b/);
    await expect(overlay).toBeHidden();
    // The blocked requests are the only errors: nothing uncaught.
    expect(errors.filter((e) => !/Failed to load resource: net::ERR_FAILED/.test(e))).toEqual([]);
  });

  test("blocked Carto: the trip route map says so; the legend, rail and timeline stay", async ({ page }) => {
    const errors = collectErrors(page);
    await page.route("**/basemaps.cartocdn.com/**", (r) => r.abort());
    await page.goto("/trips/0926-04");
    const card = page.locator("article.mapcard");
    await expect(card.locator(".map-fail")).toHaveText("Map unavailable; every event is in the timeline", { timeout: 15_000 });
    await expect(card.locator(".maplegend")).toBeAttached();
    await expect(card.locator(".railbox .rail")).toBeVisible();
    await expect(page.locator("ol.timeline > li")).toHaveCount(10);
    expect(errors.filter((e) => !/Failed to load resource: net::ERR_FAILED/.test(e))).toEqual([]);
  });
});

test.describe("reduced motion", () => {
  test("no ping on the lit marker, and the map jumps instead of flying", async ({ page }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?view=map");
    await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
    const ping = await page.locator(".fmark.on").evaluate((el) => getComputedStyle(el, "::after").animationName);
    expect(ping).toBe("none");
    const motion = await trackMarker(page, 3, () => eyeSel(page).nth(2).click(), 1500);
    await expect(page.locator(".fmark.on")).toHaveText("3");
    // A jump: straight from the old spot to the new one, nothing in between.
    expect(motion.moved).toBe(true);
    expect(motion.positions).toBe(2);
    expect(errors).toEqual([]);
  });
});

test("with motion allowed, the lit marker pings", async ({ page }) => {
  await page.goto("/?view=map");
  await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
  const ping = await page.locator(".fmark.on").evaluate((el) => getComputedStyle(el, "::after").animationName);
  expect(ping).toBe("ping");
});

test("the trip route map loads with its markers, the flagged stop lit", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/trips/0926-04");
  const box = page.locator(".map#tripMap");
  await expect(box).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
  await expect(box).toHaveAttribute("role", "group");
  await expect(box).toHaveAttribute(
    "aria-label",
    "Route map: planned NH48 route from Jaipur to Okhla, Delhi, and the actual route, which leaves the highway for 1.6 km near Behror where fuel dropped",
  );
  await expect(page.locator(".evmark")).toHaveCount(5);
  await expect(page.locator(".evmark.bad")).toHaveCount(1);
  await expect(page.locator(".map-label.place.bad")).toHaveText("Parked near Behror · −38 L");
  await expect(page.locator("article.mapcard .pool")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("TC-055 · MapLibre is not in the initial JS of /, and arrives only with the Map view", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  expect(srcs.length).toBeGreaterThan(0);
  for (const src of srcs) {
    const js = await (await request.get(src)).text();
    expect(js, src).not.toMatch(/maplibre/i);
  }
  // It does exist, lazily: switching to Map fetches it.
  const lazy: string[] = [];
  page.on("response", async (res) => {
    if (res.url().endsWith(".js") && !srcs.some((s) => res.url().endsWith(s)) && /maplibre/i.test(await res.text().catch(() => ""))) lazy.push(res.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(lazy).toEqual([]);
  await clickUntil(
    page,
    () => seg(page, "Map").click(),
    () => expect(seg(page, "Map")).toHaveAttribute("aria-pressed", "true", { timeout: 500 }),
  );
  await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
  expect(lazy.length).toBeGreaterThan(0);
});

for (const path of ["/?view=map", "/?view=fleet"]) {
  test(`TC-022 · no horizontal scroll on ${path}`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(path);
    await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    expect(errors).toEqual([]);
  });
}

for (const path of ["/?view=map", "/trips/0926-04"]) {
  test(`TC-031 · axe finds no serious or critical violations on ${path} with the map loaded`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("[data-map=ready]")).toHaveCount(1, { timeout: 20_000 });
    const results = await new AxeBuilder({ page }).analyze();
    const bad = results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(bad).toEqual([]);
  });
}

// Live Carto tiles. Playwright fetches them on the Node side (route.fetch honours the machine's
// CA and proxy settings, where the sandbox browser doesn't trust the egress proxy's CA); the
// specs skip themselves where Carto can't be reached.
async function liveTiles(page: Page) {
  await page.route(/cartocdn\.com/, async (r) => r.fulfill({ response: await r.fetch() }).catch(() => r.abort()));
}
test.describe("@tiles", () => {
  test("TC-025 @tiles · on the real night map, the map flies to flag 2 and the Carto attribution shows", async ({ page, request }) => {
    const probe = await request.get("https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json", { timeout: 8000 }).catch(() => null);
    test.skip(!probe?.ok(), "Carto is not reachable from here");
    const errors = collectErrors(page);
    await liveTiles(page);
    await page.goto("/?view=map");
    await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 30_000 });
    await expect(page.locator(".maplibregl-ctrl-attrib")).toContainText("CARTO");
    await expect(page.locator(".maplibregl-ctrl-attrib")).toContainText("OpenStreetMap");
    const motion = await trackMarker(page, 2, () => eyeSel(page).nth(1).click());
    expect(motion.moved).toBe(true);
    expect(motion.positions).toBeGreaterThan(4);
    expect(motion.ms).toBeGreaterThan(700);
    expect(errors).toEqual([]);
  });

  test("TC-003 @tiles · the trip route map on live tiles loads with no console errors", async ({ page, request }) => {
    const probe = await request.get("https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json", { timeout: 8000 }).catch(() => null);
    test.skip(!probe?.ok(), "Carto is not reachable from here");
    const errors = collectErrors(page);
    await liveTiles(page);
    await page.goto("/trips/0926-04");
    await expect(page.locator(".map#tripMap")).toHaveAttribute("data-map", "ready", { timeout: 30_000 });
    await expect(page.locator(".maplibregl-ctrl-attrib")).toContainText("CARTO");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
});
