/**
 * The Ask Urja eval scorer (evaluation-plan §4). Deterministic and pure: it
 * takes a dataset case, the /api/ask response and the allowed-number set from
 * the Ask context, and returns `{pass, checks, notes}`.
 *
 * Its text extraction is written here, independently of lib/ask/guard.ts, so
 * the eval stays an oracle for the guard. The one thing it shares with the app
 * is `allowedNumbers(context)` (technical-plan §6.2), which the caller passes in.
 */

// ── Dataset types (evals/eval-dataset.json) ─────────────────────────────
export type Fact =
  | { type: "inr" | "litres" | "number" | "count" | "percent"; value: number }
  | { type: "plate" | "trip" | "time"; value: string }
  | { type: "text"; any: string[] }
  | { type: "any_of"; facts: Fact[] };

export type ExpectedLang = "hi" | "en" | "hinglish" | "any";

export interface EvalCase {
  id: string;
  kind: "prepared" | "offtopic";
  input: { question: string; lang?: "hi" | "en" };
  required_facts: Fact[];
  expected_sources: string[];
  min_sources: number;
  max_sources?: number;
  expected_lang: ExpectedLang;
  out_of_scope: boolean;
  must_refuse?: boolean;
  forbidden_in_answer?: string[];
  [extra: string]: unknown;
}

export interface EvalGate {
  prepared_total: number;
  prepared_min_pass: number;
  offtopic_total: number;
  offtopic_min_pass: number;
  latency_p50_ms_max: number;
  forbidden_hits_max: number;
  unsupported_numbers_max_on_passing_cases: number;
}

export interface EvalDataset {
  dataset: string;
  version: string;
  context: { prompt_version: string; canary: string; [k: string]: unknown };
  gate: EvalGate;
  forbidden_patterns: string[];
  refusal_patterns: string[];
  cases: EvalCase[];
}

/** The parts of an AskResponse (technical-plan §6.1) the scorer reads. */
export interface AskResponseLike {
  mode: string;
  answer: string;
  lang: string;
  cites: { tripId: string; label?: string }[];
  /** Not in AskResponse today; honoured if the API ever returns it (§4.7). */
  out_of_scope?: boolean;
  [extra: string]: unknown;
}

export interface ScoreContext {
  allowed: ReadonlySet<number>;
  tripIds: ReadonlySet<string>;
  forbidden: RegExp[];
  refusal: RegExp[];
  canary: string;
}

export type CheckName = "facts" | "grounding" | "cites" | "lang" | "forbidden" | "refusal";

export interface CaseScore {
  id: string;
  pass: boolean;
  /** `refusal` is present only on off-topic cases. */
  checks: Partial<Record<CheckName, boolean>> & Record<Exclude<CheckName, "refusal">, boolean>;
  notes: string[];
  /** ₹ and litre figures that are neither allowed nor in the question. */
  unsupported: number[];
  /** Forbidden words found: one per position where any of the dataset's forbidden_patterns matches. */
  forbiddenHits: number;
  /** Canary, system-prompt fragment or key-shaped string matches. */
  leaks: number;
  /** A key-shaped string appears in the answer (a gate failure on any case). */
  keyLeak: boolean;
  detectedLang: "hi" | "en" | "hinglish";
}

/** Builds the scoring context from the dataset and the Ask context bundle (`getAskContext()`). */
export function scoringContext(
  dataset: Pick<EvalDataset, "forbidden_patterns" | "refusal_patterns" | "context">,
  bundle: { allowed: ReadonlySet<number>; tripIds: ReadonlySet<string> },
): ScoreContext {
  return {
    allowed: bundle.allowed,
    tripIds: bundle.tripIds,
    forbidden: dataset.forbidden_patterns.map((p) => new RegExp(p, "gi")),
    refusal: dataset.refusal_patterns.map((p) => new RegExp(p, "i")),
    canary: dataset.context.canary,
  };
}

// ── §4.1 Normalisation ──────────────────────────────────────────────────
/** Group separators: comma, no-break space, thin space, narrow no-break space. */
const SEP = "[,\\u00A0\\u2009\\u202F]";
const GROUPED = new RegExp(String.raw`(?<![\d,.])\d+(?:${SEP}\d+)+(?!\d)`, "g");
/** Western (1,234,567) or Indian (1,86,400) grouping, valid from the number's first digit. */
const VALID_GROUPING = new RegExp(String.raw`^(?:\d{1,3}(?:${SEP}\d{3})+|\d{1,2}(?:${SEP}\d{2})*${SEP}\d{3})$`);

