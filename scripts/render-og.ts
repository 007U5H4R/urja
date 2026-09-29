/**
 * Renders public/og.png from /og-card (technical-plan §9, TSK-09.2).
 *
 *   pnpm build && pnpm tsx scripts/render-og.ts            # starts `next start` on a free port
 *   pnpm tsx scripts/render-og.ts --base-url http://localhost:3300   # or uses a running server
 *
 * Playwright's Chromium screenshots the card at 1200 × 630 with device scale factor 1, then
 * sharp (Next's own image dependency) recompresses the PNG. The file must stay under 500 KB;
 * if lossless recompression is not enough, it falls back to a 256-colour palette.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "og.png");
const WIDTH = 1200;
const HEIGHT = 630;
const MAX_BYTES = 500_000;

type Sharp = (input: Buffer) => { png(o: Record<string, unknown>): { toBuffer(): Promise<Buffer> } };

/** sharp ships with Next (its image optimiser); pnpm keeps it next to next, not at the root. */
function loadSharp(): Sharp {
  try {
    const fromRoot = createRequire(join(ROOT, "package.json"));
    return createRequire(fromRoot.resolve("next/package.json"))("sharp") as Sharp;
  } catch (err) {
    throw new Error(
      `sharp could not be loaded (${err instanceof Error ? err.message : err}). It normally comes with next; ` +
        "run `pnpm install` (or `pnpm add -D sharp`) and try again.",
    );
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
  });
}

/** Polls `url` until it answers 200; rejects at once if `exited` settles first. */
async function waitFor(url: string, exited: Promise<never>, ms = 60_000): Promise<void> {
  const until = performance.now() + ms;
  let dead: unknown = null;
  exited.catch((err) => (dead = err));
  while (performance.now() < until) {
    if (dead) throw dead;
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} did not come up within ${ms / 1000} s`);
}

function stop(child: ChildProcess): void {
  if (child.pid === undefined || child.exitCode !== null) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

async function startServer(): Promise<{ baseUrl: string; child: ChildProcess }> {
  if (!existsSync(join(ROOT, ".next", "BUILD_ID"))) throw new Error("No production build: run `pnpm build` first.");
  const port = await freePort();
  // node + next's own bin (no shell shim), in its own process group so stop() takes any workers too.
  const nextBin = createRequire(join(ROOT, "package.json")).resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: ROOT,
    stdio: "ignore",
    detached: true,
  });
  const exited = new Promise<never>((_, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => reject(new Error(`next start exited early (code ${code}, signal ${signal})`)));
  });
  exited.catch(() => {}); // the rejection after a normal kill is expected
  const baseUrl = `http://localhost:${port}`;
  try {
    await waitFor(`${baseUrl}/og-card`, exited);
  } catch (err) {
    stop(child);
    throw err;
  }
  return { baseUrl, child };
}

async function screenshot(baseUrl: string): Promise<Buffer> {
  const executablePath = process.env.PW_CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    await page.goto(`${baseUrl}/og-card`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((img) => (img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true })))),
      );
    });
    const box = await page.locator(".og").boundingBox();
    if (!box || box.x !== 0 || box.y !== 0 || box.width !== WIDTH || box.height !== HEIGHT) {
      throw new Error(`.og is not a ${WIDTH}×${HEIGHT} box at the page origin: ${JSON.stringify(box)}`);
    }
    return await page.screenshot({ type: "png", animations: "disabled", clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  } finally {
    await browser.close();
  }
}

async function compress(raw: Buffer): Promise<Buffer> {
  const sharp = loadSharp();
  const lossless = await sharp(raw).png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true }).toBuffer();
  if (lossless.length < MAX_BYTES) return lossless;
  const palette = await sharp(raw).png({ palette: true, colours: 256, quality: 100, dither: 1, compressionLevel: 9, effort: 10 }).toBuffer();
  if (palette.length < MAX_BYTES) return palette;
  throw new Error(`og.png is ${palette.length} bytes even with a palette; the limit is ${MAX_BYTES}`);
}

async function main() {
  const i = process.argv.indexOf("--base-url");
  const given = i > 0 ? process.argv[i + 1] : undefined;
  if (i > 0 && (!given || given.startsWith("--"))) throw new Error("--base-url needs a value, e.g. --base-url http://localhost:3300");
  const server = given ? null : await startServer();
  try {
    const raw = await screenshot(given ?? server!.baseUrl);
    const png = await compress(raw);
    writeFileSync(OUT, png);
    console.log(`Wrote public/og.png: ${WIDTH}×${HEIGHT}, ${png.length} bytes (screenshot ${raw.length} bytes)`);
  } finally {
    if (server) stop(server.child);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
