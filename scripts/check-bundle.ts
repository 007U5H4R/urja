/**
 * TC-045 · the client bundle carries no Gemini key. Run after `pnpm build`
 * (CI: `pnpm check:bundle`): scans every file under .next/static for the env
 * var's name, for `process.env.GEMINI`, and for a Google-key-shaped string.
 * Exits 1 on a hit, or when there is no build to scan.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

// Assembled from pieces so this file never matches its own scan or the repo secret scan.
export const BUNDLE_PATTERNS: readonly { name: string; re: RegExp }[] = [
  { name: "env var name", re: new RegExp(["GEMINI", "_API", "_KEY"].join("")) },
  { name: "process.env read", re: new RegExp(["process", "\\.env", "\\.GEMINI"].join("")) },
  { name: "Google key shape", re: new RegExp(["AI", "za", "[0-9A-Za-z_\\-]{35}"].join("")) },
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

export interface BundleHit {
  file: string;
  pattern: string;
}

/** Every pattern hit under `dir` (e.g. `.next/static`); paths relative to `dir`. */
export function scanBundle(dir: string): { scanned: number; hits: BundleHit[] } {
  const all = files(dir);
  const hits: BundleHit[] = [];
  for (const f of all) {
    const text = readFileSync(f).toString("latin1");
    for (const p of BUNDLE_PATTERNS) if (p.re.test(text)) hits.push({ file: relative(dir, f), pattern: p.name });
  }
  return { scanned: all.length, hits };
}

function main(): void {
  const dir = resolve(process.argv[2] ?? ".next/static");
  if (!existsSync(dir)) {
    console.error(`check:bundle: ${dir} not found. Run \`pnpm build\` first.`);
    process.exit(1);
  }
  const { scanned, hits } = scanBundle(dir);
  if (hits.length > 0) {
    for (const h of hits) console.error(`check:bundle: ${h.pattern} in ${h.file}`);
    process.exit(1);
  }
  console.log(`check:bundle: ${scanned} files in .next/static, no Gemini key material.`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) main();
