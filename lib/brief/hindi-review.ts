/**
 * Builds docs/exec/hindi-review.md (TKT-06 DoD): every Hindi string Urja
 * shows, beside its English, for the native-speaker review (HANDOFF open
 * item). The templates are rendered for 27 Sep; the variants, dictionaries,
 * place and driver names, and the flags' evidence lines follow.
 *
 * Regenerate after changing any Hindi string:
 *   UPDATE_HINDI_REVIEW=1 pnpm exec vitest run lib/brief/hindi-review.test.ts
 */
import { askShellData } from "@/components/ask/askScope";
import { ASK_CHIPS, ASK_COPY } from "@/components/ask/copy";
import { provenanceLine } from "@/components/ask/format";
import { MENU_COPY, menuLinks } from "@/components/shell/nav";
import { istMin } from "@/lib/clock";
import { YESTERDAY_DAY } from "@/lib/data/aggregates";
import { FLEET } from "@/lib/data/fleet";
import { getDataset, type ReadonlyFlag } from "@/lib/data/index";
import { PLACES } from "@/lib/data/places";
import { STRETCHES } from "@/lib/data/routes";
import { timeEn, timeHi } from "@/lib/data/rules/text";
import type { Bilingual } from "@/lib/data/types";
import { CONFIDENCE_WORDS, MONTHS_EN, MONTHS_HI, OWNER, TOWN_ENTRIES, town, WEEKDAYS_HI } from "./dict";
import {
  chartLabel,
  cleanRich,
  driverLine,
  itemsHead,
  messageClean,
  NO_EVIDENCE,
  messageIntro,
  previewTitle,
  r1Text,
  renderBrief,
  renderMessage,
  richToHtml,
  type BriefCopy,
  type MessageCopy,
  type R1Parts,
} from "./template";

type Row = [where: string, hi: string, en: string];

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function table(rows: readonly Row[]): string {
  const head = "| # | Where | Hindi | English | Reviewer |\n|---|---|---|---|---|";
  return [head, ...rows.map(([w, hi, en], i) => `| ${i + 1} | ${cell(w)} | ${cell(hi)} | ${cell(en)} | |`)].join("\n");
}

function briefRows(hi: BriefCopy, en: BriefCopy): Row[] {
  const rows: Row[] = [
    ["title", hi.title, en.title],
    ["h1 (screen readers)", hi.heading, en.heading],
    ["greeting", hi.greet, en.greet],
    ["date line", hi.date, en.date],
    ["earned label", hi.earned.label, en.earned.label],
    ["chart span", hi.earned.span, en.earned.span],
    ["14-day chart aria-label", hi.earned.chartLabel, en.earned.chartLabel],
    ["leak line (after the ₹)", hi.leak.text, en.leak.text],
    ["items heading", hi.itemsHead, en.itemsHead],
  ];
  hi.items.forEach((item, i) => {
    const e = en.items[i];
    rows.push(
      [`item ${i + 1} · ${item.plate}`, item.text, e.text],
      [`item ${i + 1} · confidence`, item.confidenceWord, e.confidenceWord],
      [`item ${i + 1} · driver`, item.status, e.status],
      [`item ${i + 1} · link`, item.go, e.go],
    );
  });
  rows.push(
    ["clean line", richToHtml(hi.clean ?? []), richToHtml(en.clean ?? [])],
    ["month card aria-label", hi.month.ariaLabel, en.month.ariaLabel],
    ["month card · flagged", hi.month.flaggedLabel, en.month.flaggedLabel],
    ["month card · recovered", hi.month.recoveredLabel, en.month.recoveredLabel],
    ["weekly chart aria-label", hi.month.weeksLabel, en.month.weeksLabel],
    ["weekly chart caption", hi.month.cap, en.month.cap],
    ["Ask dock · label", hi.ask.label, en.ask.label],
    ["Ask dock · placeholder", hi.ask.placeholder, en.ask.placeholder],
    ["Ask dock · button", hi.ask.button, en.ask.button],
    ["language toggle aria-label", "Language / भाषा", "Language / भाषा"],
  );
  return rows;
}

