/**
 * TASK-21 · guards for the SuprFleet "bet" section (docs/bet/bet-spec.md):
 *   - the data engine never depends on the bet: nothing under lib/data imports lib/bet or content/bet;
 *   - content/bet is pure copy: nothing under content/bet imports lib/data (lib/bet may: slug.ts reads FLEET);
 *   - lib/bet and content/bet are deterministic: no wall clock, no unseeded random;
 *   - every source id that content/bet cites exists in the source registry;
 *   - source titles, publishers and quotes pass the TC-014 wording rules.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isCited, sourceById, SOURCES, type Claim } from "@/content/bet/sources";
import { stringsIn } from "./helpers/source-scan";

const ROOT = join(__dirname, "..");

/** Every TS/TSX/JS file under `dir`, tests included. */
function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return filesUnder(p);
    return /\.(ts|tsx|js|mjs)$/.test(name) ? [p] : [];
  });
}

// ── 1. lib/data stays independent of the bet ─────────────────────────────
/** Module specifiers in `import … from`, `export … from`, `import()` and `require()`. */
function specifiers(text: string): string[] {
  const out: string[] = [];
  for (const re of [/\bfrom\s+["']([^"']+)["']/g, /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g, /^\s*import\s+["']([^"']+)["']/gm]) {
    for (const m of text.matchAll(re)) out.push(m[1]);
  }
  return out;
}

/** The repo-relative path a specifier points at, or null for a package. */
function target(file: string, spec: string): string | null {
  if (spec.startsWith("@/")) return spec.slice(2);
  if (spec.startsWith(".")) return relative(ROOT, resolve(dirname(file), spec)).split("\\").join("/");
  return null;
}

const BET_DIRS = /^(lib\/bet|content\/bet)(\/|$)/;

function betImports(file: string, text: string): string[] {
  return specifiers(text).filter((s) => BET_DIRS.test(target(file, s) ?? ""));
}

const DATA_DIR = /^lib\/data(\/|$)/;

function dataImports(file: string, text: string): string[] {
  return specifiers(text).filter((s) => DATA_DIR.test(target(file, s) ?? ""));
}

// ── 2. lib/bet and content/bet are deterministic ─────────────────────────────────────────
// Built from pieces so this file does not match its own patterns (as in lib/data/determinism.test.ts).
const BANNED: [label: string, re: RegExp][] = [
  ["Date" + ".now", new RegExp("\\bDate\\s*\\.\\s*now\\b")],
  ["Math" + ".random", new RegExp("\\bMath\\s*\\.\\s*random\\b")],
  ["new " + "Date()", new RegExp("\\bnew\\s+Date\\s*\\(\\s*\\)")],
];

// ── 3. every cited id resolves ──────────────────────────────────────────
/** Every string inside a `sourceIds: [...]` array or an `ids={[...]}` prop. */
function citedIds(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\b(?:sourceIds|ids)\s*[:=]\s*\{?\s*\[([^\]]*)\]/g)) {
    for (const s of m[1].matchAll(/["']([^"']+)["']/g)) out.push(s[1]);
  }
  return out;
}

// ── 4. wording ──────────────────────────────────────────────────────────
// The TC-014 pattern (tests/wording.test.ts, which also scans every string under content/).
const ACCUSATION = /\b(theft|thefts|thief|thieves|stolen|stole|steal|steals|stealing)\b|चोर|चुरा/i;

