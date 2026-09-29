import { expect, test, type Page } from "./fixtures";

/**
 * EXE23 (accessibility): the server-rendered document names the page's language. The phone
 * screens are Hindi by default and English for `?lang=en`, so their `<html lang>` must say so on
 * first paint, before (and without) any script; every other page is English. JavaScript is off
 * in these contexts, so nothing a client effect sets can pass the checks. The pages' language
 * comes from the server alone, so one project covers it.
 */

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "desktop", "server HTML: the same at every width");
});

const LANGS: [string, "hi" | "en"][] = [
  ["/brief", "hi"],
  ["/brief?lang=en", "en"],
  ["/message", "hi"],
  ["/message?lang=en", "en"],
  ["/brief?only=high", "hi"],
  ["/brief?only=high&lang=en", "en"],
  ["/brief?lang=english", "hi"],
  // A repeated ?lang= counts by its last value, on <html> and in the copy alike.
  ["/brief?lang=en&lang=hi", "hi"],
  ["/brief?lang=hi&lang=en", "en"],
  ["/message?lang=en&lang=hi", "hi"],
  ["/message?lang=hi&lang=en", "en"],
  ["/", "en"],
  ["/why", "en"],
  ["/trips/0926-04", "en"],
];

async function noJs(browser: import("@playwright/test").Browser, run: (page: Page) => Promise<void>) {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    await run(await context.newPage());
  } finally {
    await context.close();
  }
}

test("each page's server HTML carries its language on <html>, with scripts off", async ({ browser, baseURL }) => {
  await noJs(browser, async (page) => {
    for (const [path, lang] of LANGS) {
      const res = await page.goto(`${baseURL}${path}`);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("html"), path).toHaveAttribute("lang", lang);
      // The document and its content agree: a page's <main> names no other language than <html>.
      const mainLang = await page.locator("main").first().getAttribute("lang");
      expect(mainLang ?? lang, `${path} <main lang>`).toBe(lang);
      // The address bar keeps the public URL: the language route is internal.
      expect(new URL(page.url()).pathname + new URL(page.url()).search, path).toBe(path);
    }
  });
});

test("the phone screens keep their query options with scripts off", async ({ browser, baseURL }) => {
  await noJs(browser, async (page) => {
    await page.goto(`${baseURL}/brief?only=high`);
    await expect(page.locator("main")).toHaveAttribute("lang", "hi");
    await expect(page.locator("a.panel.item")).toHaveCount(1);
    await expect(page.locator("header.topbar")).toHaveCount(0);

    await page.goto(`${baseURL}/brief?state=loading`);
    await expect(page.locator("main.st-view")).toHaveAttribute("lang", "en");
    await expect(page.locator(".p-brief .earned")).toHaveCount(0);

    await page.goto(`${baseURL}/message?lang=en`);
    await expect(page.locator("main")).toHaveAttribute("lang", "en");
    await expect(page.locator("header.topbar")).toHaveCount(0);
  });
});

test("the internal language paths never serve a second copy of a phone screen", async ({ page, baseURL }) => {
  for (const [path, to] of [
    ["/en/brief", "/brief?lang=en"],
    ["/en/message", "/message?lang=en"],
    ["/en/brief?only=high", "/brief?only=high&lang=en"],
  ] as const) {
    const res = await page.request.get(`${baseURL}${path}`, { maxRedirects: 0 });
    expect(res.status(), path).toBe(307);
    const loc = new URL(res.headers()["location"], baseURL);
    expect(loc.pathname + loc.search, path).toBe(to);
  }
  for (const path of ["/hi/brief", "/hi/message", "/xx/brief", "/en", "/en/why"]) {
    const res = await page.goto(`${baseURL}${path}`);
    expect(res?.status(), path).toBe(404);
    await expect(page.getByRole("heading", { level: 1 }), path).toHaveText("There’s no page at this address.");
  }
});

test("the 404 page is English, with the top bar, with scripts off", async ({ browser, baseURL }) => {
  await noJs(browser, async (page) => {
    const res = await page.goto(`${baseURL}/no-such-page`);
    expect(res?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("header.topbar")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("There’s no page at this address.");
  });
});

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test("with scripts, the English phone screens hydrate cleanly and move between each other in English", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/message?lang=en");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "Open today’s brief" }).first().click();
  await expect(page).toHaveURL(/\/brief\?lang=en$/);
  await expect(page.locator("main .greet")).toHaveText("Good morning, Sharma ji");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.waitForLoadState("networkidle");
  // The phone menu marks the brief as the current page, the same on the server and the client.
  const menu = page.locator("details.m-menu").first();
  await expect(menu.locator('a[aria-current="page"]')).toHaveAttribute("href", "/brief");
  expect(errors).toEqual([]);
});

async function clickUntil(page: Page, name: string, done: () => Promise<void>) {
  await expect(async () => {
    await page.getByRole("button", { name, exact: true }).click();
    await done();
  }).toPass();
}

test("with scripts, /message switched to English opens the brief in English, <html lang> and all", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/message");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  const main = page.locator("main");
  await clickUntil(page, "EN", () => expect(main).toHaveAttribute("lang", "en", { timeout: 500 }));
  await expect(page).toHaveURL(/\/message\?lang=en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "Open today’s brief" }).first().click();
  await expect(page).toHaveURL(/\/brief\?lang=en$/);
  await expect(page.locator("main .greet")).toHaveText("Good morning, Sharma ji");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(errors).toEqual([]);
});

/** The pathnames of the RSC (client navigation or prefetch) requests the page makes. */
function rscRequests(page: Page): string[] {
  const paths: string[] = [];
  page.on("request", (r) => {
    if (r.headers()["rsc"] === "1") paths.push(new URL(r.url()).pathname);
  });
  return paths;
}

test("links that cross root layouts are not prefetched; links within one still are", async ({ page }) => {
  const rsc = rscRequests(page);
  // The brief's items open trip pages (the site's root layout): a full page load, so no prefetch.
  await page.goto("/brief");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("a.panel.item").first()).toBeVisible();
  expect(rsc.filter((p) => p.startsWith("/trips")), "/brief").toEqual([]);

  // The message's replies open a trip; its brief links stay within the phone screens.
  rsc.length = 0;
  await page.goto("/message");
  await page.waitForLoadState("networkidle");
  expect(rsc.filter((p) => p.startsWith("/trips")), "/message").toEqual([]);
  await expect.poll(() => rsc.filter((p) => p === "/brief").length, { message: "/message prefetches /brief" }).toBeGreaterThan(0);

  // Why Urja's "Start the demo" opens /message (the phone screens' root layout).
  rsc.length = 0;
  await page.goto("/why");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("link", { name: "Start the demo" })).toBeVisible();
  expect(rsc.filter((p) => p === "/message"), "/why").toEqual([]);
  // Its top-bar pills stay within the site and are prefetched as before.
  await expect.poll(() => rsc.filter((p) => p === "/").length, { message: "/why prefetches /" }).toBeGreaterThan(0);
});
