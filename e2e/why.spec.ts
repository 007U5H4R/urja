import { axeBuilder } from "./axe";
import { expect, test, type Page } from "./fixtures";

// TKT-08 AC1–AC3 (TC-022, TC-023 touch target): the Why Urja page at 375 / 768 / 1440.

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test("the page loads with its title, one h1, the landmarks and no console errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/why");
  await expect(page).toHaveTitle("Why Urja · a concept for Bytebeam");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Fleet owners learn where their money leaked at month end. Urja tells them the next morning.",
  );
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(8);
  // Scroll to the end so every section has rendered, then settle.
  await page.locator("section[aria-labelledby='c8']").scrollIntoViewIfNeeded();
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("TC-022: no horizontal scroll, and the primary actions are visible", async ({ page }) => {
  await page.goto("/why");
  await page.waitForLoadState("networkidle");
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  await expect(page.getByRole("link", { name: "See the 7 AM brief" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open a flagged trip" })).toBeVisible();
});

test("the buttons keep their 40 px height on fine pointers", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "pointer: fine only");
  await page.goto("/why");
  for (const btn of await page.locator("header.topbar .btn, .w-hero .actions .btn").all()) {
    expect((await btn.boundingBox())!.height).toBe(40);
  }
});

test("axe finds no violations", async ({ page }) => {
  await page.goto("/why");
  await page.waitForLoadState("networkidle");
  const { violations } = await axeBuilder(page).analyze();
  expect(violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});

test("the market is a real table with column and row headers", async ({ page }) => {
  await page.goto("/why");
  const table = page.getByRole("table");
  await expect(table.locator("thead th[scope='col']")).toHaveCount(3);
  await expect(table.locator("tbody th[scope='row']")).toHaveText(["Fleetx", "Intangles", "LocoNav", "Samsara", "Urja"]);
});

test("DES-27 · chapter 03 keeps what the owner still lacks at every width: a column, or a muted line under 860 px", async ({ page }) => {
  await page.goto("/why");
  const table = page.getByRole("table");
  const narrow = page.viewportSize()!.width <= 860;
  const column = table.locator("tbody td.hide-sm");
  const lines = table.locator("tbody td .lacks");
  for (const gap of ["Needs an extra fuel sensor", "Scores drivers without asking their side", "Not built for Indian roads, Hindi, or FASTag"]) {
    await expect((narrow ? lines : column).filter({ hasText: gap })).toBeVisible();
    await expect((narrow ? column : lines).filter({ hasText: gap })).toBeHidden();
  }
  await expect(lines).toHaveCount(4);
  if (narrow) {
    // Muted, under the "does well" text, and the table still fits its card.
    const [line, does] = await lines.first().evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el.parentElement!).color]);
    expect(line).not.toBe(does);
    const fits = await page.locator(".cmpcard").evaluate((card) => card.querySelector("table")!.offsetWidth <= card.clientWidth);
    expect(fits).toBe(true);
  }
});

test("DES-28 · with text-only zoom at 200%, the metric figures wrap inside their tiles", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "the 375 px case");
  await page.goto("/why");
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  const over = await page.locator(".tile .big .n").evaluateAll((ns) =>
    ns.filter((n) => n.getBoundingClientRect().right > n.closest(".tile")!.getBoundingClientRect().right + 0.5).map((n) => n.textContent),
  );
  expect(over).toEqual([]);
});

test("DES-28 · at 375 with the text alone at 200%, the top bar's CTA shrinks and wraps, so the page doesn't scroll sideways and the menu stays on screen", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "sets its own viewport");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/why");
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
  const cta = page.locator("header.topbar").getByRole("link", { name: "Start the demo" });
  await expect(cta).toBeVisible();
  // it wraps inside its box, which grows, rather than clipping its words
  const clip = await cta.evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight }));
  expect(clip.sw).toBeLessThanOrEqual(clip.cw + 1);
  expect(clip.sh).toBeLessThanOrEqual(clip.ch + 1);
  const menu = (await page.locator("header.topbar .m-menu summary").boundingBox())!;
  expect(menu.x).toBeGreaterThanOrEqual(0);
  expect(menu.x + menu.width).toBeLessThanOrEqual(cw);
});

test("DES-28 · at 100% text the /why top bar lays out exactly as with the CTA's old flex: none, at 375 and 1440", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "sets its own viewports");
  const boxes = () =>
    page.locator("header.topbar .wordmark, header.topbar .btn, header.topbar .m-menu summary").evaluateAll((es) =>
      es.filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => {
        const r = e.getBoundingClientRect();
        return [e.className || e.tagName, r.left, r.top, r.width, r.height];
      }),
    );
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/why");
    const now = await boxes();
    expect(now.length, `${width}`).toBeGreaterThanOrEqual(2);
    const style = await page.addStyleTag({ content: ".topbar .btn { flex: none !important; min-width: auto !important; white-space: nowrap !important; }" });
    expect(await boxes(), `${width}`).toEqual(now);
    await style.evaluate((s) => (s as HTMLElement).remove());
  }
});

