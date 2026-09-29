import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

// TSK-06.4 · TKT-06 (TC-027, TC-022, TC-010 UI, TC-031): the Morning brief and the
// 7 AM message at 1440 / 768 / 375 (the three projects).

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Clicks until hydration has attached the handler, then waits for `done` (as shell.spec does). */
async function clickUntil(page: Page, name: string, done: () => Promise<void>) {
  await expect(async () => {
    await page.getByRole("button", { name, exact: true }).click();
    await done();
  }).toPass();
}

const SCROLL_PAGES = ["/brief", "/brief?lang=en", "/brief?only=high", "/message", "/message?lang=en"];

for (const path of SCROLL_PAGES) {
  test(`TC-022: no horizontal scroll and no console errors on ${path}`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    expect(errors).toEqual([]);
  });

  test(`TC-031: axe finds no serious or critical violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).analyze();
    const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}

test("TC-022: no text smaller than 12 px on /brief and /message", async ({ page }) => {
  for (const path of ["/brief", "/message"]) {
    await page.goto(path);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("main *, .dock *")]
        .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
        .filter((el) => (el as HTMLElement).offsetParent !== null && el.closest("svg") === null)
        .map((el) => ({ t: el.textContent!.trim().slice(0, 30), fs: parseFloat(getComputedStyle(el).fontSize) }))
        .filter((x) => x.fs < 12),
    );
    expect(small, path).toEqual([]);
  }
});

test.describe("TC-027 · language toggle", () => {
  test("/brief loads in Hindi by default, set in Anek Devanagari", async ({ page }) => {
    await page.goto("/brief");
    await expect(page).toHaveTitle("सुबह का हिसाब · Urja");
    const main = page.locator("main");
    await expect(main).toHaveAttribute("lang", "hi");
    await expect(main.locator(".greet")).toHaveText("सुप्रभात, शर्मा जी");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("सुबह का हिसाब");
    const font = await main.locator(".item .txt").first().evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font).toMatch(/Anek/i);
    await expect(page.locator(".dock")).toHaveAttribute("lang", "hi");
  });

  test("?lang=en renders English on first paint, before any script runs", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${baseURL}/brief?lang=en`);
    await expect(page).toHaveTitle("Morning brief · Urja");
    await expect(page.locator("main")).toHaveAttribute("lang", "en");
    await expect(page.locator("main .greet")).toHaveText("Good morning, Sharma ji");
    await page.goto(`${baseURL}/message?lang=en`);
    await expect(page).toHaveTitle("7 AM message · Urja");
    await expect(page.locator("main")).toHaveAttribute("lang", "en");
    await expect(page.locator(".bubble h3")).toHaveText("Yesterday: ₹1,86,400 earned · ₹11,430 doesn’t add up");
    await context.close();
  });

  test("switching to EN changes the copy, lang, title, aria-labels and URL; back to हिं restores them", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/brief");
    await page.waitForLoadState("networkidle");
    const serverHits: string[] = [];
    page.on("request", (r) => {
      if (new URL(r.url()).pathname.startsWith("/brief")) serverHits.push(r.url());
    });
    const main = page.locator("main");
    await clickUntil(page, "EN", () => expect(main).toHaveAttribute("lang", "en", { timeout: 500 }));
    await expect(page).toHaveURL(/\/brief\?lang=en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("Morning brief · Urja");
    await expect(main.locator(".greet")).toHaveText("Good morning, Sharma ji");
    await expect(page.getByRole("button", { name: "EN", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("img", { name: "Profit over the last 14 days; yesterday was one of the highest" })).toBeVisible();
    await expect(page.getByRole("region", { name: "September so far" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Ask Urja" })).toBeVisible();

    await clickUntil(page, "हिं", () => expect(main).toHaveAttribute("lang", "hi", { timeout: 500 }));
    await expect(page).toHaveURL(/\/brief$/);
    await expect(page).toHaveTitle("सुबह का हिसाब · Urja");
    await expect(page.getByRole("img", { name: "पिछले 14 दिन की कमाई, कल की कमाई सबसे ज़्यादा में से एक थी" })).toBeVisible();
    await expect(page.getByRole("region", { name: "सितंबर अब तक" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    // The toggle rewrites the URL in place: no server round trip for the copy.
    expect(serverHits).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("/message behaves the same way", async ({ page }) => {
    await page.goto("/message");
    await expect(page).toHaveTitle("सुबह 7 बजे का संदेश · Urja");
    const main = page.locator("main");
    await expect(main).toHaveAttribute("lang", "hi");
    await expect(page.getByRole("link", { name: "पूरा हिसाब देखें" }).first()).toHaveAttribute("href", "/brief");
    await clickUntil(page, "EN", () => expect(main).toHaveAttribute("lang", "en", { timeout: 500 }));
    await expect(page).toHaveURL(/\/message\?lang=en$/);
    await expect(page).toHaveTitle("7 AM message · Urja");
    await expect(page.locator(".bubble h3")).toHaveText("Yesterday: ₹1,86,400 earned · ₹11,430 doesn’t add up");
    await expect(page.getByRole("link", { name: "Open today’s brief" }).first()).toHaveAttribute("href", "/brief?lang=en");
  });
});

test.describe("the brief's items", () => {
  test("each item links to its trip, in eye order", async ({ page }) => {
    await page.goto("/brief?lang=en");
    const items = page.locator("a.panel.item");
    await expect(items).toHaveCount(3);
    await expect(items.locator(".plate")).toHaveText(["RJ14 GB 4521", "RJ14 GA 1182", "RJ14 GC 3309"]);
    await expect(items.locator(".amt")).toHaveText(["₹3,420", "₹4,500", "₹3,510"]);
    await expect(items.locator(".conf")).toHaveText(["High", "Likely", "Check"]);
    expect(await items.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual([
      "/trips/0926-04",
      "/trips/0927-02",
      "/trips/0926-11",
    ]);
    await items.first().click();
    await expect(page).toHaveURL(/\/trips\/0926-04$/);
  });

  test("?only=high shows only the High items, with a way back to all three", async ({ page }) => {
    await page.goto("/brief?only=high");
    const items = page.locator("a.panel.item");
    await expect(items).toHaveCount(1);
    await expect(items.locator(".conf")).toHaveText("पक्का");
    await expect(items).toHaveAttribute("href", "/trips/0926-04");
    await page.getByRole("link", { name: "सभी 3 देखें" }).click();
    await expect(page).toHaveURL(/\/brief$/);
    await expect(page.locator("a.panel.item")).toHaveCount(3);
  });

  test("TC-010 UI: 14 daily-profit bars, yesterday hot, 24 Sep the best day", async ({ page }) => {
    await page.goto("/brief");
    const chart = page.locator(".earned .chart");
    const bars = chart.locator("rect[fill^='url(#dim'], rect[fill^='url(#hot']");
    await expect(bars).toHaveCount(14);
    await expect(bars.nth(13)).toHaveAttribute("fill", /^url\(#hot/);
    const heights = await bars.evaluateAll((rs) => rs.map((r) => Number(r.getAttribute("height"))));
    // 24 Sep is bar 11 of 14 (₹1,94,800); 27 Sep is the last (₹1,86,400). Heights scale with ₹.
    expect(heights[10]).toBe(Math.max(...heights));
    expect(heights[10] / heights[13]).toBeCloseTo(194800 / 186400, 2);
    expect(heights[2] / heights[13]).toBeCloseTo(98000 / 186400, 2);
  });

  test("the month card and the weekly bricks", async ({ page }) => {
    await page.goto("/brief?lang=en");
    const month = page.getByRole("region", { name: "September so far" });
    await expect(month.locator(".v")).toHaveText(["₹58,240", "₹21,600"]);
    await expect(month.getByRole("img", { name: "Flagged and recovered, week by week" })).toBeVisible();
    await expect(page.locator(".earned .leak")).toHaveText("₹11,430 doesn’t add up · across 3 trips");
  });
});

test.describe("the 7 AM message", () => {
  test("the preview shows this deployment's host, never urja.app, and 0926-04's fuel trace", async ({ page, baseURL }) => {
    await page.goto("/message");
    const meta = page.locator(".pv-meta");
    await expect(meta).toContainText(new URL(baseURL!).hostname);
    await expect(meta).not.toContainText("urja.app");
    const bars = page.locator(".pv-art svg rect");
    // 0926-04 runs 575 min: one bar per 10 min, plus the last reading.
    await expect(bars).toHaveCount(59);
    const fills = await bars.evaluateAll((rs) => rs.map((r) => (r as SVGElement).style.fill));
    expect(fills.filter((f) => f === "var(--loss)").length).toBeGreaterThan(0);
    expect(fills.filter((f) => f === "var(--cream)").length).toBeGreaterThan(0);
  });

  test("the quick replies go to Ramesh's side of trip 0926-04 and to the High-only brief", async ({ page }) => {
    await page.goto("/message");
    await expect(page.getByRole("link", { name: "रमेश से पूछो" })).toHaveAttribute("href", "/trips/0926-04#driver");
    await page.getByRole("link", { name: "सिर्फ़ पक्के वाले" }).click();
    await expect(page).toHaveURL(/\/brief\?only=high$/);
    await expect(page.locator("a.panel.item")).toHaveCount(1);
  });

  test("Open today's brief lands on /brief", async ({ page }) => {
    await page.goto("/message");
    await page.locator("a.act").click();
    await expect(page).toHaveURL(/\/brief$/);
    await expect(page.locator("main")).toHaveAttribute("lang", "hi");
  });
});

test.describe("EXE12 · the phone screens keep their own top bar (its menu in the screen's language, EXE23)", () => {
  const MENU = {
    hi: { toggle: "मेनू", nav: "मुख्य मेनू", items: ["सुबह का हिसाब", "आज", "ट्रक", "ट्रिप", "Urja क्यों", "Urja से पूछें"], today: "आज" },
    en: { toggle: "Menu", nav: "Main (mobile)", items: ["Morning brief", "Today", "Trucks", "Trips", "Why Urja", "Ask Urja"], today: "Today" },
  } as const;
  const cases = [
    ["/brief", ".m-top", "hi"],
    ["/message", ".chat-top", "hi"],
    ["/brief?lang=en", ".m-top", "en"],
    ["/message?lang=en", ".chat-top", "en"],
  ] as const;
  for (const [path, bar, lang] of cases) {
    test(`${path} has no global top bar, and its own menu (${lang}) reaches every destination and Ask`, async ({ page }) => {
      const errors = collectErrors(page);
      const m = MENU[lang];
      await page.goto(path);
      await expect(page.locator("header.topbar")).toHaveCount(0);
      const toggle = page.locator(`${bar} details.m-menu > summary[aria-label="${m.toggle}"]`);
      await expect(toggle).toBeVisible();
      const menu = page.getByRole("navigation", { name: m.nav });
      await expect(async () => {
        if (!(await menu.isVisible())) await toggle.click();
        await expect(menu).toBeVisible({ timeout: 500 });
      }).toPass();
      await expect(menu).toHaveAttribute("lang", lang);
      await expect(menu.getByRole("link")).toHaveText([...m.items]);
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
      const axe = await new AxeBuilder({ page }).include(`${bar} details.m-menu`).analyze();
      expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
      await menu.getByRole("link", { name: m.today, exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("header.topbar")).toHaveCount(1);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      // Everywhere else the menu is English.
      await expect(page.locator("header.topbar details.m-menu > summary")).toHaveAttribute("aria-label", "Menu");
      expect(errors).toEqual([]);
    });
  }
});
