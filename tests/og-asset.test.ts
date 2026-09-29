/**
 * TC-050 (asset part), TKT-09 AC2: public/og.png, rendered by scripts/render-og.ts from
 * /og-card, is a 1200 × 630 PNG under 500 KB. Dimensions come from the IHDR chunk.
 *
 * og.png is a committed, static render: whenever app/og-card, lib/og.ts or the 0926-04 data
 * it reads changes, re-render it with `pnpm build && pnpm tsx scripts/render-og.ts` and commit
 * the new public/og.png. This test cannot tell a stale image from a fresh one.
 */
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PATH = join(__dirname, "..", "public", "og.png");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("public/og.png (technical-plan §9)", () => {
  it("is a PNG of exactly 1200 × 630", () => {
    const buf = readFileSync(PATH);
    expect(buf.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(buf.toString("ascii", 12, 16)).toBe("IHDR");
    expect({ width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }).toEqual({ width: 1200, height: 630 });
  });

  it("is under 500 KB", () => {
    expect(statSync(PATH).size).toBeLessThan(500_000);
  });
});
