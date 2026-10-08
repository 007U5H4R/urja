import { expect, test } from "./fixtures";
import { siteUrl } from "../lib/site";

/**
 * TC-050 (TKT-09 AC1): the server-rendered HTML of each page carries the full Open Graph and
 * Twitter set with absolute URLs. The build and this test share one environment, so the
 * expected origin is lib/site's siteUrl: http://localhost:3000 locally, https:// on Vercel.
 */

/** `canonical`: the page's og:url path when it differs from the request (a `?lang=` variant). */
type Route = { path: string; title: string; canonical?: string };

const ROUTES: Route[] = [
  { path: "/", title: "Today · Urja — Sharma Roadlines" },
  { path: "/why", title: "Why Urja · a concept for Bytebeam" },
  { path: "/trips/0926-04", title: "Trip 0926-04 · Urja — Sharma Roadlines" },
  { path: "/brief", title: "सुबह का हिसाब · Urja" },
  { path: "/brief?lang=en", title: "Morning brief · Urja", canonical: "/brief" },
  { path: "/message", title: "सुबह 7 बजे का संदेश · Urja" },
  // TASK-21: the bet section.
  { path: "/bet", title: "The bet: Munshi → credit · Urja" },
  { path: "/bet/tiers", title: "Tiers and who pays · Urja" },
  // TASK-32 (EXE49): the bet's other tabs.
  { path: "/bet/market", title: "Where we play · Urja" },
  { path: "/bet/product", title: "The product · Urja" },
  { path: "/bet/plan", title: "Roadmap, metrics and hypotheses · Urja" },
  { path: "/bet/artifacts", title: "Artifacts · Urja" },
  { path: "/trucks/rj14-gb-4521", title: "Truck RJ14 GB 4521 · Urja — Sharma Roadlines" },
];

const ALT = "Where did the diesel go? RJ14 GB 4521 lost 38 L near Behror at 2:14 AM — ₹3,420";

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

/** Every <meta property|name=… content=…> in the head, by key (first wins). */
function metaTags(html: string): Map<string, string> {
  const head = html.slice(0, html.indexOf("</head>"));
  const tags = new Map<string, string>();
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/g)) {
    const key = /\b(?:property|name)="([^"]+)"/.exec(tag)?.[1];
    const content = /\bcontent="([^"]*)"/.exec(tag)?.[1];
    if (key && content !== undefined && !tags.has(key)) tags.set(key, decode(content));
  }
  return tags;
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "server-rendered HTML is the same at every viewport");
});

for (const route of ROUTES) {
  test(`${route.path} carries the OG and Twitter tags with absolute URLs`, async ({ request }) => {
    const res = await request.get(route.path);
    expect(res.status()).toBe(200);
    const html = await res.text();
    const m = metaTags(html);
    // Next writes the root URL without its trailing slash.
    const path = route.canonical ?? route.path;
    const url = path === "/" ? siteUrl : new URL(path, siteUrl).href;

    expect(decode(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "")).toBe(route.title);
    expect(m.get("og:type")).toBe("website");
    expect(m.get("og:site_name")).toBe("Urja");
    expect(m.get("og:title")).toBe(route.title);
    expect(m.get("og:description")?.length).toBeGreaterThan(20);
    expect(m.get("description")).toBe(m.get("og:description"));
    expect(m.get("og:url")).toBe(url);
    expect(m.get("og:image")).toBe(`${siteUrl}/og.png`);
    expect(m.get("og:image:width")).toBe("1200");
    expect(m.get("og:image:height")).toBe("630");
    expect(m.get("og:image:alt")).toBe(ALT);
    expect(m.get("twitter:card")).toBe("summary_large_image");
    expect(m.get("twitter:title")).toBe(route.title);
    expect(m.get("twitter:description")).toBe(m.get("og:description"));
    expect(m.get("twitter:image")).toBe(`${siteUrl}/og.png`);
    expect(html).toContain(`<link rel="canonical" href="${url}"`);
    // Only /og-card is noindex; every shared page stays indexable.
    expect(m.get("robots")).toBeUndefined();

    for (const k of ["og:url", "og:image", "twitter:image"]) {
      expect(m.get(k), k).toMatch(/^https?:\/\/[^/]+(\/|$)/);
      // On a deployment (VERCEL_URL set) every URL is absolute https on the deployment host.
      if (process.env.VERCEL_URL) expect(m.get(k), k).toMatch(/^https:\/\//);
    }
  });
}

test("the OG image is served as a PNG", async ({ request }) => {
  const res = await request.get("/og.png");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
});

test("/og-card is noindex, has no top bar and is not linked from the nav", async ({ page, request }) => {
  const html = await (await request.get("/og-card")).text();
  expect(metaTags(html).get("robots")).toMatch(/noindex/);
  await page.goto("/og-card");
  await expect(page.locator("header.topbar")).toHaveCount(0);
  await expect(page.locator(".og h1")).toHaveText("Where did the diesel go?");
  await page.goto("/");
  await expect(page.locator('a[href="/og-card"]')).toHaveCount(0);
});