describe("TASK-21 · bet guards", () => {
  it("no file under lib/data imports lib/bet or content/bet", () => {
    const files = filesUnder(join(ROOT, "lib", "data"));
    expect(files.length).toBeGreaterThan(10);
    const hits = files.flatMap((f) => betImports(f, readFileSync(f, "utf8")).map((s) => `${relative(ROOT, f)}: ${s}`));
    expect(hits).toEqual([]);
  });

  it("the import scan catches each way of reaching the bet", () => {
    const f = join(ROOT, "lib", "data", "views", "x.ts");
    expect(betImports(f, 'import { a } from "@/lib/bet/slug";')).toHaveLength(1);
    expect(betImports(f, 'export * from "../../bet/fusion";')).toHaveLength(1);
    expect(betImports(f, 'const m = await import("../../../content/bet/sources");')).toHaveLength(1);
    expect(betImports(f, 'import "@/content/bet/copy";')).toHaveLength(1);
    expect(betImports(f, 'import { FLEET } from "../fleet";\nimport { x } from "@/lib/better";')).toEqual([]);
  });

  it("no file under content/bet imports lib/data", () => {
    const files = filesUnder(join(ROOT, "content", "bet"));
    expect(files.length).toBeGreaterThan(0);
    const hits = files.flatMap((f) => dataImports(f, readFileSync(f, "utf8")).map((s) => `${relative(ROOT, f)}: ${s}`));
    expect(hits).toEqual([]);
  });

  it("the content/bet import scan catches each way of reaching lib/data", () => {
    const f = join(ROOT, "content", "bet", "x.ts");
    expect(dataImports(f, 'import { FLEET } from "@/lib/data/fleet";')).toHaveLength(1);
    expect(dataImports(f, 'export * from "../../lib/data/aggregates";')).toHaveLength(1);
    expect(dataImports(f, 'const m = await import("../../lib/data");')).toHaveLength(1);
    expect(dataImports(f, 'import { x } from "@/lib/database";\nimport { formatINR } from "@/lib/format";')).toEqual([]);
  });

  it("nothing in lib/bet or content/bet reads the wall clock or an unseeded random source", () => {
    const files = [...filesUnder(join(ROOT, "lib", "bet")), ...filesUnder(join(ROOT, "content", "bet"))];
    expect(files.some((f) => f.includes(join("lib", "bet")))).toBe(true);
    expect(files.some((f) => f.includes(join("content", "bet")))).toBe(true);
    const hits = files.flatMap((f) => {
      const text = readFileSync(f, "utf8");
      return BANNED.filter(([, re]) => re.test(text)).map(([label]) => `${relative(ROOT, f)}: ${label}`);
    });
    expect(hits).toEqual([]);
  });

  it("the clock scan catches each banned call", () => {
    const planted = ["const t = Date" + ".now();", "const r = Math" + ".random;", "const d = new " + "Date( );"];
    planted.forEach((src, i) => expect(BANNED[i][1].test(src)).toBe(true));
    expect(BANNED.some(([, re]) => re.test("const d = new Date(EPOCH_UTC_MS);"))).toBe(false);
  });

  it("source ids are unique, kebab-case, and every entry is complete", () => {
    const ids = SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SOURCES.length).toBeGreaterThanOrEqual(25);
    for (const s of SOURCES) {
      expect(s.id, s.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(s.title.trim(), s.id).not.toBe("");
      expect(s.publisher.trim(), s.id).not.toBe("");
      expect(s.date.trim(), s.id).not.toBe("");
      expect(s.url, s.id).toMatch(/^https:\/\/[^\s]+$/);
      expect(["unverified", "verified"], s.id).toContain(s.status);
      // A verified source names when it was opened and the line it was checked against.
      if (s.status === "verified") {
        expect(s.accessed, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(s.quote?.trim(), s.id).toBeTruthy();
      }
    }
  });

  it("every source is unverified until the verification pass opens it (EXE41)", () => {
    expect(SOURCES.filter((s) => s.status !== "unverified").map((s) => s.id)).toEqual([]);
  });

  it("every source id referenced in content/bet exists in sources.ts", () => {
    const files = filesUnder(join(ROOT, "content", "bet"));
    expect(files.some((f) => f.endsWith("sources.ts"))).toBe(true);
    const known = new Set(SOURCES.map((s) => s.id));
    const refs = files.flatMap((f) => citedIds(readFileSync(f, "utf8")).map((id) => ({ f: relative(ROOT, f), id })));
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.filter((r) => !known.has(r.id)).map((r) => `${r.f}: ${r.id}`)).toEqual([]);
  });

  it("the reference scan reads sourceIds arrays and ids props", () => {
    expect(citedIds('const c = { text: "x", sourceIds: ["fastag-98", \'eway-bills\'] };')).toEqual(["fastag-98", "eway-bills"]);
    expect(citedIds('<Cite ids={["aa-fy25"]} />')).toEqual(["aa-fy25"]);
  });

  it("isCited and sourceById tell a cited claim from an assumption", () => {
    const cited: Claim = { text: "a", sourceIds: [SOURCES[0].id] };
    const assumed: Claim = { text: "b", assumption: true, basis: "c" };
    expect(isCited(cited)).toBe(true);
    expect(isCited(assumed)).toBe(false);
    expect(sourceById(SOURCES[0].id)).toBe(SOURCES[0]);
    expect(() => sourceById("no-such-source")).toThrow(/no-such-source/);
  });

  it("source titles, publishers and quotes pass the wording rules", () => {
    const hits = SOURCES.flatMap((s) =>
      [s.title, s.publisher, s.quote ?? ""].filter((t) => ACCUSATION.test(t)).map((t) => `${s.id}: ${t}`),
    );
    expect(hits).toEqual([]);
    // And as written in the file (escapes intact), the way TC-014 reads it.
    const file = join(ROOT, "content", "bet", "sources.ts");
    const raw = stringsIn(file, readFileSync(file, "utf8")).filter((s) => ACCUSATION.test(s.raw));
    expect(raw).toEqual([]);
  });
});
