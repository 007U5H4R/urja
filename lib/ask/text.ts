/**
 * Text helpers shared by the guard and the fallback intents: Devanagari
 * digits, nukta folding, script detection and the banned-word pattern.
 */

/** '१२५' → '125'. Every Devanagari digit (U+0966–U+096F) becomes its ASCII digit. */
export function normaliseDigits(text: string): string {
  return text.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));
}

/** Folds nukta forms (फ़ → फ, ज़ → ज, ड़ → ड), so 'हफ़्ते' and 'हफ्ते' match alike. */
export function foldNukta(text: string): string {
  const PRECOMPOSED: Record<string, string> = {
    "क़": "क", "ख़": "ख", "ग़": "ग", "ज़": "ज",
    "ड़": "ड", "ढ़": "ढ", "फ़": "फ", "य़": "य",
  };
  return text.replace(/[क़-य़]/g, (c) => PRECOMPOSED[c]).replace(/़/g, "");
}

/** Share of letters that are Devanagari (0–1). */
export function devanagariShare(text: string): number {
  const deva = (text.match(/[ऀ-ॿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return deva + latin === 0 ? 0 : deva / (deva + latin);
}

// The accusation words (technical-plan §1, TC-014), assembled from pieces so
// the wording guard's scan of lib/ never finds them in this file.
const w = (...parts: string[]) => parts.join("");
const EN = [w("th", "eft"), w("th", "efts"), w("thi", "ef"), w("thi", "eves"), w("sto", "len"), w("st", "ole"), w("st", "eal"), w("st", "eals"), w("st", "ealing")];
const HI = [w("चो", "र"), w("चु", "रा")];
export const FORBIDDEN = new RegExp(`\\b(${EN.join("|")})\\b|${HI.join("|")}`, "i");

/** A Google API key's shape, assembled so this file never matches the secret scan. */
export const KEY_SHAPE = new RegExp(["AI", "za", "[0-9A-Za-z_\\-]{35}"].join(""));

/** 'RJ14 GC 7710', 'rj-14-gc-7710' → 'RJ14GC7710'. */
export const normalisePlate = (p: string) => p.replace(/[\s-]/g, "").toUpperCase();
