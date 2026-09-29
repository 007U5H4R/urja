import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// TKT-03 AC1 / TSK-03.1: the Lamplight tokens in app/globals.css equal
// Design.md §12 and final/lamp.css, value for value.

const root = path.resolve(__dirname, "..");
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

const globals = read("app/globals.css");
const lamp = read(".design/exploration/final/lamp.css");
const design = read("Design.md");

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Custom properties declared in the first top-level `:root { … }` block. */
function rootProps(css: string): Map<string, string> {
  const src = stripComments(css);
  const m = /(^|\n):root\s*\{([^}]*)\}/.exec(src);
  if (!m) throw new Error("no :root block");
  const props = new Map<string, string>();
  for (const decl of m[2].split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const name = decl.slice(0, i).trim();
    if (name.startsWith("--")) props.set(name, decl.slice(i + 1).trim().replace(/\s+/g, " "));
  }
  return props;
}

// Design.md §12, --bg through --plate, with chroma and hue from lamp.css.
const DESIGN_TOKENS: Record<string, string> = {
  "--bg": "oklch(0.130 0.003 60)",
  "--surface-1": "oklch(0.172 0.005 60)",
  "--surface-2": "oklch(0.212 0.006 60)",
  "--surface-3": "oklch(0.250 0.007 60)",
  "--line": "oklch(0.290 0.007 60)",
  "--line-soft": "oklch(0.225 0.006 60)",
  "--fg": "oklch(0.975 0.004 70)",
  "--fg-muted": "oklch(0.760 0.010 70)",
  "--fg-subtle": "oklch(0.625 0.010 70)",
  "--lamp": "oklch(0.705 0.166 53)",
  "--lamp-deep": "oklch(0.528 0.130 52)",
  "--cream": "oklch(0.935 0.045 75)",
  "--glow": "oklch(0.705 0.166 53 / 0.34)",
  "--glow-soft": "oklch(0.705 0.166 53 / 0.13)",
  "--loss": "oklch(0.690 0.190 27)",
  "--gain": "oklch(0.790 0.160 150)",
  "--plate": "oklch(0.870 0.165 95)",
};

// next/font owns these two (TSK-03.1): they are set on <html> by the font loaders.
const FONT_OWNED = new Set(["--font", "--font-hi", "--font-plate"]);

describe("Lamplight tokens (TKT-03 AC1)", () => {
  const tokens = rootProps(globals);

  it.each(Object.entries(DESIGN_TOKENS))("%s is %s", (name, value) => {
    expect(tokens.get(name)).toBe(value);
  });

  it("the golden list agrees with the Design.md §12 table", () => {
    const table = design.slice(design.indexOf("## 12. Design System"), design.indexOf("**Measured contrast"));
    const seen = new Set<string>();
    for (const line of table.split("\n")) {
      if (!line.startsWith("| `--")) continue;
      const [namesCell, valuesCell] = line.split("|").slice(1, 3).map((c) => c.trim());
      const names: string[] = [];
      for (const [, n] of namesCell.matchAll(/`(--[a-z0-9-/]+)`/g)) {
        const slash = /^(--[a-z-]+?)(\d)((?:\/\d)+)$/.exec(n);
        if (slash) {
          names.push(`${slash[1]}${slash[2]}`, ...slash[3].split("/").filter(Boolean).map((d) => `${slash[1]}${d}`));
        } else names.push(n);
      }
      if (valuesCell.startsWith("lamp at")) {
        // --glow / --glow-soft: "lamp at 34% / 13%"
        const pcts = [...valuesCell.matchAll(/(\d+)%/g)].map((p) => Number(p[1]) / 100);
        names.forEach((n, i) => {
          expect(DESIGN_TOKENS[n]).toBe(`${DESIGN_TOKENS["--lamp"].slice(0, -1)} / ${pcts[i].toFixed(2)})`);
          seen.add(n);
        });
        continue;
      }
      const values = valuesCell.split(" / ").map((v) => v.trim());
      expect(values).toHaveLength(names.length);
      names.forEach((n, i) => {
        expect(DESIGN_TOKENS[n], n).toBeDefined();
        expect(DESIGN_TOKENS[n].startsWith(`oklch(${values[i]}`), `${n} vs Design.md ${values[i]}`).toBe(true);
        seen.add(n);
      });
    }
    expect([...seen].sort()).toEqual(Object.keys(DESIGN_TOKENS).sort());
  });

  it("every other lamp.css :root token is ported unchanged", () => {
    for (const [name, value] of rootProps(lamp)) {
      if (FONT_OWNED.has(name)) continue;
      expect(tokens.get(name), name).toBe(value);
    }
  });

  it("the fonts come from next/font, not a Google Fonts @import", () => {
    expect(globals).not.toMatch(/fonts\.googleapis\.com/);
    expect(globals).not.toMatch(/@import\s+url\(/);
    for (const name of FONT_OWNED) expect(tokens.has(name), name).toBe(false);
    // M-004 (EXE18): Google's Inter and Anek Devanagari files, self-hosted through next/font/local
    // (app/fonts.ts; tests/fonts.test.ts checks the faces, their axes and their ranges).
    const layout = read("app/layout.tsx");
    const fonts = read("app/fonts.ts");
    expect(layout).toMatch(/import \{ anekLatin, anekPlate, interCore \} from "\.\/fonts";/);
    expect(layout).toMatch(/className=\{`\$\{interCore\.variable\} \$\{anekLatin\.variable\} \$\{anekPlate\.variable\}`\}/);
    expect(fonts).toMatch(/from "next\/font\/local"/);
    expect(fonts).not.toMatch(/from "next\/font\/google"/);
    expect(fonts).toMatch(/export const interCore = localFont\(\{[^)]*variable: "--font"/);
    expect(fonts).toMatch(/export const anekLatin = localFont\(\{[^)]*variable: "--font-hi"/);
    expect(fonts).toMatch(/export const anekPlate = localFont\(\{[^)]*variable: "--font-plate"/);
  });

  it("exposes the colour tokens to Tailwind through @theme", () => {
    const theme = /@theme\s+inline\s*\{([^}]*)\}/.exec(stripComments(globals));
    expect(theme).not.toBeNull();
    for (const name of Object.keys(DESIGN_TOKENS)) {
      expect(theme![1]).toContain(`--color-${name.slice(2)}: var(${name});`);
    }
  });
});
