/**
 * The brief's dictionaries (technical-plan §5.3): the owner, the fleet, the
 * calendar in Hindi, confidence words, and the short place and driver names
 * the brief and the 7 AM message use. Place and driver names come from the
 * fleet and places data; this file only chooses the short form.
 */
import { truckByPlate } from "@/lib/data/fleet";
import { placeById } from "@/lib/data/places";
import type { Bilingual, Confidence, Lang, Plate } from "@/lib/data/types";
import { SHELL } from "@/lib/site-shell";

export type { Lang };

/** The fleet owner, as the brief addresses him. */
export const OWNER: Bilingual = { en: "Sharma ji", hi: "शर्मा जी" };

/** The fleet's name is a proper noun and stays in Latin script in both languages (final/message.html). */
export const FLEET_NAME: string = SHELL.fleetName;

/** §1: High / Likely / Check = पक्का / शायद / जाँचें. */
export const CONFIDENCE_WORDS: Record<Confidence, Bilingual> = {
  high: { en: "High", hi: "पक्का" },
  likely: { en: "Likely", hi: "शायद" },
  check: { en: "Check", hi: "जाँचें" },
};

/** 0 = Sunday … 6 = Saturday. */
export const WEEKDAYS_HI = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"] as const;

/** 1–12 → index 0–11. */
export const MONTHS_HI = [
  "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
] as const;

export const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/**
 * Short names for the places the brief mentions. A pump or a depot reads as
 * its town ("Kishangarh pump" → Kishangarh, "Okhla, Delhi" → Delhi), as the
 * mockup writes them. Anything not listed uses its own place name.
 */
const TOWN_OF: Readonly<Record<string, string | Bilingual>> = {
  "behror-pump": "behror",
  "kishangarh-pump": "kishangarh",
  "beawar-pump": "beawar",
  "udaipur-pump": "udaipur",
  "himmatnagar-pump": "himmatnagar",
  "vadodara-pump": "vadodara",
  "surat-pump": "surat",
  "neemrana-hp": { en: "Neemrana", hi: "नीमराना" },
  okhla: "delhi",
  "jaipur-tn": "jaipur",
};

/** Every short form the dictionary adds (for the Hindi review). */
export const TOWN_ENTRIES: readonly [string, Bilingual][] = Object.entries(TOWN_OF).map(([id, v]) => [
  id,
  typeof v === "string" ? placeById(v).name : v,
]);

/** A place's short name in one language. */
export function town(placeId: string, lang: Lang): string {
  const t = TOWN_OF[placeId];
  if (t === undefined) return placeById(placeId).name[lang];
  return typeof t === "string" ? placeById(t).name[lang] : t[lang];
}

/** The driver's first name: 'Ramesh' / 'रमेश'. */
export function driverFirstName(plate: Plate, lang: Lang): string {
  return truckByPlate(plate).driver.name[lang].split(/\s+/)[0];
}

/**
 * `?lang=` → the page language: English only when asked for, Hindi otherwise (Hindi first). A
 * repeated `lang` counts by its last value, as next.config.ts's rewrite matches it, so the page's
 * copy and its <html lang> (EXE23) never disagree. useLang's langOf reads the URL the same way.
 */
export function langParam(v: string | string[] | undefined): Lang {
  return (Array.isArray(v) ? v.at(-1) : v) === "en" ? "en" : "hi";
}
