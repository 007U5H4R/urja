/**
 * The Ask Urja eval runner (evaluation-plan §5, technical-plan §6.7).
 *
 *   pnpm eval --base-url <url> [--label <name>] [--baseline <results.json>]
 *             [--pace-ms <ms>] [--timeout-ms <ms>] [--dataset <file>]
 *             [--out-dir <dir> | --out <file|dir>] [--note <text>]
 *
 * Posts every case of evals/eval-dataset.json to <base-url>/api/ask, one
 * request every 12 s (under the route's 5-per-minute limit), scores each
 * answer with evals/scorers/ask-scorer.ts, prints a results table, and writes
 * evals/results/ask-{label}-{shortsha}.json from the real responses. Failed
 * cases stay in the file. --out names the file, or, when it is an existing
 * directory or ends in '/', the directory that file goes in; the output folder
 * is checked (and created) before any request. Exits 1 when the gate (§7, plus the §2 blockers)
 * fails, 2 on a usage error or an unreadable --baseline (before any request).
 *
 * --pace-ms <ms> (default 12000) is the gap between request starts. 12 s keeps
 * one IP under the route's 5-per-minute bucket; a lower pace gets 429s, and a
 * 429 that carries retryAfterS is retried once after that wait. 0 disables
 * pacing (mocked or local runs). --timeout-ms bounds each request.
 *
 * Diagnostics only (never scoring or the gate): each case records its
 * x-ask-outcome, its first Gemini attempt's code (`after=<code> <model>`, else
 * the outcome itself; EXE26/EXE31) and `cached: true` for an answer the server
 * replayed from its answer cache. Every request carries `x-ask-cache: bypass`,
 * so each case is a live call; should one still come back cached, it gets a
 * warning, is shown as "by the model X (cached Y)", and is left out of
 * p50/p90. A cached model answer still counts as the model's (EXE31).
 *
 * No key is read here: the server holds GEMINI_API_KEY. A Vercel preview behind
 * deployment protection is reached with VERCEL_AUTOMATION_BYPASS_SECRET, sent
 * as a header and never printed; answers are written and printed with that value
 * and any key-shaped string replaced by "[redacted]".
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getAskContext } from "@/lib/ask/context";
import { PROMPT_VERSION } from "@/lib/ask/prompt";
import { scoreCase, scoringContext, type AskResponseLike, type CaseScore, type EvalDataset } from "./scorers/ask-scorer";

export const USAGE =
  "usage: pnpm eval --base-url <url> [--label <name>] [--baseline <results.json>] [--pace-ms <ms>] [--timeout-ms <ms>] " +
  "[--dataset <file>] [--out-dir <dir> | --out <file|dir>] [--note <text>]";

/** A bad invocation: the CLI exits 2 before sending any request. */
export class UsageError extends Error {}

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PACE_MS = 12_000;
const DEFAULT_TIMEOUT_MS = 30_000;
/** A 429's retryAfterS is honoured once per case, up to this long. */
const MAX_RETRY_WAIT_MS = 70_000;

// ── Options ─────────────────────────────────────────────────────────────
export interface RunOptions {
  baseUrl: string;
  label: string;
  paceMs: number;
  timeoutMs: number;
  datasetPath: string;
  outDir: string;
  out?: string;
  baseline?: string;
  note?: string;
}

const FLAGS = ["base-url", "label", "pace-ms", "timeout-ms", "dataset", "out-dir", "out", "baseline", "note"] as const;

