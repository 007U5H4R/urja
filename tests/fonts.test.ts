import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * M-004 perf (EXE18): the self-hosted font faces in app/fonts.ts must render exactly what
 * next/font/google served before (Inter opsz+wght, Anek Devanagari wght+wdth), only in fewer bytes.
 * - Per family, the faces' unicode-ranges partition exactly the code points Google's faces covered,
 *   each code point staying with the Google face that won it (the last declared face wins overlaps).
 * - The new subsets (Inter core, Inter ₹, the Anek plate face) draw every glyph with the same outline
 *   and advance as the Google file it came from, and keep the variable axes. (fontkit can't
 *   instance a woff2, so variations were checked when the subsets were cut: gvar is copied
 *   per glyph, unchanged. The other faces are Google's files, byte for byte.)
 */

type FontkitFont = {
  familyName: string;
  variationAxes: Record<string, unknown>;
  hasGlyphForCodePoint(cp: number): boolean;
  glyphForCodePoint(cp: number): { path: { toSVG(): string }; advanceWidth: number };
};
// next/font/local's own font parser (the compiled fontkit Next ships); it reads woff2, gvar included.
const openFont = (createRequire(import.meta.url)("next/dist/compiled/@next/font/dist/fontkit") as { default: (buf: Buffer) => FontkitFont })
  .default;

const root = path.resolve(__dirname, "..");
const fontsTs = readFileSync(path.join(root, "app/fonts.ts"), "utf8");

// The unicode-range of each face next/font/google emitted for Inter (subsets cyrillic-ext …
// latin) and Anek Devanagari (devanagari, latin-ext, latin), in its CSS order.
const GOOGLE: Record<string, { file: string; range: string }[]> = {
  Inter: [
    { file: "inter-cyrillic-ext", range: "U+460-52F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F" },
    { file: "inter-cyrillic", range: "U+301,U+400-45F,U+490-491,U+4B0-4B1,U+2116" },
    { file: "inter-greek-ext", range: "U+1F00-1FFF" },
    { file: "inter-greek", range: "U+370-377,U+37A-37F,U+384-38A,U+38C,U+38E-3A1,U+3A3-3FF" },
    {
      file: "inter-vietnamese",
      range: "U+102-103,U+110-111,U+128-129,U+168-169,U+1A0-1A1,U+1AF-1B0,U+300-301,U+303-304,U+308-309,U+323,U+329,U+1EA0-1EF9,U+20AB",
    },
    {
      file: "inter-latin-ext",
      range:
        "U+100-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+304,U+308,U+329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    },
    {
      file: "inter-latin",
      range: "U+0-FF,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
  "Anek Devanagari": [
    { file: "anek-devanagari", range: "U+900-97F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+20F0,U+25CC,U+A830-A839,U+A8E0-A8FF,U+11B00-11B09" },
    {
      file: "anek-latin-ext",
      range:
        "U+100-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+304,U+308,U+329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    },
    {
      file: "anek-latin",
      range: "U+0-FF,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
};

/** The subsets cut for M-004, and the Google file each one's glyphs come from, per code point. */
const SUBSETS: Record<string, { family: string }> = {
  "inter-core": { family: "Inter" },
  "inter-rupee": { family: "Inter" },
  "anek-plate": { family: "Anek Devanagari" },
};

function parseRange(range: string): number[] {
  const out: number[] = [];
  for (const part of range.split(",")) {
    const [a, b] = part.trim().replace(/^U\+/i, "").split("-");
    for (let cp = parseInt(a, 16); cp <= parseInt(b ?? a, 16); cp++) out.push(cp);
  }
  return out;
}

interface Face {
  name: string;
  file: string;
  family: string;
  range: number[];
  preload: boolean;
  variable?: string;
  fallback?: string[];
}

function faces(): Face[] {
  const calls = [...fontsTs.matchAll(/export const (\w+) = localFont\(\{([\s\S]*?)\n\}\);/g)];
  return calls.map(([, name, body]) => {
    const str = (re: RegExp) => re.exec(body)?.[1];
    const fallback = str(/fallback: \[([^\]]*)\]/);
    return {
      name,
      file: str(/src: "\.\/fonts\/([\w-]+)\.woff2"/)!,
      family: str(/prop: "font-family", value: "([^"]+)"/)!,
      range: parseRange(str(/prop: "unicode-range", value: "([^"]+)"/)!),
      preload: str(/preload: (true|false)/) === "true",
      variable: str(/variable: "([^"]+)"/),
      fallback: fallback?.split(",").map((s) => s.trim().replace(/^"|"$/g, "")),
    };
  });
}

/** Which Google face served each code point: the last one declared that covers it. */
function googleWinner(family: string): Map<number, string> {
  const win = new Map<number, string>();
  for (const { file, range } of GOOGLE[family]) for (const cp of parseRange(range)) win.set(cp, file);
  return win;
}

const fontFile = (name: string) => path.join(root, "app/fonts", `${name}.woff2`);
const loaded = new Map<string, FontkitFont>();
const font = (name: string) => {
  if (!loaded.has(name)) loaded.set(name, openFont(readFileSync(fontFile(name))));
  return loaded.get(name)!;
};

describe("self-hosted font faces (M-004, EXE18)", () => {
  const all = faces();

  it("declares every face as Inter, Anek Devanagari or the plates' Anek Plate, from a file in app/fonts", () => {
    expect(all.length).toBe(13);
    for (const f of all) {
      expect(["Inter", "Anek Devanagari", "Anek Plate"]).toContain(f.family);
      expect(existsSync(fontFile(f.file)), f.file).toBe(true);
    }
  });

  it.each(Object.keys(GOOGLE))("%s: the faces split Google's code points exactly, each staying with its Google file", (family) => {
    const win = googleWinner(family);
    const mine = new Map<number, string>();
    for (const f of all.filter((x) => x.family === family)) {
      for (const cp of f.range) {
        expect(mine.has(cp), `U+${cp.toString(16)} is in two faces`).toBe(false);
        mine.set(cp, f.file);
      }
    }
    expect([...mine.keys()].sort((a, b) => a - b)).toEqual([...win.keys()].sort((a, b) => a - b));
    for (const [cp, file] of mine) {
      const google = win.get(cp)!;
      // A subset face may take code points from the Google file it was cut from.
      const from = file in SUBSETS ? null : file;
      if (from) expect(from, `U+${cp.toString(16)}`).toBe(google);
    }
  });

  it.each(Object.entries(SUBSETS))("%s draws each glyph exactly as Google's file did", (name, { family }) => {
    const face = all.find((f) => f.file === name)!;
    const win = googleWinner(family);
    const sub = font(name);
    // The name table is Google's too (Chromium reports it as the face's platform font name).
    expect(sub.familyName).toBe(font(GOOGLE[family].at(-1)!.file).familyName);
    let compared = 0;
    for (const cp of face.range) {
      const origin = font(win.get(cp)!);
      if (!origin.hasGlyphForCodePoint(cp) || cp < 0x20) continue;
      expect(sub.hasGlyphForCodePoint(cp), `U+${cp.toString(16)}`).toBe(true);
      const ga = sub.glyphForCodePoint(cp);
      const gb = origin.glyphForCodePoint(cp);
      expect(ga.path.toSVG(), `U+${cp.toString(16)}`).toBe(gb.path.toSVG());
      expect(ga.advanceWidth).toBe(gb.advanceWidth);
      compared++;
    }
    expect(compared).toBe(face.range.filter((cp) => cp >= 0x20 && font(win.get(cp)!).hasGlyphForCodePoint(cp)).length);
    expect(compared).toBeGreaterThan(0);
  });

  it("keeps the variable axes: Inter opsz and wght, Anek Devanagari wght and wdth", () => {
    for (const f of all) {
      const axes = Object.keys(font(f.file).variationAxes).sort();
      expect(axes, f.file).toEqual(f.family === "Inter" ? ["opsz", "wght"] : ["wdth", "wght"]);
    }
  });

  it("covers what Today and Why Urja draw in Inter with the two preloaded files", () => {
    expect(all.filter((f) => f.preload).map((f) => f.file)).toEqual(["inter-core", "inter-rupee"]);
    const core = all.find((f) => f.file === "inter-core")!;
    // ASCII and the punctuation in the copy, including the money minus (U+2212).
    for (const ch of "Your trucks earned 1,86,400 yesterday. −10,620 · doesn’t add up — “Why” … ± ×\u00a0") {
      expect(core.range, ch).toContain(ch.codePointAt(0));
    }
    expect(all.find((f) => f.file === "inter-rupee")!.range).toEqual([0x20b9]);
  });

  it("gives the plates their own small Anek family: the fleet's plate letters, digits and space", () => {
    const plate = all.find((f) => f.file === "anek-plate")!;
    expect(plate.family).toBe("Anek Plate");
    expect(String.fromCodePoint(...plate.range)).toBe(" 0123456789ABCGJR");
    // Anek Devanagari itself stays exactly Google's three faces (the partition test above).
    expect(all.filter((f) => f.family === "Anek Devanagari").map((f) => f.file).sort()).toEqual(["anek-devanagari", "anek-latin", "anek-latin-ext"]);
  });

  it("sets --font, --font-hi and --font-plate with the family names and the fallbacks", () => {
    const byVar = Object.fromEntries(all.filter((f) => f.variable).map((f) => [f.variable, f]));
    expect(Object.keys(byVar).sort()).toEqual(["--font", "--font-hi", "--font-plate"]);
    expect(byVar["--font"].fallback).toEqual(["Inter", "Inter Fallback Arial", "Inter Fallback Roboto", "sans-serif"]);
    expect(byVar["--font-hi"].fallback).toEqual(["Anek Devanagari", "sans-serif"]);
    expect(byVar["--font-plate"].fallback).toEqual(["Anek Plate"]);
  });
});

describe("font licences (SIL OFL 1.1 §2: the licence travels with every copy)", () => {
  it.each([
    ["OFL-Inter.txt", "The Inter Project Authors"],
    ["OFL-Anek.txt", "The Anek Project Authors"],
  ])("app/fonts/%s carries the copyright line and the full OFL 1.1 text", (file, authors) => {
    const p = path.join(process.cwd(), "app", "fonts", file);
    expect(existsSync(p)).toBe(true);
    const text = readFileSync(p, "utf8");
    expect(text).toContain(authors);
    expect(text).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(text).toContain("TERMINATION");
  });
});