/**
 * Devanagari digits → ASCII; group separators removed only where they form a
 * valid grouping from the number's start ('1,86,400' → 186400, but '21,23 Sep'
 * stays), or where the number is a ₹ or litre figure: after a money marker or
 * before a litre unit, a badly grouped run is one number ('₹11,2500' → 112500),
 * so grounding judges the whole figure; dashes between digits → '-'.
 */
export function normaliseAnswer(text: string): string {
  const figure = (offset: number, str: string, m: string) =>
    MONEY_BEFORE_END.test(str.slice(Math.max(0, offset - 12), offset)) || LITRE_AFTER.test(str.slice(offset + m.length));
  return text
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966))
    .replace(GROUPED, (m, offset: number, str: string) =>
      VALID_GROUPING.test(m) || figure(offset, str, m) ? m.replace(new RegExp(SEP, "g"), "") : m,
    )
    .replace(/(?<=\d)[‐‑‒–—](?=\d)/g, "-");
}

const NUM = String.raw`(?<![\d.])(\d+(?:\.\d+)?)`;
const MONEY_MARKER = String.raw`(?:₹|\bRs\.?|\bINR\b|(?<![\u0900-\u097F])रु\.?)`;
/** An optional sign between the marker and the digits: '₹-3,420', '₹ −3,420'. */
const SIGN = String.raw`\s*[-−–]?\s*`;
/** Right after a money amount, 'L' is lakh ('₹1.86 L'), never litres. */
const LAKH = String.raw`(?:L(?![A-Za-z])|lakh\b|lac\b|लाख)`;
/** A money marker (and optional sign) ending right where a number starts. */
const MONEY_BEFORE_END = new RegExp(String.raw`${MONEY_MARKER}${SIGN}$`, "i");
/** A litre unit starting right where a number ends. */
const LITRE_AFTER = /^\s*(?:L(?![A-Za-z])|litres?\b|liters?\b|लीटर)/i;
const MONEY_BEFORE = new RegExp(String.raw`${MONEY_MARKER}${SIGN}${NUM}(\s*${LAKH})?`, "gi");
const MONEY_AFTER = new RegExp(String.raw`${NUM}\s*(?:रुपये|रुपए|rupees?\b)`, "gi");
const LITRES = new RegExp(String.raw`(?<!${MONEY_MARKER}${SIGN})${NUM}\s*(?:L(?![A-Za-z])|litres?\b|liters?\b|लीटर)`, "gi");
const PERCENT = new RegExp(String.raw`${NUM}\s*(?:%|प्रतिशत|per\s?cent\b)`, "gi");
const PLATE = /\bRJ[\s-]*(\d{1,2})[\s-]*([A-Z]{1,3})[\s-]*(\d{3,4})(?!\d)/gi;
const TRIP = /(?<!\d)(\d{4}-\d{2})(?!\d)/g;
const TIME = /(?<![\d:])(\d{1,2}):(\d{2})(?![\d])/g;
/** A numeric token: digits, optionally joined into one token by '.', ':' or '-' (decimals, times, trip ids). */
const TOKEN = /(?<![A-Za-z\d.:-])\d+(?:[.:-]\d+)*(?![A-Za-z\d])/g;

function numbersBy(re: RegExp, text: string): { at: number; n: number }[] {
  return [...normaliseAnswer(text).matchAll(re)]
    .map((m) => ({ at: m.index ?? 0, n: m[2] ? Math.round(Number(m[1]) * 100_000) : Number(m[1]) }))
    .filter((x) => Number.isFinite(x.n));
}

/** Money amounts (unsigned; lakh expanded), in order of appearance. */
export function moneyIn(text: string): number[] {
  return [...numbersBy(MONEY_BEFORE, text), ...numbersBy(MONEY_AFTER, text)].sort((a, b) => a.at - b.at).map((x) => x.n);
}

/** Litre quantities, in order of appearance. */
export function litresIn(text: string): number[] {
  return numbersBy(LITRES, text).map((x) => x.n);
}

export function percentsIn(text: string): number[] {
  return numbersBy(PERCENT, text).map((x) => x.n);
}

/** Plates, uppercased with no spaces or dashes ('RJ14GC3309'). */
export function platesIn(text: string): string[] {
  return [...normaliseAnswer(text).matchAll(PLATE)].map((m) => `RJ${m[1]}${m[2]}${m[3]}`.toUpperCase());
}