export function parseArgs(argv: string[]): RunOptions {
  const raw: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") continue;
    const m = /^--([a-z-]+)(?:=(.*))?$/.exec(arg);
    if (!m || !(FLAGS as readonly string[]).includes(m[1])) throw new UsageError(`unknown argument ${arg}`);
    let value = m[2];
    if (value === undefined && argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) value = argv[++i];
    if (value === undefined || value === "") throw new UsageError(`--${m[1]} needs a value`);
    raw[m[1]] = value;
  }
  if (!raw["base-url"]) throw new UsageError("--base-url is required (a preview URL or http://localhost:<port>)");
  let url: URL;
  try {
    url = new URL(raw["base-url"]);
  } catch {
    throw new UsageError(`--base-url is not a URL: ${raw["base-url"]}`);
  }
  if (!/^https?:$/.test(url.protocol)) throw new UsageError("--base-url must be http(s)");
  if (url.search || url.hash || /[?#]/.test(raw["base-url"])) throw new UsageError("--base-url must not have a query or hash");
  const label = raw.label ?? "run";
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(label)) throw new UsageError(`--label may use letters, digits, '.', '_' and '-' only: ${label}`);
  const ms = (name: string, fallback: number) => {
    if (raw[name] === undefined) return fallback;
    const n = Number(raw[name]);
    if (!Number.isInteger(n) || n < 0) throw new UsageError(`--${name} must be a whole number of ms ≥ 0`);
    return n;
  };
  return {
    baseUrl: url.href.replace(/\/+$/, ""),
    label,
    paceMs: ms("pace-ms", DEFAULT_PACE_MS),
    timeoutMs: ms("timeout-ms", DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
    datasetPath: raw.dataset ?? join(HERE, "eval-dataset.json"),
    outDir: raw["out-dir"] ?? join(HERE, "results"),
    ...(raw.out ? { out: raw.out } : {}),
    ...(raw.baseline ? { baseline: raw.baseline } : {}),
    ...(raw.note ? { note: raw.note } : {}),
  };
}

// ── Dependencies (injected so tests run with a mocked fetch) ────────────
export interface RunDeps {
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  /** A monotonic clock in ms, for latency and pacing. */
  now: () => number;
  /** The wall clock, for the results timestamp. */
  clock: () => Date;
  git: (args: string[]) => string;
  env: Record<string, string | undefined>;
  readFile: (path: string) => string;
  writeFile: (path: string, text: string) => void;
  mkdir: (path: string) => void;
  /** What is at a path: a directory, a file, or nothing. */
  pathKind: (path: string) => "dir" | "file" | null;
  log: (line: string) => void;
  bundle: () => { allowed: ReadonlySet<number>; tripIds: ReadonlySet<string>; hash: string };
}

export const realDeps: RunDeps = {
  fetch: (...a) => fetch(...a),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  now: () => performance.now(),
  clock: () => new Date(),
  git: (args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(),
  env: process.env,
  readFile: (p) => readFileSync(p, "utf8"),
  writeFile: (p, t) => writeFileSync(p, t),
  mkdir: (p) => mkdirSync(p, { recursive: true }),
  pathKind: (p) => {
    try {
      return statSync(p).isDirectory() ? "dir" : "file";
    } catch {
      return null;
    }
  },
  log: (l) => console.log(l),
  bundle: getAskContext,
};

// ── Results shape (evaluation-plan §5) ──────────────────────────────────
export interface CaseResult {
  id: string;
  kind: "prepared" | "offtopic";
  pass: boolean;
  /** model | fallback | saved from the API; 'error' when there was no usable response. */
  mode: string;
  /** EXE26: the model that wrote the answer (provenance.model); null for fallback, saved or error. */
  model: string | null;
  httpStatus: number | null;
  /**
   * The response's x-ask-outcome header (EXE24/EXE26), verbatim: why the server
   * answered as it did ('ok; model=…', 'guard:no_cites; model=…', 'timeout; …').
   * null when the header is absent or there was no response. Diagnostic only:
   * it never affects scoring or the gate.
   */
  outcome: string | null;
  /**
   * EXE31: the code of the first Gemini attempt: from `after=<code> <model>` when the
   * fallback model was asked, else the outcome code itself. null for a cached answer
   * (no attempt) or no header.
   */
  firstAttempt: string | null;
  /** EXE31: the server replayed this model answer from its answer cache ('ok; cached; …'). */
  cached?: boolean;
  /** Client-side, end to end. */
  ms: number;
  serverMs: number | null;
  checks: CaseScore["checks"];
  answer: string;
  cites: string[];
  lang: string | null;
  detectedLang: CaseScore["detectedLang"];
  caveat?: string;
  notes: string[];
  unsupported: number[];
  forbiddenHits: number;
  leaks: number;
  keyLeak: boolean;
  retried?: boolean;
}

export interface Provenance {
  commit: string;
  branch: string;
  dirty: boolean;
  baseUrlHost: string;
  model: string | null;
  /** Where `model` came from: the responses' provenance, the runner's ASK_MODEL, or nowhere. */
  modelSource: "responses" | "ASK_MODEL env" | "none";
  modelsSeen: string[];
  /** EXE26: answers per model (the primary and the fallback model both count as the model). */
  modelCounts: Record<string, number>;
  promptVersion: string;
  datasetVersion: string;
  datasetHash: string | null;
  localDatasetHash: string;
  ts: string;
  label: string;
  paceMs: number;
  warnings: string[];
  note?: string;
}

export interface Summary {
  prepared: string;
  /** Prepared passes whose answer came from the model (mode 'model'); informational, not the gate. */
  preparedByModel: string;
  offtopic: string;
  p50Ms: number;
  p90Ms: number;
  forbiddenHits: number;
  /** ₹/litre figures outside the allowed set, across all cases. */
  unsupportedNumbers: number;
  /** The §7 gate metric: unsupported figures on passing cases. */
  unsupportedOnPassing: number;
  modes: Record<string, number>;
  /** Cases per outcome code (the x-ask-outcome part before the first ';'); 'none' when absent. Diagnostic only. */
  outcomes: Record<string, number>;
  /** EXE31: cases per first-attempt code ('cached' for a cached answer, 'none' without a header). Diagnostic only. */
  firstAttempts: Record<string, number>;
  /** EXE31: answers replayed from the server's answer cache. */
  cached: number;
  failedCases: string[];
  /** One per prepared pass that isn't a model answer, and one per off-topic pass that isn't (a deterministic refusal). */
  warnings: string[];
  gate: "PASS" | "FAIL";
  gateFailures: string[];
  vsBaseline?: {
    file: string;
    commit: string | null;
    prepared: string;
    offtopic: string;
    p50Ms: string;
    regressed: string[];
    fixed: string[];
  };
}

export interface EvalResult {
  provenance: Provenance;
  cases: CaseResult[];
  summary: Summary;
}

// ── Helpers ─────────────────────────────────────────────────────────────
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  if (p === 50) {
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
  }
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))];
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const passCount = (fraction: string) => Number(/^(\d+)\//.exec(fraction)?.[1] ?? NaN);
const distinct = <T,>(xs: (T | null | undefined)[]) => [...new Set(xs.filter((x): x is T => x !== null && x !== undefined))];

/** A Google API key's shape, assembled so this file never matches the secret scan. */
const KEY_SHAPE_G = new RegExp(["AI", "za", "[0-9A-Za-z_\\-]{35}"].join(""), "g");

/** Replaces key-shaped strings and the given secrets with "[redacted]". */
export function redact(text: string, secrets: (string | undefined)[]): string {
  let out = text.replace(KEY_SHAPE_G, "[redacted]");
  for (const s of secrets) if (s) out = out.split(s).join("[redacted]");
  return out;
}

type Baseline = { provenance?: { commit?: string }; cases: { id: string; pass: boolean }[]; summary: { prepared: string; offtopic: string; p50Ms: number } };

/** Reads and checks a baseline results file; throws UsageError when it is missing or malformed. */
export function loadBaseline(file: string, deps: Pick<RunDeps, "readFile">): Baseline {
  let text: string;
  try {
    text = deps.readFile(file);
  } catch (e) {
    throw new UsageError(`--baseline ${file} can't be read: ${e instanceof Error ? e.message : String(e)}`);
  }
  let b: Partial<Baseline>;
  try {
    b = JSON.parse(text);
  } catch {
    throw new UsageError(`--baseline ${file} is not JSON`);
  }
  const ok =
    !!b &&
    Array.isArray(b.cases) &&
    b.cases.every((c) => c && typeof c.id === "string" && typeof c.pass === "boolean") &&
    typeof b.summary?.prepared === "string" &&
    typeof b.summary?.offtopic === "string" &&
    typeof b.summary?.p50Ms === "number";
  if (!ok) throw new UsageError(`--baseline ${file} is not an eval results file (needs cases[] and summary.prepared/offtopic/p50Ms)`);
  return b as Baseline;
}

/**
 * Where the results go, settled before any request: `file` when --out names a
 * file, otherwise the standard name inside `dir`. The folder is created here, so
 * a bad --out or --out-dir costs no request. Throws UsageError.
 */
export function resolveOutput(opts: Pick<RunOptions, "out" | "outDir">, deps: Pick<RunDeps, "pathKind" | "mkdir">): { dir: string; file?: string } {
  let dir: string;
  let file: string | undefined;
  let what: string;
  if (opts.out === undefined) {
    dir = opts.outDir;
    what = `--out-dir ${dir}`;
  } else if (/[\\/]$/.test(opts.out) || deps.pathKind(opts.out) === "dir") {
    dir = opts.out.replace(/[\\/]+$/, "") || opts.out;
    what = `--out ${opts.out}`;
  } else {
    file = opts.out;
    dir = dirname(file);
    what = `--out ${file}: its folder ${dir}`;
  }
  const kind = deps.pathKind(dir);
  if (kind === "file") throw new UsageError(`${what} is a file, not a directory`);
  if (kind === null) {
    try {
      deps.mkdir(dir);
    } catch (e) {
      throw new UsageError(`${what} can't be created: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return file === undefined ? { dir } : { dir, file };
}

function isAskResponse(body: unknown): body is AskResponseLike & { provenance?: { ms?: number; model?: string | null; promptVersion?: string; datasetHash?: string } } {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return typeof b.answer === "string" && typeof b.mode === "string" && Array.isArray(b.cites);
}

// ── The run ─────────────────────────────────────────────────────────────
export async function runEval(opts: RunOptions, deps: RunDeps = realDeps): Promise<{ result: EvalResult; path: string; exitCode: number }> {
  const baseline = opts.baseline ? loadBaseline(opts.baseline, deps) : undefined;
  const output = resolveOutput(opts, deps);
  const dataset = JSON.parse(deps.readFile(opts.datasetPath)) as EvalDataset;
  const bundle = deps.bundle();
  const ctx = scoringContext(dataset, bundle);
  const endpoint = new URL("/api/ask", opts.baseUrl).href;
  // EXE31: every case is a live call; the server skips its answer cache for this request.
  const headers: Record<string, string> = { "content-type": "application/json", "x-ask-cache": "bypass" };
  const bypass = deps.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) headers["x-vercel-protection-bypass"] = bypass;

  deps.log(`Ask eval · ${dataset.dataset} v${dataset.version} · ${dataset.cases.length} cases → ${new URL(opts.baseUrl).host} · pace ${opts.paceMs} ms`);

  const cases: CaseResult[] = [];
  const seen: { model: (string | null)[]; prompt: (string | undefined)[]; hash: (string | undefined)[] } = { model: [], prompt: [], hash: [] };
  let lastStart: number | null = null;

  for (const c of dataset.cases) {
    let retried = false;
    let outcome: { status: number | null; body: unknown; ms: number; error?: string; outcome?: string | null };
    for (;;) {
      if (lastStart !== null && opts.paceMs > 0) {
        const wait = opts.paceMs - (deps.now() - lastStart);
        if (wait > 0) await deps.sleep(wait);
      }
      lastStart = deps.now();
      outcome = await post(deps, endpoint, headers, { question: c.input.question, ...(c.input.lang ? { lang: c.input.lang } : {}) }, opts.timeoutMs);
      const retryAfterS = (outcome.body as { retryAfterS?: unknown } | null)?.retryAfterS;
      if (outcome.status === 429 && !retried && typeof retryAfterS === "number") {
        retried = true;
        await deps.sleep(Math.min(MAX_RETRY_WAIT_MS, retryAfterS * 1000));
        lastStart = null;
        continue;
      }
      break;
    }

    const body = outcome.body;
    const usable = outcome.status !== null && outcome.status < 500 && isAskResponse(body) ? body : null;
    const score = scoreCase(c, usable, ctx);
    const notes = [...score.notes];
    if (!usable) notes.unshift(outcome.error ?? `HTTP ${outcome.status}: body is not an AskResponse`);
    else if (outcome.status !== 200) notes.unshift(`HTTP ${outcome.status}`);
    if (usable?.provenance) {
      seen.model.push(usable.provenance.model ?? null);
      seen.prompt.push(usable.provenance.promptVersion);
      seen.hash.push(usable.provenance.datasetHash);
    }
    cases.push({
      id: c.id,
      kind: c.kind,
      pass: score.pass,
      mode: usable?.mode ?? "error",
      model: usable?.provenance?.model ?? null,
      httpStatus: outcome.status,
      outcome: outcome.outcome ?? null,
      firstAttempt: firstAttemptCode(outcome.outcome),
      ...(isCached(outcome.outcome) ? { cached: true } : {}),
      ms: outcome.ms,
      serverMs: typeof usable?.provenance?.ms === "number" ? usable.provenance.ms : null,
      checks: score.checks,
      answer: redact(usable?.answer ?? "", [bypass]),
      cites: (usable?.cites ?? []).map((x) => x.tripId),
      lang: usable?.lang ?? null,
      detectedLang: score.detectedLang,
      ...(typeof usable?.caveat === "string" ? { caveat: redact(usable.caveat, [bypass]) } : {}),
      notes,
      unsupported: score.unsupported,
      forbiddenHits: score.forbiddenHits,
      leaks: score.leaks,
      keyLeak: score.keyLeak,
      ...(retried ? { retried } : {}),
    });
    const last = cases[cases.length - 1];
    deps.log(`  ${last.id}  ${last.pass ? "pass" : "FAIL"}  ${last.mode}  ${last.ms} ms  ${last.outcome ?? "no outcome header"}`);
  }

  const provenance = buildProvenance(opts, deps, dataset, bundle.hash, seen, cases);
  const summary = summarise(dataset, cases);
  if (opts.baseline && baseline) summary.vsBaseline = compare(opts.baseline, baseline, cases, summary);

  const result: EvalResult = { provenance, cases, summary };
  const path = output.file ?? join(output.dir, `ask-${opts.label}-${provenance.commit.slice(0, 7)}.json`);
  const json = `${JSON.stringify(result, null, 2)}\n`;
  // Write first; if that fails, still print the report and the JSON so a paid run isn't lost.
  let writeError: unknown;
  try {
    deps.mkdir(dirname(path));
    deps.writeFile(path, json);
  } catch (e) {
    writeError = e;
  }

  for (const line of report(result)) deps.log(line);
  if (writeError !== undefined) {
    deps.log("Results JSON (the file could not be written):");
    deps.log(json);
    throw new Error(`couldn't write the results file ${path}: ${writeError instanceof Error ? writeError.message : String(writeError)}`);
  }
  deps.log(`Results: ${path}`);
  return { result, path, exitCode: summary.gate === "PASS" ? 0 : 1 };
}

async function post(
  deps: RunDeps,
  url: string,
  headers: Record<string, string>,
  body: { question: string; lang?: string },
  timeoutMs: number,
): Promise<{ status: number | null; body: unknown; ms: number; error?: string; outcome?: string | null }> {
  const t0 = deps.now();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const res = await deps.fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: abort.signal });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    return { status: res.status, body: parsed, ms: Math.round(deps.now() - t0), outcome: res.headers.get("x-ask-outcome") };
  } catch (e) {
    const code = e instanceof Error ? (e.cause as { code?: unknown } | undefined)?.code : undefined;
    const reason = abort.signal.aborted
      ? `timed out after ${timeoutMs} ms`
      : `${e instanceof Error ? e.message : String(e)}${typeof code === "string" ? ` (${code})` : ""}`;
    return { status: null, body: null, ms: Math.round(deps.now() - t0), error: `request failed: ${reason}` };
  } finally {
    clearTimeout(timer);
  }
}