function messageRows(hi: MessageCopy, en: MessageCopy): Row[] {
  return [
    ["title", hi.title, en.title],
    ["h1 (screen readers)", hi.heading, en.heading],
    ["chat header", hi.account, en.account],
    ["day chip", hi.day, en.day],
    ["preview title", hi.preview.title, en.preview.title],
    ["preview meta", hi.preview.meta, en.preview.meta],
    ["headline", hi.headline, en.headline],
    ["intro", hi.intro, en.intro],
    ...hi.items.map((r, i): Row => [`item ${i + 1}`, richToHtml(r), richToHtml(en.items[i])]),
    ["clean line", hi.clean ?? "", en.clean ?? ""],
    ["open the brief (link and preview aria-label)", hi.open, en.open],
    ...hi.replies.map((r, i): Row => [`quick reply ${i + 1}`, r.text, en.replies[i].text]),
    ["caption", hi.caption, en.caption],
  ];
}

function variantRows(): Row[] {
  const [f] = getDataset().flags.filter((x) => x.rule === "R1");
  const as = (state: ReadonlyFlag["driverSide"]["state"]) => ({ ...f, driverSide: { state } }) as ReadonlyFlag;
  const both = (where: string, fn: (l: "hi" | "en") => string): Row => [where, fn("hi"), fn("en")];
  const clean24 = renderBrief("2026-09-24", "hi");
  const clean24en = renderBrief("2026-09-24", "en");
  const standing: R1Parts = {
    litres: f.litres ?? 0,
    place: f.placeId ? { hi: town(f.placeId, "hi"), en: town(f.placeId, "en") } : null,
    parked: false,
    at: f.at,
  };
  const msg24 = renderMessage("2026-09-24", "hi");
  const msg24en = renderMessage("2026-09-24", "en");
  const high = renderBrief(YESTERDAY_DAY, "hi", { onlyHigh: true });
  const highEn = renderBrief(YESTERDAY_DAY, "en", { onlyHigh: true });
  return [
    both("driver · confirmed", (l) => driverLine(as("confirmed"), l).status),
    both("driver · cleared", (l) => driverLine(as("cleared"), l).status),
    both("items heading · 1 item", (l) => itemsHead(1, l, false)),
    both("items heading · none", (l) => itemsHead(0, l, false)),
    both("items heading · none High (?only=high)", (l) => itemsHead(0, l, true)),
    ["?only=high · note", high.filter?.text ?? "", highEn.filter?.text ?? ""],
    ["?only=high · show all", high.filter?.showAll ?? "", highEn.filter?.showAll ?? ""],
    both("clean line · every trip adds up", (l) => richToHtml(cleanRich(17, 0, l) ?? [])),
    both("clean line · one trip left", (l) => richToHtml(cleanRich(17, 16, l) ?? [])),
    both("14-day chart · yesterday the highest", (l) => chartLabel([1, 2], l)),
    both("14-day chart · yesterday lower", (l) => chartLabel([400000, 300000, 200000, 100000], l)),
    ["date line · 24 Sep brief", clean24.date, clean24en.date],
    both("R1 while standing, ignition on (brief)", (l) => r1Text(standing, l, "brief")),
    both("R1 while standing, ignition on (message)", (l) => r1Text(standing, l, "message")),
    both("R1 with no town nearby (brief)", (l) => r1Text({ ...standing, place: null, parked: true }, l, "brief")),
    ["brief leak line · 24 Sep, nothing unaccounted", clean24.leak.text, clean24en.leak.text],
    ["message headline · 24 Sep, nothing unaccounted", msg24.headline, msg24en.headline],
    ["message intro · 24 Sep, no items", msg24.intro, msg24en.intro],
    ["message clean line · 24 Sep, every trip", msg24.clean ?? "", msg24en.clean ?? ""],
    both("preview title · top flag not diesel", (l) => previewTitle(false, l)),
    both("message intro · one trip, one item (agreement)", (l) => messageIntro(1, 1, l)),
    both("message clean line · one trip left (agreement)", (l) => messageClean(2, 1, l) ?? ""),
    ["fallback for a flag with no evidence line", NO_EVIDENCE.hi, NO_EVIDENCE.en],
  ];
}

