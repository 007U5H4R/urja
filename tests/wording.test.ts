/**
 * TC-014 · Wording guard. Urja says "unaccounted" or "doesn't add up"; it
 * never accuses. This scans every string literal, template chunk and JSX text
 * in shipped source under lib/, components/, app/ and content/ (test files are
 * not shipped and are skipped), plus every JSON string there and in public/.
 */
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceFiles, stringsIn } from "./helpers/source-scan";

const ROOT = join(__dirname, "..");

// The guard's pattern (technical-plan §1, TC-014, widened in review). tests/ is not scanned.
// चुरा covers चुराया / चुराना / चुराई; चोर covers चोरी.
const ACCUSATION = /\b(theft|thefts|thief|thieves|stolen|stole|steal|steals|stealing)\b|चोर|चुरा/i;

function hitsIn(path: string, text: string): string[] {
  return stringsIn(path, text)
    .filter((s) => ACCUSATION.test(s.text) || ACCUSATION.test(s.raw))
    .map((s) => s.text);
}

describe("TC-014 · wording guard", () => {
  it("finds no accusation word in any string under lib/, components/, app/, content/ or public/", () => {
    const code = [".ts", ".tsx", ".js", ".mjs", ".json"];
    const all = [
      ...["lib", "components", "app", "content"].flatMap((d) => sourceFiles(join(ROOT, d), code)),
      ...sourceFiles(join(ROOT, "public"), [".json"]),
    ];
    expect(all.some((f) => f.endsWith("scenario.json"))).toBe(true);
    const hits = all.flatMap((f) => hitsIn(f, readFileSync(f, "utf8")).map((s) => `${relative(ROOT, f)}: ${JSON.stringify(s)}`));
    expect(hits).toEqual([]);
  });

  it("catches a planted word in each kind of string, in English and Hindi", () => {
    const w = (...parts: string[]) => parts.join("");
    const planted = (path: string, text: string) => hitsIn(path, text).length > 0;
    expect(planted("a.ts", `const a = "possible ${w("th", "eft")}";`)).toBe(true);
    expect(planted("a.ts", "const a = `x ${1} " + w("thie", "ves") + "`;")).toBe(true);
    expect(planted("a.ts", `const a = '${w("ste", "aling")} diesel';`)).toBe(true);
    expect(planted("a.ts", `const a = "${w("Ste", "al")}";`)).toBe(true);
    expect(planted("a.tsx", `export const C = () => <p>${w("चो", "री")} हुई</p>;`)).toBe(true);
    expect(planted("a.tsx", `export const C = () => <p title="${w("चु", "राना")}" />;`)).toBe(true);
    expect(planted("a.ts", `const a = "${w("चु", "राई")}";`)).toBe(true);
    expect(planted("a.json", JSON.stringify({ a: [{ b: w("sto", "len") }] }))).toBe(true);
    expect(planted("a.ts", `// ${w("th", "eft")} in a comment only\nconst a = "unaccounted";`)).toBe(false);
    expect(planted("a.ts", `const a = "Theftless stealthy";`)).toBe(false);
  });
});