function buildProvenance(
  opts: RunOptions,
  deps: RunDeps,
  dataset: EvalDataset,
  localHash: string,
  seen: { model: (string | null)[]; prompt: (string | undefined)[]; hash: (string | undefined)[] },
  cases: CaseResult[],
): Provenance {
  const git = (args: string[], fallback: string) => {
    try {
      return deps.git(args);
    } catch {
      return fallback;
    }
  };
  const models = distinct(seen.model);
  const prompts = distinct(seen.prompt);
  const hashes = distinct(seen.hash);
  const promptVersion = prompts[0] ?? PROMPT_VERSION;
  const warnings: string[] = [];
  if (hashes.length > 1) warnings.push(`server returned ${hashes.length} datasetHash values: ${hashes.join(", ")}`);
  if (hashes[0] && hashes[0] !== localHash) warnings.push(`server datasetHash ${hashes[0]} differs from this checkout's ${localHash}`);
  if (prompts.length > 1) warnings.push(`server returned ${prompts.length} promptVersion values: ${prompts.join(", ")}`);
  if (promptVersion !== dataset.context.prompt_version) warnings.push(`promptVersion ${promptVersion} differs from the dataset's ${dataset.context.prompt_version}`);
  if (models.length === 0) warnings.push("no answer came from the model (fallback or saved only)");
  return {
    commit: git(["rev-parse", "HEAD"], "unknown"),
    branch: git(["rev-parse", "--abbrev-ref", "HEAD"], "unknown"),
    dirty: git(["status", "--porcelain", "--untracked-files=no"], "") !== "",
    baseUrlHost: new URL(opts.baseUrl).host,
    model: models[0] ?? deps.env.ASK_MODEL ?? null,
    modelSource: models[0] ? "responses" : deps.env.ASK_MODEL ? "ASK_MODEL env" : "none",
    modelsSeen: models,
    modelCounts: countModels(cases.filter((c) => c.mode === "model").map((c) => c.model)),
    promptVersion,
    datasetVersion: dataset.version,
    datasetHash: hashes[0] ?? null,
    localDatasetHash: localHash,
    ts: deps.clock().toISOString(),
    label: opts.label,
    paceMs: opts.paceMs,
    warnings,
    ...(opts.note ? { note: opts.note } : {}),
  };
}