function timeRows(): Row[] {
  // §5.3 boundaries: रात 9 PM–4 AM, सुबह 4 AM–12 PM, दोपहर 12–4 PM, शाम 4–9 PM.
  const at = (h: number, m = 0) => istMin(2026, 9, 27, h, m);
  return [
    [3, 59], [4, 0], [11, 59], [12, 0], [15, 59], [16, 0], [20, 59], [21, 0], [2, 14],
  ].map(([h, m]): Row => ["time", timeHi(at(h, m)), timeEn(at(h, m))]);
}

function dictionaryRows(): Row[] {
  const b = (where: string, x: Bilingual): Row => [where, x.hi, x.en];
  return [
    b("owner", OWNER),
    ...(["high", "likely", "check"] as const).map((c) => b(`confidence · ${c}`, CONFIDENCE_WORDS[c])),
    ...WEEKDAYS_HI.map((hi, i): Row => ["weekday", hi, WEEKDAYS_EN[i]]),
    ...MONTHS_HI.map((hi, i): Row => ["month", hi, MONTHS_EN[i]]),
    ...TOWN_ENTRIES.map(([id, name]) => b(`short name for ${id}`, name)),
  ];
}

function nameRows(): Row[] {
  return [
    ...PLACES.map((p): Row => [`place · ${p.id}`, p.name.hi, p.name.en]),
    ...Object.values(STRETCHES).map((s): Row => [`stretch · ${s.id}`, s.name.hi, s.name.en]),
    ...FLEET.map((t): Row => [`driver · ${t.plate}`, t.driver.name.hi, t.driver.name.en]),
  ];
}

function evidenceRows(): Row[] {
  const seen = new Set<string>();
  const rows: Row[] = [];
  const add = (where: string, x: Bilingual | undefined) => {
    if (!x || seen.has(x.hi)) return;
    seen.add(x.hi);
    rows.push([where, x.hi, x.en]);
  };
  const flags = [...getDataset().flags].sort((a, b) => a.rule.localeCompare(b.rule) || a.dayKey.localeCompare(b.dayKey) || a.id.localeCompare(b.id));
  for (const f of flags) {
    for (const e of f.evidence) add(`${f.rule} · ${f.tripId} · evidence (${e.source})`, e.text);
    add(`${f.rule} · ${f.tripId} · why this confidence`, f.whyConfidence);
    add(`${f.rule} · ${f.tripId} · driver's side`, f.driverSide.text);
  }
  return rows;
}

function menuRows(): Row[] {
  const en = menuLinks("en");
  return [
    ...menuLinks("hi").map((l, i): Row => [`item · ${l.href}`, l.label, en[i].label]),
    ["item · Ask", MENU_COPY.hi.ask, MENU_COPY.en.ask],
    ["menu button aria-label", MENU_COPY.hi.toggle, MENU_COPY.en.toggle],
    ["menu list aria-label", MENU_COPY.hi.nav, MENU_COPY.en.nav],
  ];
}

