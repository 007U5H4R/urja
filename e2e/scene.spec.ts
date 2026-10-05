import { expect, test, type Page } from "./fixtures";

// TSK-14.4 · TKT-14 (TASK-18): the Today hero's 3D scene.
// TC-029 (software GPU → the poster, 0 console errors), TC-030's automated part (≤ 1 live WebGL
// context after 10 Today ↔ Trip navigations) and TC-055 (three.js is never in a route's initial
// scripts; it loads only on Today, after first paint). TC-030's GPU checks are manual:
// docs/exec/tc-030-manual.md.
//
// Headless Chromium renders WebGL with SwiftShader, so by default the guard keeps the poster.
// The context count needs the debug counter: playwright.config.ts builds the e2e server with
// NEXT_PUBLIC_DEBUG_GL=1, which exposes `window.__urjaGL = { live }` and honours
// `window.__urjaGLForce = true` (set by an init script below) to take one page past the guard,
// so the live scene, its controls and its disposal run here too. Production never sets the flag.

const TRIP = "/trips/0926-04";
/** Signatures only three.js (and its postprocessing addons) put in a chunk. */
const THREE_RE = /WebGLRenderer|ACESFilmicToneMapping|UnrealBloomPass|PMREMGenerator/;

type GLWindow = Window & { __urjaGL?: { live: number }; __urjaGLForce?: boolean; __realm?: string };

/**
 * Records every WebGL/WebGL2 context the page opens (scene, probe, maps), independently of the
 * scene's own counter, so the TC-030 count can be checked against the browser itself.
 */
async function recordContexts(page: Page) {
  await page.addInitScript(() => {
    const seen = new Set<WebGLRenderingContext | WebGL2RenderingContext>();
    (window as unknown as { __glAll: typeof seen }).__glAll = seen;
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      const ctx = (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
      if (ctx && /^(webgl2?|experimental-webgl)$/.test(type)) seen.add(ctx as WebGL2RenderingContext);
      return ctx;
    } as typeof orig;
  });
}
const openContexts = (page: Page) =>
  page.evaluate(() => [...(window as unknown as { __glAll: Set<WebGL2RenderingContext> }).__glAll].filter((c) => !c.isContextLost()).length);

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

const sceneBox = (page: Page) => page.locator("article.mapcard #scene");
const seg = (page: Page, name: string) => page.locator("article.mapcard").getByRole("button", { name, exact: true });
const live = (page: Page) => page.evaluate(() => (window as GLWindow).__urjaGL?.live ?? 0);