export function summarise(dataset: EvalDataset, cases: CaseResult[]): Summary {
  const g = dataset.gate;
  const prepared = cases.filter((c) => c.kind === "prepared");
  const offtopic = cases.filter((c) => c.kind === "offtopic");
  const preparedPass = prepared.filter((c) => c.pass).length;
  const preparedByModel = prepared.filter((c) => c.pass && c.mode === "model").length;
  // §2 blockers, enforced on their own whatever the pass counts say.
  const outsideData = prepared.filter((c) => c.unsupported.length > 0).map((c) => c.id);
  const hiCases = new Set(dataset.cases.filter((c) => c.expected_lang === "hi").map((c) => c.id));
  // Stricter than §2: a key-shaped string in any answer fails the gate.
  const keyLeaks = cases.filter((c) => c.keyLeak).map((c) => c.id);
  const notHindi = cases.filter((c) => hiCases.has(c.id) && c.mode !== "error" && c.checks.lang === false).map((c) => c.id);
  const offtopicPass = offtopic.filter((c) => c.pass).length;
  // EXE31: latency is the model's; a case the server still served from its answer cache is left out.
  const ms = cases.filter((c) => !c.cached).map((c) => c.ms);
  const p50Ms = percentile(ms, 50);
  const forbiddenHits = cases.reduce((n, c) => n + c.forbiddenHits, 0);
  const unsupportedNumbers = cases.reduce((n, c) => n + c.unsupported.length, 0);
  const unsupportedOnPassing = cases.filter((c) => c.pass).reduce((n, c) => n + c.unsupported.length, 0);
  const modes: Record<string, number> = {};
  for (const c of cases) modes[c.mode] = (modes[c.mode] ?? 0) + 1;
  const outcomes: Record<string, number> = {};
  const firstAttempts: Record<string, number> = {};
  for (const c of cases) {
    const code = outcomeCode(c.outcome);
    outcomes[code] = (outcomes[code] ?? 0) + 1;
    const first = c.cached ? "cached" : (c.firstAttempt ?? "none");
    firstAttempts[first] = (firstAttempts[first] ?? 0) + 1;
  }
  const byCount = (counts: Record<string, number>) => Object.fromEntries(Object.entries(counts).sort((x, y) => y[1] - x[1]));

  const gateFailures = [
    prepared.length !== g.prepared_total ? `ran ${prepared.length} prepared cases, the gate expects ${g.prepared_total}` : "",
    offtopic.length !== g.offtopic_total ? `ran ${offtopic.length} off-topic cases, the gate expects ${g.offtopic_total}` : "",
    // EXE13 (user decision): only answers the model wrote count toward the prepared gate; a
    // correct fallback answer proves the fallback, not Gemini.
    preparedByModel < g.prepared_min_pass
      ? `prepared answered by the model ${preparedByModel}/${prepared.length} < ${g.prepared_min_pass} (all passes: ${preparedPass}/${prepared.length})`
      : "",
    offtopicPass < g.offtopic_min_pass ? `off-topic ${offtopicPass}/${offtopic.length} < ${g.offtopic_min_pass}` : "",
    p50Ms >= g.latency_p50_ms_max ? `p50 ${p50Ms} ms ≥ ${g.latency_p50_ms_max} ms` : "",
    forbiddenHits > g.forbidden_hits_max ? `forbidden-word hits ${forbiddenHits} > ${g.forbidden_hits_max}` : "",
    unsupportedOnPassing > g.unsupported_numbers_max_on_passing_cases
      ? `unsupported figures on passing cases ${unsupportedOnPassing} > ${g.unsupported_numbers_max_on_passing_cases}`
      : "",
    outsideData.length ? `prepared answer with a ₹ or litre figure outside the data: ${outsideData.join(", ")}` : "",
    notHindi.length ? `Hindi question answered in another language: ${notHindi.join(", ")}` : "",
    keyLeaks.length ? `key-shaped string in an answer: ${keyLeaks.join(", ")}` : "",
  ].filter(Boolean);

  return {
    prepared: `${preparedPass}/${prepared.length}`,
    preparedByModel: `${preparedByModel}/${prepared.length}`,
    offtopic: `${offtopicPass}/${offtopic.length}`,
    p50Ms,
    p90Ms: percentile(ms, 90),
    forbiddenHits,
    unsupportedNumbers,
    unsupportedOnPassing,
    modes,
    // Most frequent first; ties keep the order the cases ran in.
    outcomes: byCount(outcomes),
    firstAttempts: byCount(firstAttempts),
    cached: cases.filter((c) => c.cached).length,
    failedCases: cases.filter((c) => !c.pass).map((c) => c.id),
    warnings: [
      ...prepared.filter((c) => c.pass && c.mode !== "model").map((c) => `${c.id} passed on a ${c.mode} answer, not the model`),
      // Informational: off-topic counting is unchanged (a deterministic refusal still counts).
      ...offtopic.filter((c) => c.pass && c.mode !== "model").map((c) => `${c.id} passed on a deterministic refusal, not the model`),
      // EXE31: the runner sends x-ask-cache: bypass, so a cached case means the server ignored it.
      ...cases.filter((c) => c.cached).map((c) => `${c.id} was served from the answer cache`),
    ],
    gate: gateFailures.length ? "FAIL" : "PASS",
    gateFailures,
  };
}

