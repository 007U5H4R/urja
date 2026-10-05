import localFont from "next/font/local";

/**
 * Design.md §12 typography, self-hosted (M-004 perf, EXE18). The same Inter (opsz, wght) and Anek
 * Devanagari (wght, wdth) that next/font/google served, as Google's own files, split so a page
 * downloads only the glyphs it draws. tests/fonts.test.ts checks that the faces' unicode-ranges
 * partition Google's exactly (plus ← →, which Google's subsets skip) and that the subsets draw
 * Google's glyphs.
 *
 * - `inter-core` (preloaded, 42 KB of Google's 73 KB latin file): ASCII except the symbols no page
 *   draws ($ * > @ \ ^ _ ` { | } ~, left on Google's file), and the copy's punctuation
 *   (nbsp ± · × – — ‘ ’ “ ” … −).
 * - `inter-rupee` (preloaded, 2 KB): ₹. Google keeps it in latin-ext (131 KB), so every page with
 *   a rupee fetched that file for one glyph.
 * - `inter-arrows` (3 KB): ← and →. Google's latin subset keeps ↑ ↓ but skips U+2190 and U+2192, so
 *   the route arrows ("Jaipur → Delhi", "168 → 130 L") fell back to Arial (DES-14). The file is
 *   Google's own `text=` cut of the same Inter build (4.001), byte for byte: the four arrows and the
 *   space. Its unicode-range takes only the two arrows Google left out, so ↑ ↓ stay with Google's
 *   latin face. (A cut that also carried the autohinter's Latin reference letters rendered the
 *   arrows pixel for pixel the same in Chromium on Linux, at three times the size.)
 * - `anek-plate` (25 KB of Google's 114 KB Anek latin file): the number plates' glyphs (space, 0–9
 *   and the fleet's series letters A B C G J R) as their own family, "Anek Plate", which only
 *   `.plate` and the 3D scene's plate use (--font-plate). Hindi text keeps the whole Anek Devanagari
 *   family, so its digits and punctuation still shape as one run. No English page loads Devanagari.
 * - Every other face is Google's file, byte for byte, with the code points it won in Google's CSS
 *   (the last declared face wins an overlap), so no two faces overlap and order does not matter.
 *
 * Pixel-identical, not just the same outlines: Chromium on Linux autohints these unhinted fonts, and
 * the autohinter reads the whole font. So each subset was cut with pyftsubset keeping every layout
 * feature, glyph names and every code point of the glyphs it keeps (`--glyphs` = the closure),
 * and the plate face also carries the Latin reference letters the autohinter measures (THEZOCQSLU,
 * o x z r e s c), mapped in the file but outside its unicode-range. Screenshots of /, /why, /brief,
 * /message and a trip page matched the next/font/google build pixel for pixel.
 *
 * next/font/local names a face after its variable unless `font-family` is declared, so every face
 * declares its family. The --font, --font-hi and --font-plate stacks start with the loader's own
 * (unused) name, then the real family, then the metric-matched fallbacks (app/globals.css).
 */

export const interCore = localFont({
  src: "./fonts/inter-core.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  variable: "--font",
  fallback: ["Inter", "Inter Fallback Arial", "Inter Fallback Roboto", "sans-serif"],
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+0-23,U+25-29,U+2B-3D,U+3F,U+41-5B,U+5D,U+61-7A,U+A0,U+B1,U+B7,U+D7,U+2013-2014,U+2018-2019,U+201C-201D,U+2026,U+2212" },
  ],
});

export const interRupee = localFont({
  src: "./fonts/inter-rupee.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+20B9" },
  ],
});

export const interArrows = localFont({
  src: "./fonts/inter-arrows.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+2190,U+2192" },
  ],
});

export const interLatin = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+24,U+2A,U+3E,U+40,U+5C,U+5E-60,U+7B-9F,U+A1-B0,U+B2-B6,U+B8-D6,U+D8-FF,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,U+2000-2012,U+2015-2017,U+201A-201B,U+201E-2025,U+2027-206F,U+20AC,U+2122,U+2191,U+2193,U+2215,U+FEFF,U+FFFD" },
  ],
});

export const interLatinExt = localFont({
  src: "./fonts/inter-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+100-130,U+132-151,U+154-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+20A0-20AB,U+20AD-20B8,U+20BA-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" },
  ],
});

export const interVietnamese = localFont({
  src: "./fonts/inter-vietnamese.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+300-301,U+303,U+309,U+323,U+1EA0-1EF1" },
  ],
});

export const interGreek = localFont({
  src: "./fonts/inter-greek.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+370-377,U+37A-37F,U+384-38A,U+38C,U+38E-3A1,U+3A3-3FF" },
  ],
});

export const interGreekExt = localFont({
  src: "./fonts/inter-greek-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+1F00-1FFF" },
  ],
});

export const interCyrillic = localFont({
  src: "./fonts/inter-cyrillic.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+400-45F,U+490-491,U+4B0-4B1,U+2116" },
  ],
});

export const interCyrillicExt = localFont({
  src: "./fonts/inter-cyrillic-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Inter" },
    { prop: "unicode-range", value: "U+460-48F,U+492-4AF,U+4B2-52F,U+1C80-1C8A,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F" },
  ],
});

export const anekPlate = localFont({
  src: "./fonts/anek-plate.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-plate",
  fallback: ["Anek Plate"],
  declarations: [
    { prop: "font-family", value: "Anek Plate" },
    { prop: "font-stretch", value: "75% 125%" },
    { prop: "unicode-range", value: "U+20,U+30-39,U+41-43,U+47,U+4A,U+52" },
  ],
});

export const anekLatin = localFont({
  src: "./fonts/anek-latin.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-hi",
  fallback: ["Anek Devanagari", "sans-serif"],
  declarations: [
    { prop: "font-family", value: "Anek Devanagari" },
    { prop: "font-stretch", value: "75% 125%" },
    { prop: "unicode-range", value: "U+0-FF,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" },
  ],
});

export const anekLatinExt = localFont({
  src: "./fonts/anek-latin-ext.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Anek Devanagari" },
    { prop: "font-stretch", value: "75% 125%" },
    { prop: "unicode-range", value: "U+100-130,U+132-151,U+154-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" },
  ],
});

export const anekDevanagari = localFont({
  src: "./fonts/anek-devanagari.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "font-family", value: "Anek Devanagari" },
    { prop: "font-stretch", value: "75% 125%" },
    { prop: "unicode-range", value: "U+900-97F,U+1CD0-1CF9,U+20F0,U+25CC,U+A830-A839,U+A8E0-A8FF,U+11B00-11B09" },
  ],
});