/** Scripts named in a route's server HTML: its initial JS. */
async function initialScripts(request: import("@playwright/test").APIRequestContext, path: string) {
  const html = await (await request.get(path)).text();
  return [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
}

/** Every JS response whose body carries three.js. */
function watchThree(page: Page): string[] {
  const hits: string[] = [];
  page.on("response", async (res) => {
    if (!/\.js(\?|$)/.test(res.url())) return;
    const body = await res.text().catch(() => "");
    if (THREE_RE.test(body)) hits.push(res.url());
  });
  return hits;
}

test("TC-029 · on a software GPU the poster stays, labelled, with 0 console errors", async ({ page }) => {
  const errors = collectErrors(page);
  const three = watchThree(page);
  await page.goto("/");
  const box = sceneBox(page);
  // The guard has run (after idle) and chose the poster.
  await expect(box).toHaveAttribute("data-scene", "fallback", { timeout: 15_000 });
  await expect(box).toHaveClass(/\bfallback\b/);
  await expect(box).not.toHaveClass(/\bready\b/);
  await expect(box).toHaveAttribute("role", "img");
  await expect(box).toHaveAttribute("aria-label", /RJ14 GB 4521/);
  const poster = box.locator("img");
  await expect(poster).toBeVisible();
  await expect(poster).toHaveAttribute("src", /\/_next\/image\?url=%2Ftruck-scene\.png/);
  expect(await poster.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  // Nothing covers it: no canvas stays behind (any canvas would be aria-hidden), no scene controls.
  await expect(box.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Scene view" })).toHaveCount(0);
  // The poster still says what it is (hidden on phones, as lamp.css hides the tag there).
  const tag = box.locator(".scene-tag");
  if ((page.viewportSize()?.width ?? 0) > 760) {
    await expect(tag).toBeVisible();
    await expect(tag).toContainText("Reconstruction from GPS + fuel sensor");
    const tb = (await tag.boundingBox())!;
    const bb = (await box.boundingBox())!;
    expect(tb.y).toBeGreaterThanOrEqual(bb.y);
    expect(tb.x).toBeGreaterThanOrEqual(bb.x);
  } else {
    await expect(tag).toBeHidden();
  }
  // A software GPU never even downloads three.
  await page.waitForLoadState("networkidle");
  expect(three).toEqual([]);
  // The Map switch still works.
  await expect(async () => {
    await seg(page, "Map").click();
    await expect(seg(page, "Map")).toHaveAttribute("aria-pressed", "true", { timeout: 500 });
  }).toPass();
  await expect(page.locator("article.mapcard")).not.toHaveClass(/\bis-scene\b/);
  await expect(page.locator("article.mapcard")).toHaveAttribute("data-map", "ready", { timeout: 20_000 });
  expect(errors).toEqual([]);
});

test("DES-30 · in the fallback the scene tag never meets the glass card (1021, 1024, 1030, 1100, 1440)", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "one viewport sweep is enough; phones hide the tag");
  type Box = { x: number; y: number; width: number; height: number };
  const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  for (const width of [1021, 1024, 1030, 1100, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(sceneBox(page)).toHaveAttribute("data-scene", "fallback", { timeout: 15_000 });
    const tag = sceneBox(page).locator(".scene-tag");
    await expect(tag).toBeVisible();
    await expect(tag).toContainText("Reconstruction from GPS + fuel sensor");
    const t = (await tag.boundingBox())!;
    const card = (await page.locator(".floatcard").boundingBox())!;
    expect(overlaps(t, card), `.scene-tag meets .floatcard at ${width} px: ${JSON.stringify({ t, card })}`).toBe(false);
    // Clear of it, not just touching: the tag ends at least 12 px before the card.
    expect(card.x - (t.x + t.width), `gap at ${width} px`).toBeGreaterThanOrEqual(12);
    // And still inside the hero card.
    const hero = (await sceneBox(page).boundingBox())!;
    expect(t.y + t.height).toBeLessThanOrEqual(hero.y + hero.height);
  }
});

test("TC-055 · three.js is in no initial script of / or the trip page, and the trip page never loads it", async ({ page, request }) => {
  for (const path of ["/", TRIP]) {
    const srcs = await initialScripts(request, path);
    expect(srcs.length, path).toBeGreaterThan(0);
    for (const src of srcs) expect(await (await request.get(src)).text(), `${path} ${src}`).not.toMatch(THREE_RE);
  }
  // Even with the guard bypassed, the trip page has no scene and never fetches three.
  await page.addInitScript(() => ((window as GLWindow).__urjaGLForce = true));
  const three = watchThree(page);
  await page.goto(TRIP);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500); // past any idle callback
  expect(three).toEqual([]);
});

test.describe("the live scene (debug build, guard bypassed)", () => {
  test.skip(({ browserName }) => browserName !== "chromium");

  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "one viewport is enough for the live-scene checks under SwiftShader");
    // Reduced motion: the scene renders once per change, which keeps SwiftShader light.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => ((window as GLWindow).__urjaGLForce = true));
  });

  test("TC-055 · three loads on Today only after first paint, and the canvas fades in over the poster", async ({ page }) => {
    const errors = collectErrors(page);
    const three = watchThree(page);
    await page.goto("/");
    const box = sceneBox(page);
    await expect(box).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
    await expect.poll(() => three.length).toBeGreaterThan(0);
    const timing = await page.evaluate((urls) => {
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? Infinity;
      const starts = performance
        .getEntriesByType("resource")
        .filter((e) => urls.some((u) => u.endsWith(new URL(e.name).pathname)))
        .map((e) => e.startTime);
      return { fcp, starts };
    }, three);
    expect(timing.starts.length).toBeGreaterThan(0);
    for (const s of timing.starts) expect(s).toBeGreaterThan(timing.fcp);
    // One canvas, hidden from assistive tech, over the poster, which stays underneath.
    const canvas = box.locator("canvas");
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toHaveAttribute("aria-hidden", "true");
    await expect(canvas).toHaveCSS("opacity", "1");
    await expect(box.locator("img")).toHaveCount(1);
    await expect(box.locator(".scene-tag")).toBeVisible();
    expect(await live(page)).toBe(1);
    expect(errors.filter((e) => e.startsWith("pageerror"))).toEqual([]);
  });

  test("TC-030 · the view controls never cover the scene tag, the glass card or the rail box (1440, 1200, 1024)", async ({ page }) => {
    type Box = { x: number; y: number; width: number; height: number };
    const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    for (const width of [1440, 1200, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.locator(".truck3d.ready")).toBeVisible({ timeout: 30_000 });
      await expect(page.locator(".scene-tag")).toBeVisible();
      const ctl = await page.locator(".scene-ctl").boundingBox();
      expect(ctl, `controls at ${width}`).not.toBeNull();
      for (const other of [".scene-tag", ".floatcard", ".railbox"]) {
        const box = await page.locator(other).boundingBox();
        if (!box) continue;
        expect(overlaps(ctl!, box), `.scene-ctl overlaps ${other} at ${width} px: ${JSON.stringify({ ctl, box })}`).toBe(false);
      }
    }
  });

  test("TC-030 · drag stays within the limits, the wheel does not zoom, rotate and reset work from the keyboard", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const box = sceneBox(page);
    await expect(box).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
    const canvas = box.locator("canvas");
    // The canvas's pixels only: hide what sits over it (the tag, the controls and their focus ring, the cards).
    const shot = () => canvas.screenshot({ animations: "disabled", style: ".scene-tag, .scene-ctl, .mc-top, .floatcard, .railbox, .fade { visibility: hidden !important; }" });
    const group = page.getByRole("group", { name: "Scene view" });
    const left = group.getByRole("button", { name: "Rotate the scene left" });
    const right = group.getByRole("button", { name: "Rotate the scene right" });
    const reset = group.getByRole("button", { name: "Reset the scene view" });
    await expect(left).toBeVisible();
    const before = await shot();

    // no zoom: the wheel over the canvas changes nothing
    await canvas.hover();
    await page.mouse.wheel(0, -600);
    await page.waitForTimeout(300);
    expect((await shot()).equals(before)).toBe(true);

    // drag to orbit, within limits: a second long drag the same way changes nothing (azimuth ±0.75
    // rad, polar 0.72–1.18 rad), and reset returns to the approved framing
    const bb = (await canvas.boundingBox())!;
    const drag = async (dx: number, dy: number) => {
      await page.mouse.move(bb.x + bb.width * 0.35, bb.y + bb.height * 0.55);
      await page.mouse.down();
      await page.mouse.move(bb.x + bb.width * 0.35 + dx, bb.y + bb.height * 0.55 + dy, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    };
    await drag(1600, 900);
    const atLimit = await shot();
    expect(atLimit.equals(before)).toBe(false);
    await drag(1600, 900);
    expect((await shot()).equals(atLimit)).toBe(true);
    await reset.click();
    await expect.poll(async () => (await shot()).equals(before)).toBe(true);

    await left.focus();
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await shot()).equals(before)).toBe(false);
    await right.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Space");
    await reset.focus();
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await shot()).equals(before)).toBe(true);

    // The controls belong to the Scene view only.
    await seg(page, "Map").click();
    await expect(group).toHaveCount(0);
    expect(errors.filter((e) => e.startsWith("pageerror"))).toEqual([]);
  });

  test("a lost WebGL context brings the poster back and frees the scene", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const box = sceneBox(page);
    await expect(box).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
    expect(await live(page)).toBe(1);
    await page.getByRole("button", { name: "Rotate the scene left" }).focus();
    await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>("#scene canvas")!;
      c.getContext("webgl2")!.getExtension("WEBGL_lose_context")!.loseContext();
    });
    await expect(box).toHaveAttribute("data-scene", "fallback");
    await expect(box.locator("canvas")).toHaveCount(0);
    await expect(box.locator("img")).toBeVisible();
    await expect(page.getByRole("group", { name: "Scene view" })).toHaveCount(0);
    // keyboard focus lands on the Scene switch, not on <body>
    await expect(seg(page, "Scene")).toBeFocused();
    await expect(box.locator(".scene-tag")).toContainText("Reconstruction from GPS + fuel sensor");
    expect(await live(page)).toBe(0);
    expect(errors.filter((e) => e.startsWith("pageerror"))).toEqual([]);
  });

  test("TC-030 · ten Today ↔ Trip navigations leave at most one live WebGL context", async ({ page }) => {
    test.setTimeout(240_000);
    const errors = collectErrors(page);
    await recordContexts(page);
    await page.goto("/");
    await page.evaluate(() => ((window as GLWindow).__realm = "first-load"));
    const box = sceneBox(page);
    await expect(box).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
    // The counter exists: this is the NEXT_PUBLIC_DEBUG_GL=1 build (else `?? 0` would pass vacuously).
    expect(await page.evaluate(() => typeof (window as GLWindow).__urjaGL?.live)).toBe("number");
    expect(await live(page)).toBe(1);
    expect(await openContexts(page)).toBe(1);

    for (let i = 0; i < 10; i++) {
      await page.locator("article.mapcard #fc a.btn-lamp").click();
      await expect(page).toHaveURL(new RegExp(`${TRIP}$`));
      await expect.poll(() => live(page), { message: `on the trip page, round ${i + 1}` }).toBe(0);
      // the trip page's route map may hold one context of its own; the scene's must be gone
      await expect.poll(() => openContexts(page), { message: `browser contexts on the trip page, round ${i + 1}` }).toBeLessThanOrEqual(1);
      await page.locator('nav.crumbs a[href="/"]').first().click();
      await expect(page).toHaveURL(/\/$/);
      await expect(sceneBox(page)).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
      expect(await live(page), `on Today, round ${i + 1}`).toBeLessThanOrEqual(1);
    }
    // Client-side navigations throughout (one JS realm), so the count is cumulative.
    expect(await page.evaluate(() => (window as GLWindow).__realm)).toBe("first-load");
    expect(await live(page)).toBeLessThanOrEqual(1);
    // The browser's view, not the scene's own counter: every context ever opened, still alive.
    await expect.poll(() => openContexts(page)).toBeLessThanOrEqual(1);
    expect(errors.filter((e) => e.startsWith("pageerror"))).toEqual([]);
  });

  test("TC-030 · the guarded path leaks nothing either: 0 live contexts after 10 navigations", async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(() => ((window as GLWindow).__urjaGLForce = false));
    await recordContexts(page);
    await page.goto("/");
    await expect(sceneBox(page)).toHaveAttribute("data-scene", "fallback", { timeout: 15_000 });
    expect(await page.evaluate(() => typeof (window as GLWindow).__urjaGL?.live)).toBe("number");
    for (let i = 0; i < 10; i++) {
      await page.locator("article.mapcard #fc a.btn-lamp").click();
      await expect(page).toHaveURL(new RegExp(`${TRIP}$`));
      await page.locator('nav.crumbs a[href="/"]').first().click();
      await expect(sceneBox(page)).toHaveAttribute("data-scene", "fallback", { timeout: 15_000 });
    }
    expect(await live(page)).toBe(0);
    await expect.poll(() => openContexts(page)).toBe(0); // the probes were released, not left to GC
  });
});

