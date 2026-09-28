/**
 * TC-012 · Determinism (§4.8): the dataset hashes the same across fresh
 * module loads, and nothing under lib/data or lib/brief reads the wall clock
 * or an unseeded random source.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it, vi } from "vitest";

const ROOT = join(__dirname, "..", "..");

async function freshDatasetHash(): Promise<string> {
  vi.resetModules();
  const { getDataset } = await import("./index");
  return createHash("sha256").update(JSON.stringify(getDataset())).digest("hex");
}

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx|js|mjs)$/.test(name) ? [p] : [];
  });
}

// Built from pieces so this file does not match its own patterns.
const BANNED: [label: string, re: RegExp][] = [
  ["Date" + ".now(", new RegExp("\\bDate\\s*\\.\\s*now\\s*\\(")],
  ["Math" + ".random(", new RegExp("\\bMath\\s*\\.\\s*random\\s*\\(")],
  ["new " + "Date()", new RegExp("\\bnew\\s+Date\\s*\\(\\s*\\)")],
];

describe("TC-012 · determinism", () => {
  it("two fresh loads of the dataset give the same SHA-256", async () => {
    const a = await freshDatasetHash();
    const b = await freshDatasetHash();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(b).toBe(a);
  }, 60_000);

  it("memoises the dataset per process", async () => {
    const { getDataset } = await import("./index");
    expect(getDataset()).toBe(getDataset());
  });

  it("finds no wall-clock or unseeded-random call under lib/data or lib/brief", () => {
    const files = [...sourceFiles(join(ROOT, "lib", "data")), ...sourceFiles(join(ROOT, "lib", "brief"))];
    expect(files.length).toBeGreaterThan(10);
    const hits = files.flatMap((f) => {
      const text = readFileSync(f, "utf8");
      return BANNED.filter(([, re]) => re.test(text)).map(([label]) => `${relative(ROOT, f)}: ${label}`);
    });
    expect(hits).toEqual([]);
  });

  it("the scan catches each banned call", () => {
    const planted = ["const t = Date" + ".now();", "const r = Math" + ".random();", "const d = new " + "Date();"];
    planted.forEach((src, i) => expect(BANNED[i][1].test(src)).toBe(true));
    expect(BANNED[2][1].test("new Date(EPOCH_UTC_MS)")).toBe(false);
  });
});
