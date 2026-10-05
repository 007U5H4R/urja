import { expect, test, type Page } from "@playwright/test";

/**
 * M-004 performance fixes (technical-plan §1/§13, TC-055): English pages must not preload or
 * download the ~0.7 MB Anek Devanagari (Devanagari subset) file, Hindi pages must still render in
 * Anek Devanagari, and the metric-matched fallback stack must end in a sans-serif face so a
 * cold load never flashes the browser's default serif (CLS).
 */

/** The @font-face src URLs for `family`, keyed by whether the face covers Devanagari (U+0900). */
async function faceUrls(page: Page, family: string): Promise<{ deva: string[]; other: string[] }> {
  return page.evaluate((family) => {
    const deva: string[] = [];
    const other: string[] = [];
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const walk = (list: CSSRuleList) => {
        for (const r of [...list]) {
          if (r instanceof CSSFontFaceRule) {
            const fam = r.style.getPropertyValue("font-family").replace(/["']/g, "").trim();
            if (fam !== family) continue;
            const m = /url\(["']?([^"')]+)["']?\)/.exec(r.style.getPropertyValue("src"));
            if (!m) continue;
            const url = new URL(m[1], sheet.href ?? location.href).pathname;
            (/U\+900/i.test(r.style.getPropertyValue("unicode-range")) ? deva : other).push(url);
          } else if ("cssRules" in r) walk((r as CSSGroupingRule).cssRules);
        }
      };
      walk(rules);
    }
    return { deva, other };
  }, family);
}

async function loadAndCollectFonts(page: Page, path: string): Promise<string[]> {
  const fonts: string[] = [];
  page.on("request", (req) => {
    if (req.resourceType() === "font") fonts.push(new URL(req.url()).pathname);
  });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  return fonts;
}

for (const path of ["/", "/why"]) {
  test(`${path}: the Devanagari Anek file is neither preloaded nor downloaded`, async ({ page }) => {
    const fonts = await loadAndCollectFonts(page, path);
    const { deva } = await faceUrls(page, "Anek Devanagari");
    expect(deva.length).toBeGreaterThan(0);
    const preloads = await page.locator('head link[rel="preload"][as="font"]').evaluateAll((els) =>
      els.map((e) => new URL((e as HTMLLinkElement).href).pathname),
    );
    for (const url of deva) {
      expect(preloads).not.toContain(url);
      expect(fonts).not.toContain(url);
    }
  });
}

test("/brief (Hindi) downloads the Devanagari face and renders its text in Anek Devanagari", async ({ page }) => {
  const fonts = await loadAndCollectFonts(page, "/brief");
  const { deva } = await faceUrls(page, "Anek Devanagari");
  expect(fonts.some((f) => deva.includes(f))).toBe(true);
  const txt = page.locator("main .item .txt").first();
  await expect(txt).toBeVisible();
  // The face that actually painted the glyphs (not just the declared stack).
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: "main .item .txt" });
  const { fonts: used } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  // Chromium reports the variable font's named instance, e.g. "Anek Devanagari Medium".
  expect(used.some((f) => f.isCustomFont && /^Anek Devanagari/.test(f.familyName))).toBe(true);
});

test("the Inter and Anek stacks fall back to metric-matched faces, then sans-serif", async ({ page }) => {
  await page.goto("/why");
  const stacks = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return { font: cs.getPropertyValue("--font"), hi: cs.getPropertyValue("--font-hi") };
  });
  expect(stacks.font).toMatch(/Inter Fallback Arial/);
  expect(stacks.font).toMatch(/Inter Fallback Roboto/);
  expect(stacks.font.trim()).toMatch(/sans-serif$/);
  expect(stacks.hi.trim()).toMatch(/sans-serif$/);
});

// M-004 perf (EXE18): what Today and Why Urja fetch before they can paint.
const FIRST_LOAD = [
  // Today's plates are drawn in the small Anek plate face; nothing else of Anek.
  // Its route arrows (→) are drawn in the small Inter arrows face (DES-14).
  { path: "/", fonts: ["anek_plate", "inter_arrows", "inter_core", "inter_rupee"], stylesheets: 1 },
  { path: "/why", fonts: ["inter_core", "inter_rupee"], stylesheets: 2 },
];

for (const { path, fonts, stylesheets } of FIRST_LOAD) {
  test(`${path}: preloads only the Inter core and ₹ faces and downloads only ${fonts.join(" + ")}`, async ({ page }) => {
    const got = await loadAndCollectFonts(page, path);
    const preloads = await page.locator('head link[rel="preload"][as="font"]').evaluateAll((els) =>
      els.map((e) => new URL((e as HTMLLinkElement).href).pathname),
    );
    expect(preloads.map((p) => /\/media\/([a-z_]+)[.-]/.exec(p)?.[1]).sort()).toEqual(["inter_core", "inter_rupee"]);
    expect([...new Set(got.map((p) => /\/media\/([a-z_]+)[.-]/.exec(p)?.[1]))].sort()).toEqual(fonts);
  });

  test(`${path}: one site stylesheet, no inlined CSS, and no client image code`, async ({ page }) => {
    // The server's HTML (lazy chunks, like the Ask drawer's, add their own stylesheets later).
    const html = await (await page.request.get(path)).text();
    expect(html.match(/<link rel="stylesheet"/g) ?? []).toHaveLength(stylesheets);
    expect(html).not.toMatch(/<style[^>]*>[^<]*@layer/);
    await page.goto(path);
    const scripts = await page.locator("script[src]").evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).src));
    for (const src of scripts) {
      const body = await (await page.request.get(src)).text();
      expect(body, src).not.toContain("getImgProps");
    }
  });
}
