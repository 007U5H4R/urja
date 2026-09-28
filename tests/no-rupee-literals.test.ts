/**
 * TC-021 (static part): components render view-model fields only, so no
 * shipped TS/TSX under components/ or app/ may type a rupee amount: no ₹ (or
 * its HTML entity or escape) followed by a digit in any string or JSX text,
 * and no number literal passed to an `inr` / `…Inr` prop. Tests are skipped.
 */
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { literalMoneyProps, sourceFiles, stringsIn } from "./helpers/source-scan";

const ROOT = join(__dirname, "..");
const RUPEE_AMOUNT = /(₹|&#8377;|&#x20b9;|\\u20b9)\s*\d/i;

function hitsIn(path: string, text: string): string[] {
  const strings = stringsIn(path, text)
    .filter((s) => RUPEE_AMOUNT.test(s.text) || RUPEE_AMOUNT.test(s.raw))
    .map((s) => s.raw);
  return [...strings, ...literalMoneyProps(path, text)];
}

describe("TC-021 · no ₹ literals in components", () => {
  it("finds no typed rupee amount in any TS/TSX under components/ or app/", () => {
    const all = ["components", "app"].flatMap((d) => sourceFiles(join(ROOT, d), [".ts", ".tsx"]));
    expect(all.length).toBeGreaterThan(10);
    const hits = all.flatMap((f) => hitsIn(f, readFileSync(f, "utf8")).map((h) => `${relative(ROOT, f)}: ${h}`));
    expect(hits).toEqual([]);
  });

  it("catches each way of typing an amount", () => {
    const R = "₹";
    const caught = (path: string, text: string) => hitsIn(path, text).length > 0;
    expect(caught("a.tsx", `export const C = () => <b>${R}1,86,400</b>;`)).toBe(true);
    expect(caught("a.tsx", `export const C = () => <b>${R} 3,420</b>;`)).toBe(true);
    expect(caught("a.tsx", "export const C = () => <b>&#8377;3,420</b>;")).toBe(true);
    expect(caught("a.tsx", "export const C = () => <b>&#x20B9;3,420</b>;")).toBe(true);
    expect(caught("a.ts", 'export const s = "\\u20b93,420";')).toBe(true);
    expect(caught("a.ts", `export const s = \`${R}\${1}9\`;`)).toBe(false);
    expect(caught("a.ts", `export const s = \`x ${R}9\${1}\`;`)).toBe(true);
    expect(caught("a.tsx", "export const C = () => <Money inr={186400} />;")).toBe(true);
    expect(caught("a.tsx", "export const C = () => <Row totalInr={-5} />;")).toBe(true);
    expect(caught("a.tsx", "export const C = ({ v }: { v: number }) => <Money inr={v} lit />;")).toBe(false);
    expect(caught("a.ts", `// ${R}1,000 in a comment\nexport const x = 1;`)).toBe(false);
  });
});