function askRows(): Row[] {
  const hi = ASK_COPY.hi;
  const en = ASK_COPY.en;
  const { scope } = askShellData();
  const prov = (model: string | null, ms: number) =>
    [provenanceLine({ scope: scope.hi, model, ms }, "hi"), provenanceLine({ scope: scope.en, model, ms }, "en")] as const;
  const withModel = prov("gemini-3.5-flash", 1800);
  const noModel = prov(null, 40);
  return [
    ["title (dialog name)", hi.title, en.title],
    ["close button aria-label", hi.close, en.close],
    ["input label (screen readers)", hi.inputLabel, en.inputLabel],
    ["input placeholder", hi.placeholder, en.placeholder],
    ["send button", hi.submit, en.submit],
    ["chips group aria-label", hi.suggestedLabel, en.suggestedLabel],
    ...ASK_CHIPS.hi.map((c, i): Row => [`chip ${i + 1} (the question it sends)`, c.text, ASK_CHIPS.en[i].text]),
    ["answering", hi.answering, en.answering],
    ["fallback banner", hi.fallbackBanner, en.fallbackBanner],
    ["saved banner (the fallback banner's first clause)", hi.savedBanner, en.savedBanner],
    ["error line", hi.error, en.error],
    ["429 line (12 s)", hi.retryAfter(12), en.retryAfter(12)],
    ["try again button", hi.retry, en.retry],
    ["cited trips aria-label", hi.citesLabel, en.citesLabel],
    ["cite chip (0926-04)", hi.citeChip("0926-04"), en.citeChip("0926-04")],
    ["provenance scope (from the data)", scope.hi, scope.en],
    ["provenance line · model answer", withModel[0], withModel[1]],
    ["provenance line · fallback answer", noModel[0], noModel[1]],
  ];
}

/** The whole review document. */
export function hindiReviewMarkdown(): string {
  const day = YESTERDAY_DAY;
  const sections: [string, string, Row[]][] = [
    ["1. Morning brief (/brief), 27 Sep", "lib/brief/template.ts `renderBrief`. `<b>` marks bold text.", briefRows(renderBrief(day, "hi"), renderBrief(day, "en"))],
    ["2. 7 AM message (/message), 27 Sep", "lib/brief/template.ts `renderMessage`.", messageRows(renderMessage(day, "hi"), renderMessage(day, "en"))],
    ["3. Template variants not shown on 27 Sep", "Other days, filters, driver states and the forms 27 Sep doesn't use.", variantRows()],
    ["4. Time words (§5.3)", "lib/data/rules/text.ts `timeHi`: रात 9 PM–4 AM, सुबह 4 AM–12 PM, दोपहर 12–4 PM, शाम 4–9 PM.", timeRows()],
    ["5. Dictionary", "lib/brief/dict.ts.", dictionaryRows()],
    ["6. Place, stretch and driver names", "lib/data/places.ts, lib/data/routes.ts, lib/data/fleet.ts.", nameRows()],
    ["7. Evidence lines on the flags", "Built by lib/data/rules/* with the lib/data/rules/text.ts helpers; every distinct line in the dataset.", evidenceRows()],
    ["8. Phone menu", "components/shell/nav.ts `menuLinks`, `MENU_COPY`: the menu on the Hindi /brief and /message (EXE23).", menuRows()],
    ["9. Ask drawer", "components/ask/copy.ts `ASK_COPY`, `ASK_CHIPS`; components/ask/askScope.ts: the drawer on the Hindi /brief and /message (EXE23).", askRows()],
  ];
  const total = sections.reduce((a, [, , r]) => a + r.length, 0);
  return [
    "# Hindi review (TKT-06)",
    "",
    "Every Hindi string Urja shows, beside its English, for a native speaker to check (HANDOFF open item).",
    "",
    "AI pre-review 2026-09-29 applied H1–H10; native review pending.",
    "",
    "- **Generated** by `lib/brief/hindi-review.ts`; don't edit by hand. Regenerate with",
    "  `UPDATE_HINDI_REVIEW=1 pnpm exec vitest run lib/brief/hindi-review.test.ts`.",
    "- **How to review:** write OK, or a better wording, in the Reviewer column. Keep numbers, `₹`, `L` and plates as they are.",
    "- **Wording rules:** say हिसाब नहीं मिल रहा (doesn't add up); never an accusation. Confidence words are पक्का / शायद / जाँचें.",
    `- **Strings:** ${total}.`,
    "",
    ...sections.flatMap(([title, note, rows]) => [`## ${title}`, "", note, "", table(rows), ""]),
  ].join("\n");
}