test.describe("the live scene on a phone (coarse pointer, debug build, guard bypassed)", () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "phone project only");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => ((window as GLWindow).__urjaGLForce = true));
  });

  test("TC-030 · no drag, a lower pixel ratio, and 44 px controls", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const box = sceneBox(page);
    await expect(box).toHaveAttribute("data-scene", "ready", { timeout: 30_000 });
    const canvas = box.locator("canvas");
    await canvas.scrollIntoViewIfNeeded();
    // devicePixelRatio 3, capped at 1.25 on a coarse pointer
    const ratio = await canvas.evaluate((c: HTMLCanvasElement) => c.width / c.clientWidth);
    expect(ratio).toBeCloseTo(1.25, 2);
    // the page owns the gesture: vertical pans scroll, and a drag doesn't orbit
    await expect(canvas).toHaveCSS("touch-action", "pan-y");
    const shot = () => canvas.screenshot({ animations: "disabled", style: ".scene-tag, .scene-ctl, .mc-top, .floatcard, .railbox, .fade { visibility: hidden !important; }" });
    const before = await shot();
    const bb = (await canvas.boundingBox())!;
    await page.mouse.move(bb.x + bb.width * 0.6, bb.y + bb.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width * 0.2, bb.y + bb.height * 0.4, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    expect((await shot()).equals(before)).toBe(true);
    // the buttons are the way to turn it here, at 44 px
    for (const name of ["Rotate the scene left", "Rotate the scene right", "Reset the scene view"]) {
      const b = (await page.getByRole("button", { name }).boundingBox())!;
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
    expect(errors.filter((e) => e.startsWith("pageerror"))).toEqual([]);
  });
});

test("the one-column hero (761–1020 px) keeps \"Open the evidence\" clear of the rail box", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "sets its own viewport widths");
  for (const width of [768, 900, 1020]) {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto("/");
    const cta = page.locator("article.mapcard #fc a.btn-lamp");
    await cta.scrollIntoViewIfNeeded();
    const b = (await cta.boundingBox())!;
    const onTop = await page.evaluate(
      ({ x, y }) => {
        const hit = document.elementFromPoint(x, y);
        return !!hit?.closest("#fc a.btn-lamp");
      },
      { x: b.x + b.width / 2, y: b.y + b.height / 2 },
    );
    expect(onTop, `the button is the top element at its centre at ${width} px`).toBe(true);
  }
});
