import { test as base, expect, type Page, type Route } from "@playwright/test";

/**
 * The shared Playwright `test` for every spec. An auto-fixture serves an offline map style in
 * place of Carto, so pages with a live map (the Today hero's Map and Fleet views, every trip
 * page) load their map without the network and log nothing when Carto is unreachable or its
 * certificate isn't trusted (the sandbox browser doesn't trust the egress proxy's CA; TLS
 * verification is never turned off). Tests tagged @tiles get the real Carto instead.
 * A test's own `page.route` for Carto wins: Playwright runs the last-registered handler first.
 */

/** A style with no sources: MapLibre fires `load` at once, and no tile is requested. */
export const OFFLINE_STYLE = JSON.stringify({
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#111" } }],
});

export async function serveOfflineMaps(page: Page) {
  // The style (basemaps.cartocdn.com) and, should anything ask, tiles, sprites and glyphs
  // (tiles.basemaps.cartocdn.com and its a–d shards), answered as empty.
  await page.route("**/basemaps.cartocdn.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: OFFLINE_STYLE }));
  await page.route(/^https:\/\/tiles(-[a-d])?\.basemaps\.cartocdn\.com\//, (r) => r.fulfill({ status: 204, body: "" }));
}

export const test = base.extend<{ offlineMaps: void }>({
  offlineMaps: [
    async ({ page }, use, testInfo) => {
      if (!testInfo.tags.includes("@tiles")) await serveOfflineMaps(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect, type Page, type Route };
