/**
 * TASK-18 fix · the 3D scene's debug hooks (`window.__urjaGL`, `window.__urjaGLForce`) exist
 * only in a NEXT_PUBLIC_DEBUG_GL=1 build. next.config.ts inlines the flag at build time ("0"
 * unless it is exactly "1"), so the minifier strips the debug branch, and `pnpm check:bundle`
 * (CI, after a flagless `pnpm build`) fails if either name reaches .next/static.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEBUG_HOOK_PATTERNS, scanDebugHooks } from "../scripts/check-bundle";

describe("the debug flag is inlined at build time", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('is "0" when unset, so no runtime process.env lookup can turn it on', async () => {
    vi.stubEnv("NEXT_PUBLIC_DEBUG_GL", undefined as unknown as string);
    const { default: config } = await import("../next.config");
    expect(config.env?.NEXT_PUBLIC_DEBUG_GL).toBe("0");
  });

  it.each([["true"], ["yes"], ["01"], [""]])('is "0" for anything but "1" (%j)', async (v) => {
    vi.stubEnv("NEXT_PUBLIC_DEBUG_GL", v);
    const { default: config } = await import("../next.config");
    expect(config.env?.NEXT_PUBLIC_DEBUG_GL).toBe("0");
  });

  it('is "1" only when set to "1" (the e2e build)', async () => {
    vi.stubEnv("NEXT_PUBLIC_DEBUG_GL", "1");
    const { default: config } = await import("../next.config");
    expect(config.env?.NEXT_PUBLIC_DEBUG_GL).toBe("1");
  });
});

describe("scanDebugHooks", () => {
  it("names both hooks", () => {
    expect(DEBUG_HOOK_PATTERNS.map((p) => p.name)).toEqual(["__urjaGL", "__urjaGLForce"]);
  });

  it("finds each hook, and passes a clean bundle", () => {
    const dir = mkdtempSync(join(tmpdir(), "bundle-dbg-"));
    try {
      mkdirSync(join(dir, "chunks"));
      writeFileSync(join(dir, "chunks", "clean.js"), "let i=!1;console.log(i)");
      writeFileSync(join(dir, "chunks", "a.js"), "window.__urjaGL=a.glStats");
      writeFileSync(join(dir, "b.js"), "probe(!0===window.__urjaGLForce)");
      const { scanned, hits } = scanDebugHooks(dir);
      expect(scanned).toBe(3);
      expect(hits.map((h) => `${h.file}:${h.pattern}`).sort()).toEqual(["b.js:__urjaGL", "b.js:__urjaGLForce", "chunks/a.js:__urjaGL"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