function compare(file: string, base: Baseline, cases: CaseResult[], summary: Summary): NonNullable<Summary["vsBaseline"]> {
  const before = new Map(base.cases.map((c) => [c.id, c.pass]));
  return {
    file,
    commit: base.provenance?.commit ?? null,
    prepared: signed(passCount(summary.prepared) - passCount(base.summary.prepared)),
    offtopic: signed(passCount(summary.offtopic) - passCount(base.summary.offtopic)),
    p50Ms: signed(summary.p50Ms - base.summary.p50Ms),
    regressed: cases.filter((c) => before.get(c.id) === true && !c.pass).map((c) => c.id),
    fixed: cases.filter((c) => before.get(c.id) === false && c.pass).map((c) => c.id),
  };
}

// ── Printing ────────────────────────────────────────────────────────────
const CHECK_ORDER = ["facts", "grounding", "cites", "lang", "forbidden", "refusal"] as const;

export function report(r: EvalResult): string[] {
  const rows = r.cases.map((c) => [
    c.id,
    c.kind,
    c.mode,
    c.httpStatus === null ? "—" : String(c.httpStatus),
    outcomeCode(c.outcome),
    String(c.ms),
    c.pass ? "pass" : "FAIL",
    CHECK_ORDER.filter((k) => c.checks[k] === false).join(",") || "",
  ]);
  const head = ["case", "kind", "mode", "http", "outcome", "ms", "result", "failed checks"];
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)));
  const line = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i])).join("  ").trimEnd();
  const out = ["", line(head), line(widths.map((w) => "-".repeat(w))), ...rows.map(line), ""];

  const failed = r.cases.filter((c) => !c.pass);
  if (failed.length) {
    out.push(`Failed cases (${failed.length}):`);
    for (const c of failed) {
      out.push(`  ${c.id}: ${c.notes.join(" · ")}${c.outcome ? ` · x-ask-outcome: ${c.outcome}` : ""}`);
      if (c.answer) out.push(`    answer: ${c.answer.length > 200 ? `${c.answer.slice(0, 200)}…` : c.answer}`);
    }
    out.push("");
  }
  const s = r.summary;
  const p = r.provenance;
  out.push(
    `Prepared ${s.prepared} (by the model ${s.preparedByModel} (cached ${s.cached ?? 0})) · off-topic ${s.offtopic} · p50 ${s.p50Ms} ms · p90 ${s.p90Ms} ms · forbidden ${s.forbiddenHits} · unsupported ${s.unsupportedNumbers} (on passing ${s.unsupportedOnPassing})`,
    `Modes: ${Object.entries(s.modes).map(([k, v]) => `${k} ${v}`).join(", ")}`,
    `Outcomes: ${Object.entries(s.outcomes ?? {}).map(([k, v]) => `${k} ${v}`).join(", ")}`,
    `First attempts: ${Object.entries(s.firstAttempts ?? {}).map(([k, v]) => `${k} ${v}`).join(", ")} · cached answers ${s.cached ?? 0}`,
    `Provenance: ${p.commit.slice(0, 7)}${p.dirty ? " (dirty)" : ""} on ${p.branch} · ${p.baseUrlHost} · ${modelText(p)} · ${p.promptVersion} · dataset ${p.datasetVersion} · hash ${p.datasetHash ?? "none"}`,
  );
  for (const w of [...s.warnings, ...p.warnings]) out.push(`Warning: ${w}`);
  if (s.vsBaseline) {
    const b = s.vsBaseline;
    out.push(
      `vs baseline ${b.file}${b.commit ? ` (${b.commit.slice(0, 7)})` : ""}: prepared ${b.prepared} · off-topic ${b.offtopic} · p50 ${b.p50Ms} ms` +
        `${b.regressed.length ? ` · regressed ${b.regressed.join(", ")}` : ""}${b.fixed.length ? ` · fixed ${b.fixed.join(", ")}` : ""}`,
    );
  }
  out.push(`Gate: ${s.gate}${s.gateFailures.length ? ` (${s.gateFailures.join("; ")})` : ""}`);
  return out;
}

