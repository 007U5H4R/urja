import { axeBuilder } from "./axe";
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

test.describe("DES-8 · keyboard focus on a flag marker is never off the map (WCAG 2.4.7)", () => {
  /** Marker n's box against the map box and what covers it (header row, glass card, rail box). */
  const placement = (page: Page, n: number) =>
    page.evaluate((n) => {
      const el = document.querySelector(`.fmark[aria-label="Show flag ${n} on the map"]`)!;
      const card = el.closest("article.mapcard")!;
      const r = el.getBoundingClientRect();
      const m = card.querySelector(".maplibregl-map")!.getBoundingClientRect();
      const inside = r.left >= m.left && r.right <= m.right && r.top >= m.top && r.bottom <= m.bottom;
      const covered = [...card.querySelectorAll(".mc-top, #fc, .railbox")].some((c) => {
        const q = c.getBoundingClientRect();
        return q.width > 0 && r.left < q.right && q.left < r.right && r.top < q.bottom && q.top < r.bottom;
      });
      let scrolled = 0;
      for (let e: Element | null = el.parentElement; e && e !== card.parentElement; e = e.parentElement) scrolled += e.scrollTop + e.scrollLeft;
      return { inside, covered, scrolled, focused: document.activeElement === el };
    }, n);

  for (const reduced of [false, true]) {
    test(`Tab onto an off-map marker selects its flag and brings it into view${reduced ? " (reduced motion: a jump)" : ""}`, async ({ page }) => {
      const errors = collectErrors(page);
      if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/?view=map");
      await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
      await page.waitForTimeout(300);
      // Framed on flag 1, flag 2's marker starts off the visible map.
      expect((await placement(page, 2)).inside && !(await placement(page, 2)).covered).toBe(false);
      await page.getByRole("button", { name: "Show flag 1 on the map" }).focus();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Show flag 2 on the map" })).toBeFocused();
      await expect(page.getByRole("button", { name: "Show flag 2 on the map" })).toHaveAttribute("aria-pressed", "true");
      await expect(eyeSel(page).nth(1)).toHaveAttribute("aria-pressed", "true");
      await expect
        .poll(() => placement(page, 2), { timeout: reduced ? 1000 : 4000 })
        .toEqual({ inside: true, covered: false, scrolled: 0, focused: true });
      expect(errors).toEqual([]);
    });
  }

  test("the selected flag's marker, panned out of view, brings the map back when it takes focus", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "pans with a mouse drag");
    await page.goto("/?view=map");
    await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
    await page.waitForTimeout(300);
    await hero(page).scrollIntoViewIfNeeded();
    const box = (await page.locator("article.mapcard .maplibregl-map").boundingBox())!;
    // Drag from the empty top left to the bottom right, twice, so flag 1 ends far off the map.
    for (let k = 0; k < 2; k++) {
      await page.mouse.move(box.x + 30, box.y + box.height * 0.3);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 30, box.y + box.height - 30, { steps: 12 });
      await page.mouse.up();
    }
    await page.waitForTimeout(600);
    expect(await placement(page, 1)).not.toMatchObject({ inside: true, covered: false });
    await page.getByRole("button", { name: "Show flag 1 on the map" }).focus();
    await expect(page.getByRole("button", { name: "Show flag 1 on the map" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => placement(page, 1), { timeout: 4000 }).toEqual({ inside: true, covered: false, scrolled: 0, focused: true });
  });

  test("a marker already in view keeps the selection when it takes focus", async ({ page }) => {
    await page.goto("/?view=fleet");
    await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Show flag 2 on the map" }).focus();
    expect(await placement(page, 2)).toMatchObject({ inside: true, covered: false, focused: true });
    await page.waitForTimeout(300);
    await expect(seg(page, "Fleet")).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("DES-12, DES-13 · hero map labels", () => {
  for (const path of ["/?view=fleet", "/?view=map", "/?view=map&flag=2", "/?view=map&flag=3"]) {
    test(`on ${path}, no label overlaps another label or a marker, and no city label sits under the rail box`, async ({ page }) => {
      await page.goto(path);
      await expect(hero(page)).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
      await page.waitForTimeout(500);
      const clashes = await page.evaluate(() => {
        const card = document.querySelector("article.mapcard")!;
        const m = card.querySelector(".maplibregl-map")!.getBoundingClientRect();
        type B = { name: string; kind: string; r: DOMRect };
        const boxes: B[] = [];
        for (const el of card.querySelectorAll<HTMLElement>(".map-label.city, .map-label.place, .fmark")) {
          if (getComputedStyle(el).visibility === "hidden") continue;
          const r = el.getBoundingClientRect();
          if (r.right < m.left || r.left > m.right || r.bottom < m.top || r.top > m.bottom) continue;
          boxes.push({ name: el.textContent ?? "", kind: el.classList.contains("city") ? "city" : el.classList.contains("place") ? "place" : "mark", r });
        }
        const over = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const out: string[] = [];
        // Two markers may touch when their flags lie close at a wide zoom; they sit on their data.
        boxes.forEach((a, i) =>
          boxes.slice(i + 1).forEach((b) => !(a.kind === "mark" && b.kind === "mark") && over(a.r, b.r) && out.push(`${a.kind} ${a.name} × ${b.kind} ${b.name}`)),
        );
        const rail = card.querySelector(".railbox")!.getBoundingClientRect();
        for (const b of boxes) if (b.kind === "city" && over(b.r, rail)) out.push(`city ${b.name} × rail box`);
        const cities = boxes.filter((b) => b.kind === "city");
        return { out, cities: cities.length, names: cities.map((b) => b.name) };
      });
      expect(clashes.out).toEqual([]);
      expect(clashes.cities).toBeGreaterThan(0);
      // Jaipur, the home yard, keeps its label: a covered city label moves before it hides.
      if (path === "/?view=fleet") expect(clashes.names).toContain("Jaipur");
    });
  }
});

test.describe("DES-26 · the map attribution can be read and clicked", () => {
  // A style whose (empty) source carries Carto's attribution, so the control shows offline.
  const ATTRIBUTED = JSON.stringify({
    version: 8,
    sources: { carto: { type: "geojson", data: { type: "FeatureCollection", features: [] }, attribution: "© CARTO, © OpenStreetMap contributors" } },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#111" } },
      { id: "carto", type: "circle", source: "carto" },
    ],
  });
  for (const path of ["/?view=map", "/?view=fleet", "/trips/0926-04"]) {
    test(`on ${path}, the attribution is on top where it sits, clear of the header, legend, glass card and rail box`, async ({ page }, info) => {
      await page.route(CARTO_STYLE, (r) => r.fulfill({ status: 200, contentType: "application/json", body: ATTRIBUTED }));
      await page.goto(path);
      await expect(page.locator("[data-map=ready]")).toHaveCount(1, { timeout: 20_000 });
      const attrib = page.locator("article.mapcard .maplibregl-ctrl-attrib");
      await expect(attrib).toContainText("OpenStreetMap");
      await attrib.scrollIntoViewIfNeeded();
      // Open, and so legible, when the map loads. On a phone it folds to its (i) after about 5 s
      // (it would cover the route's far end), and the (i) opens it again.
      await expect(attrib).toHaveClass(/maplibregl-compact-show/);
      if (info.project.name === "phone") {
        await expect(attrib).not.toHaveClass(/maplibregl-compact-show/, { timeout: 8000 });
        await attrib.locator(".maplibregl-ctrl-attrib-button").click();
        await expect(attrib).toHaveClass(/maplibregl-compact-show/);
      }
      await expect(attrib.locator(".maplibregl-ctrl-attrib-inner")).toBeVisible();
      const r = await attrib.evaluate((el) => {
        const card = el.closest("article.mapcard")!;
        const a = el.getBoundingClientRect();
        const probe = (x: number, y: number) => !!document.elementFromPoint(x, y)?.closest(".maplibregl-ctrl-attrib");
        const button = el.querySelector(".maplibregl-ctrl-attrib-button")!.getBoundingClientRect();
        const covers = [...card.querySelectorAll(".mc-top, .maplegend, #fc, .railbox")].filter((c) => {
          const q = c.getBoundingClientRect();
          return q.width > 0 && a.left < q.right && q.left < a.right && a.top < q.bottom && q.top < a.bottom;
        });
        return {
          hits: [probe(a.left + 4, a.top + a.height / 2), probe(a.left + a.width / 2, a.top + a.height / 2), probe(a.right - 4, a.top + a.height / 2), probe(button.left + button.width / 2, button.top + button.height / 2)],
          covers: covers.map((c) => c.className),
        };
      });
      expect(r).toEqual({ hits: [true, true, true, true], covers: [] });
    });
  }
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
    const results = await axeBuilder(page).analyze();
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
