/**
 * TC-045 · after `pnpm build`, .next/static holds no GEMINI_API_KEY name,
 * no process.env.GEMINI read and no Google-key-shaped string. Without a build
 * the scan is skipped here; CI runs `pnpm check:bundle` after `pnpm build`.
 */
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanBundle } from "../scripts/check-bundle";

const STATIC = join(__dirname, "..", ".next", "static");

describe("TC-045 · no Gemini key in the client bundle", () => {
  it.skipIf(!existsSync(STATIC))(".next/static has no key name, env read or key-shaped string", () => {
    const { scanned, hits } = scanBundle(STATIC);
    expect(scanned).toBeGreaterThan(0);
    expect(hits).toEqual([]);
  });

  it.runIf(!existsSync(STATIC))("skips the build scan: no .next/static (run `pnpm build`; CI runs `pnpm check:bundle`)", () => {
    expect(existsSync(STATIC)).toBe(false);
  });

  it("the scanner catches each pattern", () => {
    const dir = mkdtempSync(join(tmpdir(), "bundle-"));
    try {
      mkdirSync(join(dir, "chunks"));
      writeFileSync(join(dir, "chunks", "clean.js"), "console.log('ok')");
      writeFileSync(join(dir, "chunks", "a.js"), `const k = process.env.${["GEMINI", "API", "KEY"].join("_")};`);
      writeFileSync(join(dir, "b.js"), `const k = "${["AI", "za", "Sy"].join("")}${"B".repeat(33)}";`);
      const { scanned, hits } = scanBundle(dir);
      expect(scanned).toBe(3);
      expect(hits.map((h) => `${h.file}:${h.pattern}`).sort()).toEqual([
        "b.js:Google key shape",
        "chunks/a.js:env var name",
        "chunks/a.js:process.env read",
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