// ── CLI ─────────────────────────────────────────────────────────────────
/** Runs the eval from argv and returns the exit code: 0 PASS, 1 gate FAIL, 2 usage error. */
export async function cli(argv: string[], deps: RunDeps = realDeps): Promise<number> {
  try {
    const { exitCode } = await runEval(parseArgs(argv), deps);
    return exitCode;
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    deps.log(`pnpm eval: ${e.message}`);
    deps.log(USAGE);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  cli(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      console.error(e instanceof Error ? e.message : e);
      process.exitCode = 2;
    },
  );
}

/** 'guard:no_cites' from 'guard:no_cites; model=gemini-3.5-flash'; 'none' when there was no header. */
export function outcomeCode(outcome: string | null | undefined): string {
  return outcome?.split(";")[0].trim() || "none";
}

/** The x-ask-outcome parts: "ok; model=x; after=http_429:429 y" → ["ok", "model=x", "after=http_429:429 y"]. */
const outcomeParts = (outcome: string | null | undefined) => (outcome ?? "").split(";").map((p) => p.trim()).filter(Boolean);

/** EXE31: 'ok; cached; model=…' marks an answer replayed from the server's answer cache. */
export function isCached(outcome: string | null | undefined): boolean {
  return outcomeParts(outcome).includes("cached");
}

/**
 * EXE31: the first Gemini attempt's code: 'http_429:429' from '…; after=http_429:429 gemini-3.5-flash',
 * else the outcome code itself; null for a cached answer (no attempt) or no header.
 */
export function firstAttemptCode(outcome: string | null | undefined): string | null {
  const parts = outcomeParts(outcome);
  if (!parts.length || parts.includes("cached")) return null;
  const after = parts.map((p) => /^after=(\S+)\s+\S+$/.exec(p)).find(Boolean);
  return after ? after[1] : parts[0];
}

function countModels(models: (string | null)[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of models) if (m) counts[m] = (counts[m] ?? 0) + 1;
  return counts;
}

/** "model gemini-3.5-flash", or with several: "models gemini-3.5-flash ×11, gemini-2.5-flash ×2". */
function modelText(p: Provenance): string {
  const entries = Object.entries(p.modelCounts ?? {});
  if (entries.length > 1) return `models ${entries.map(([m, n]) => `${m} ×${n}`).join(", ")}`;
  return `model ${p.model ?? "none"}${p.modelSource === "responses" ? "" : ` (${p.modelSource})`}`;
}