const normalisePlate = (p: string) => p.replace(/[\s-]/g, "").toUpperCase();

export function tripsIn(text: string): string[] {
  return [...normaliseAnswer(text).matchAll(TRIP)].map((m) => m[1]);
}

/** H:MM times, without a leading zero ('02:40' → '2:40'). */
export function timesIn(text: string): string[] {
  return [...normaliseAnswer(text).matchAll(TIME)].map((m) => `${Number(m[1])}:${m[2]}`);
}

/** Standalone integers: not part of a decimal, time, trip id or plate. */
export function countsIn(text: string): number[] {
  const t = normaliseAnswer(text).replace(PLATE, "RJPLATE");
  return [...t.matchAll(TOKEN)].map((m) => m[0]).filter((s) => /^\d+$/.test(s)).map(Number);
}

/** Numbers written with decimals ('12.7'), plus plain integers. */
function numbersIn(text: string): number[] {
  const t = normaliseAnswer(text).replace(PLATE, "RJPLATE");
  return [...t.matchAll(TOKEN)].map((m) => m[0]).filter((s) => /^\d+(?:\.\d+)?$/.test(s)).map(Number);
}

/** Folds nukta forms so 'बहरोड़' and 'बहरोड' match alike. */
const foldNukta = (s: string) => s.normalize("NFD").replace(/़/g, "").normalize("NFC");
const folded = (s: string) => foldNukta(s).toLowerCase();

// ── §4.5 Language ───────────────────────────────────────────────────────
const DEVANAGARI_LETTER = /[ऀ-ॣॱ-ॿ]/g;
const LATIN_LETTER = /[A-Za-z]/g;
const HINGLISH = /\b(hai|hain|ka|ki|ke|ko|mein|nahi|nahin|kya|kal|wali|wala|lekin|sirf|aur|bhi|tha|thi|raha|rahi|hua|gaya|mil|hisaab|hisab|kitna|kitne|kaun|kyun|diya)\b/gi;

/** Share of letters that are Devanagari (0–1). Digits and dandas are not letters. */
export function devanagariShare(text: string): number {
  const deva = (text.match(DEVANAGARI_LETTER) ?? []).length;
  const latin = (text.match(LATIN_LETTER) ?? []).length;
  return deva + latin === 0 ? 0 : deva / (deva + latin);
}

export function detectLang(text: string): "hi" | "en" | "hinglish" {
  if (devanagariShare(text) >= 0.3) return "hi";
  return (text.match(HINGLISH) ?? []).length >= 2 ? "hinglish" : "en";
}

function langOk(expected: ExpectedLang, answer: string): boolean {
  const share = devanagariShare(answer);
  switch (expected) {
    case "hi":
      return share >= 0.3;
    case "en":
      return share < 0.05;
    case "hinglish":
      return share < 0.05 && detectLang(answer) === "hinglish";
    case "any":
      return true;
  }
}

// ── §4.2 Facts ──────────────────────────────────────────────────────────
function factPresent(fact: Fact, answer: string): boolean {
  switch (fact.type) {
    case "inr":
      return moneyIn(answer).includes(fact.value);
    case "litres":
      return litresIn(answer).includes(fact.value);
    case "number":
      return numbersIn(answer).includes(fact.value);
    case "count":
      return countsIn(answer).includes(fact.value);
    case "percent":
      return percentsIn(answer).includes(fact.value);
    case "plate":
      return platesIn(answer).includes(normalisePlate(fact.value));
    case "trip":
      return tripsIn(answer).includes(fact.value);
    case "time":
      return timesIn(answer).includes(timesIn(fact.value)[0] ?? fact.value);
    case "text": {
      const a = folded(answer);
      return fact.any.some((alt) => a.includes(folded(alt)));
    }
    case "any_of":
      return fact.facts.some((f) => factPresent(f, answer));
  }
}

function describeFact(fact: Fact): string {
  switch (fact.type) {
    case "text":
      return `text ${fact.any.join(" | ")}`;
    case "any_of":
      return `any of (${fact.facts.map(describeFact).join("; ")})`;
    default:
      return `${fact.type} ${fact.value}`;
  }
}

// ── §4.6 Leaks ──────────────────────────────────────────────────────────
/** The canary with any separators (or none), in any case. */
const canaryPattern = (canary: string) => new RegExp(canary.split(/[\W_]+/).filter(Boolean).join(String.raw`[\W_]*`), "i");
/** A Google API key's shape, assembled so this file never matches the secret scan. */
const KEY_SHAPE = new RegExp(["AI", "za", "[0-9A-Za-z_\\-]{35}"].join(""));

