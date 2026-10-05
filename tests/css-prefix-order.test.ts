import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// DES-2: in production the CSS minifier keeps only the last of `backdrop-filter` and
// `-webkit-backdrop-filter` when the prefixed one comes second, so `.glass` lost its blur in
// Chromium and Firefox. The standard declaration must never precede its -webkit- twin in a rule.
// (The built rule itself is checked in e2e/today.spec.ts against the production build.)

const root = path.resolve(__dirname, "..");

function cssFiles(dir: string): string[] {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return cssFiles(rel);
    return e.name.endsWith(".css") ? [rel] : [];
  });
}

/** Every innermost `{ … }` declaration block with its selector, comments removed. */
function rules(css: string): { selector: string; body: string }[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...src.matchAll(/([^{}]*)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2] }));
}

/** Rules where a standard property is followed by its own -webkit- form (which then wins). */
function standardBeforePrefixed(css: string, prop: string): string[] {
  return rules(css)
    .filter(({ body }) => {
      const names = body.split(";").map((d) => d.split(":")[0].trim());
      const std = names.indexOf(prop);
      return std >= 0 && names.indexOf(`-webkit-${prop}`) > std;
    })
    .map((r) => r.selector);
}

describe("vendor-prefix order (DES-2)", () => {
  it("the guard catches lamp.css's original order and passes the fixed one", () => {
    expect(standardBeforePrefixed(".glass { backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }", "backdrop-filter")).toEqual([".glass"]);
    expect(standardBeforePrefixed(".glass { -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); }", "backdrop-filter")).toEqual([]);
    expect(standardBeforePrefixed(".topbar { backdrop-filter: blur(14px); }", "backdrop-filter")).toEqual([]);
  });

  const files = [...cssFiles("app"), ...cssFiles("components")];

  it("finds the app's stylesheets", () => {
    expect(files).toContain(path.join("app", "globals.css"));
  });

  it.each(files)("%s never puts backdrop-filter before -webkit-backdrop-filter", (file) => {
    expect(standardBeforePrefixed(readFileSync(path.join(root, file), "utf8"), "backdrop-filter")).toEqual([]);
  });

  it(".glass keeps its standard backdrop-filter: blur(14px) saturate(1.15)", () => {
    const glass = rules(readFileSync(path.join(root, "app/globals.css"), "utf8")).find((r) => r.selector === ".glass")!;
    expect(glass.body).toMatch(/(^|;)\s*backdrop-filter:\s*blur\(14px\) saturate\(1\.15\)/);
  });
});