test("chapter 01 labels its four quotes as illustrative, not from interviews, and shows no placeholder", async ({ page }) => {
  await page.goto("/why");
  const c1 = page.locator("section[aria-labelledby='c1']");
  await expect(c1.locator("p.assume")).toHaveText(
    "Illustrative quotes, not from interviews: composites written to show what fleet owners commonly describe. Real field notes will replace them.",
  );
  await expect(c1.locator("p.assume")).toBeVisible();
  await expect(c1.locator("figure.quote")).toHaveCount(4);
  await expect(c1.locator("figure.quote .chip.wait")).toHaveText(["Illustrative", "Illustrative", "Illustrative", "Illustrative"]);
  await expect(c1.locator("figure.quote figcaption")).toHaveText([
    "Owner, 18 trucks, Jaipur",
    "Munshi, 30 trucks, Kishangarh",
    "Owner, 9 trucks, Ajmer",
    "Owner, 24 trucks, Bhiwandi",
  ]);
  await expect(c1).not.toContainText("Placeholder");
  await expect(c1).not.toContainText("ASSUMPTION");
});

// M-004 perf (EXE17): on a phone the poster sits inside the first viewport and is the LCP element,
// so it is eager, high priority and preloaded from <head> rather than lazy.
test("the poster is an eager, preloaded next/image in the 16:9 slot, served as a modern format", async ({ page }) => {
  await page.goto("/why");
  const img = page.locator("figure.w-scene img");
  await expect(img).not.toHaveAttribute("loading", "lazy");
  await expect(img).toHaveAttribute("fetchpriority", "high");
  await expect(page.locator('head link[rel="preload"][as="image"][imagesrcset*="truck-scene.png"]')).toHaveCount(1);
  await expect(img).toHaveAttribute("alt", "");
  await expect(img).toHaveAttribute("sizes", /.+/);
  await expect(img).toHaveAttribute("src", /\/_next\/image\?url=%2Ftruck-scene\.png/);
  const src = (await img.getAttribute("src"))!;
  const res = await page.request.get(src, { headers: { accept: "image/avif,image/webp,*/*" } });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/^image\/(avif|webp)$/);
  const box = (await page.locator("figure.w-scene").boundingBox())!;
  expect(box.width / box.height).toBeCloseTo(16 / 9, 1);
});

test("says what is simulated, with the fleet numbers, and that it isn't a Bytebeam product", async ({ page }) => {
  await page.goto("/why");
  const about = page.locator("section[aria-labelledby='c7'] .body > p");
  await expect(about).toContainText("Sharma Roadlines is fictional, and its 24 trucks and 30 days of trips are simulated.");
  await expect(about).toContainText("Nothing here is a Bytebeam product.");
});

test.describe("top bar on /why", () => {
  test("has Start the demo, no Ask trigger and no fleet chip", async ({ page }, info) => {
    await page.goto("/why");
    const bar = page.locator("header.topbar");
    await expect(bar.getByRole("link", { name: "Start the demo" })).toBeVisible();
    // EXE49: it opens the guided demo, whose first step is the 7 AM message.
    await expect(bar.getByRole("link", { name: "Start the demo" })).toHaveAttribute("href", "/demo");
    await expect(bar.locator(".askbar, .fleet")).toHaveCount(0);
    if (info.project.name !== "phone") {
      await expect(bar.locator('nav[aria-label="Main"] a[aria-current="page"]')).toHaveAttribute("aria-label", "Why Urja");
    }
  });

  test("gives the default bar back after a client-side move to Today", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "pills are hidden on the phone");
    await page.goto("/why");
    await expect(page.locator("header.topbar .btn")).toHaveCount(1);
    await page.locator('nav[aria-label="Main"]').getByRole("link", { name: "Today" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".askbar")).toBeVisible();
    await expect(page.locator(".fleet")).toBeVisible();
    await expect(page.locator("header.topbar .btn")).toHaveCount(0);
  });

  // EXE48: The bet makes the menu six destinations here (no Ask on /why).
  test("phone: the menu toggle, Start the demo and the hero CTAs are 44 px targets; the menu lists six destinations", async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "phone-only");
    await page.goto("/why");
    const toggle = page.locator('details.m-menu > summary[aria-label="Menu"]');
    const box = (await toggle.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    for (const btn of await page.locator("header.topbar .btn, .w-hero .actions .btn").all()) {
      expect((await btn.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await toggle.click();
    const menu = page.getByRole("navigation", { name: "Main (mobile)" });
    await expect(menu.getByRole("link")).toHaveText(["Morning brief", "Today", "Trucks", "Trips", "Why Urja", "The bet"]);
    await expect(menu.getByRole("link", { name: "Why Urja" })).toHaveAttribute("aria-current", "page");
  });
});