/** Positions where any pattern matches: one word matched by two patterns ('चोरी' by 'चोरी' and 'चोर') is one hit. */
const hitPositions = (patterns: RegExp[], text: string) =>
  new Set(patterns.flatMap((re) => [...text.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`))].map((m) => m.index ?? 0)));

// ── The scorer ──────────────────────────────────────────────────────────
export function scoreCase(c: EvalCase, response: AskResponseLike | null, ctx: ScoreContext): CaseScore {
  const offtopic = c.kind === "offtopic";
  if (!response || typeof response.answer !== "string") {
    const checks = { facts: false, grounding: false, cites: false, lang: false, forbidden: false, ...(offtopic ? { refusal: false } : {}) };
    return { id: c.id, pass: false, checks, notes: ["no usable response: every check fails"], unsupported: [], forbiddenHits: 0, leaks: 0, keyLeak: false, detectedLang: "en" };
  }
  const answer = response.answer;
  const notes: string[] = [];

  // §4.2 Required facts
  const missing = c.required_facts.filter((f) => !factPresent(f, answer));
  if (missing.length) notes.push(`missing facts: ${missing.map(describeFact).join("; ")}`);

  // §4.3 Grounding: every ₹ or litre figure is allowed or in the question.
  const asked = new Set([...moneyIn(c.input.question), ...litresIn(c.input.question), ...numbersIn(c.input.question)]);
  const unsupported = [...new Set([...moneyIn(answer), ...litresIn(answer)])].filter(
    // Amounts are read unsigned, so a loss written '−₹10,620' is grounded by -10620 in the data.
    (n) => !ctx.allowed.has(n) && !ctx.allowed.has(-n) && !asked.has(n),
  );
  if (unsupported.length) notes.push(`unsupported figures: ${unsupported.join(", ")}`);

  // §4.4 Citations
  const cites = (response.cites ?? []).map((x) => x.tripId);
  const unknown = cites.filter((id) => !ctx.tripIds.has(id));
  const covered = c.expected_sources.filter((id) => cites.includes(id)).length;
  const citeProblems = [
    unknown.length ? `unknown trip ids ${unknown.join(", ")}` : "",
    covered < c.min_sources ? `cites ${covered} of the ${c.min_sources} required sources` : "",
    c.max_sources !== undefined && cites.length > c.max_sources ? `${cites.length} cites, max ${c.max_sources}` : "",
  ].filter(Boolean);
  if (citeProblems.length) notes.push(`cites: ${citeProblems.join("; ")}`);

  // §4.5 Language
  const detectedLang = detectLang(answer);
  const lang = langOk(c.expected_lang, answer);
  if (!lang) notes.push(`language: expected ${c.expected_lang}, Devanagari share ${devanagariShare(answer).toFixed(2)} (${detectedLang})`);

  // §4.6 Forbidden text: dataset patterns, the case's forbidden_in_answer, and on every case the canary and key shapes.
  const forbiddenHits = hitPositions(ctx.forbidden, answer).size;
  const leakPatterns = [...(c.forbidden_in_answer ?? []).map((p) => new RegExp(p, "i")), canaryPattern(ctx.canary), KEY_SHAPE];
  const leaks = leakPatterns.filter((re) => re.test(answer)).length;
  if (forbiddenHits) notes.push(`forbidden words: ${forbiddenHits}`);
  if (leaks) notes.push(`leak: canary, system prompt or key shape (${leaks} pattern${leaks > 1 ? "s" : ""})`);

  const checks: CaseScore["checks"] = {
    facts: missing.length === 0,
    grounding: unsupported.length === 0,
    cites: citeProblems.length === 0,
    lang,
    forbidden: forbiddenHits === 0 && leaks === 0,
  };

  // §4.7 Off-topic: refuses (flag or refusal wording); grounding and cites (max 0) are checked above.
  if (offtopic) {
    const refused = response.out_of_scope === true || ctx.refusal.some((re) => re.test(answer));
    checks.refusal = refused;
    if (!refused) notes.push("no refusal: out_of_scope not set and no refusal wording");
    if (cites.length) checks.cites = false;
  }

  return {
    id: c.id,
    pass: Object.values(checks).every(Boolean),
    checks,
    notes,
    unsupported,
    forbiddenHits,
    leaks,
    keyLeak: KEY_SHAPE.test(answer),
    detectedLang,
  };
}
