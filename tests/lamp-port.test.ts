import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// TSK-03.2 / TP4: lamp.css's base and component rules are ported verbatim into
// app/globals.css (@layer base / @layer components), class names and values unchanged.

const root = path.resolve(__dirname, "..");
const globals = readFileSync(path.join(root, "app/globals.css"), "utf8");
const lampLines = readFileSync(path.join(root, ".design/exploration/final/lamp.css"), "utf8").split("\n");

/** 1-based, inclusive, like an editor. */
const lampRange = (from: number, to = lampLines.length) => lampLines.slice(from - 1, to).join("\n");

const normalise = (css: string) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim();

/** The body of a top-level `@layer name { … }` block. */
function layerBody(css: string, name: string): string {
  const start = css.indexOf(`@layer ${name} {`);
  if (start < 0) throw new Error(`no @layer ${name}`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(css.indexOf("{", start) + 1, i);
  }
  throw new Error(`unclosed @layer ${name}`);
}

// Every deviation from a verbatim copy, and why (see the header of globals.css).
const SUBSTITUTIONS: [string, string][] = [
  // next/font owns the face names.
  ["font-family: 'Anek Devanagari', var(--font);", "font-family: var(--font-hi), var(--font);"],
  // the poster lives in public/ (technical-plan §3.3).
  ["url(assets/truck-scene.png)", "url(/truck-scene.png)"],
];

describe("lamp.css port (TSK-03.2)", () => {
  it("line 67 of lamp.css is the mockup banner, and it is not ported (§5.2)", () => {
    expect(lampLines[66]).toMatch(/^\.proto-banner/);
    expect(globals).not.toMatch(/\.proto-banner\s*\{/);
    expect(globals).not.toMatch(/DESIGN PROTOTYPE[^\n]*\{/);
  });

  it("the base styles (lamp.css 44–66) sit in @layer base, verbatim", () => {
    expect(normalise(layerBody(globals, "base"))).toBe(normalise(lampRange(44, 66)));
  });

  it("the component rules (lamp.css 68, 70–end) sit in @layer components, verbatim", () => {
    let expected = `${lampRange(68, 68)}\n${lampRange(70)}`;
    for (const [from, to] of SUBSTITUTIONS) {
      expect(expected, `substitution source ${from}`).toContain(from);
      expected = expected.split(from).join(to);
    }
    expect(normalise(layerBody(globals, "components"))).toBe(normalise(expected));
  });
});
