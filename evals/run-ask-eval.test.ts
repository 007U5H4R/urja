/**
 * TSK-13.2 · The eval runner (evaluation-plan §5), with a mocked fetch and no
 * pacing. Mocked answers are the passing canned answers from
 * evals/scorers/fixtures, keyed by case id.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getAskContext } from "@/lib/ask/context";
import type { AskResponseLike, EvalDataset } from "./scorers/ask-scorer";
import { cli, parseArgs, runEval, USAGE, type RunDeps, type RunOptions } from "./run-ask-eval";

const DATASET_PATH = join(__dirname, "eval-dataset.json");
const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf8")) as EvalDataset;
const bundle = getAskContext();

const FIX = join(__dirname, "scorers", "fixtures");
const good = new Map<string, AskResponseLike>();
for (const f of readdirSync(FIX).filter((x) => x.startsWith("pass-"))) {
  const fx = JSON.parse(readFileSync(join(FIX, f), "utf8"));
  good.set(fx.case, fx.response);
}
const idByQuestion = new Map(dataset.cases.map((c) => [c.input.question, c.id]));

const provenance = (model: string | null = "gemini-3.5-flash") => ({
  scope: "212 trips across 24 trucks, 1–27 Sep",
  model,
  ms: 900,
  promptVersion: "ask-v1",
  datasetHash: bundle.hash,
});

type Answerer = (id: string, attempt: number) => { status: number; body?: unknown; raw?: string } | Error | "hang";

function harness(answer: Answerer = (id) => ({ status: 200, body: { ...good.get(id), provenance: provenance() } }), stepMs = 1000) {
  const calls: { url: string; body: { question: string; lang?: string }; headers: Record<string, string> }[] = [];
  const attempts = new Map<string, number>();
  const writes: { path: string; text: string }[] = [];
  const lines: string[] = [];
  const sleeps: number[] = [];
  const gitCalls: string[][] = [];
  let clock = 0;
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    calls.push({ url: String(url), body, headers: init?.headers as Record<string, string> });
    const id = idByQuestion.get(body.question) ?? "?";
    const n = (attempts.get(id) ?? 0) + 1;
    attempts.set(id, n);
    clock += stepMs;
    const r = answer(id, n);
    if (r === "hang")
      return new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
    if (r instanceof Error) throw r;
    return new Response(r.raw ?? JSON.stringify(r.body), { status: r.status, headers: { "content-type": r.raw ? "text/html" : "application/json" } });
  });
  const deps: RunDeps = {
    fetch: fetchMock as unknown as typeof fetch,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    now: () => clock,
    clock: () => new Date("2026-09-28T01:42:00Z"),
    git: (args) => (gitCalls.push(args), args.includes("HEAD") && args.includes("--abbrev-ref") ? "build/stage7" : args[0] === "status" ? "" : "abc2620deadbeefcafe0000000000000000000000"),
    env: { ASK_MODEL: undefined },
    readFile: (p) => readFileSync(p, "utf8"),
    writeFile: (path, text) => {
      writes.push({ path, text });
    },
    mkdir: () => {},
    pathKind: () => null,
    log: (l) => {
      lines.push(l);
    },
    bundle: () => bundle,
  };
  return { deps, calls, writes, lines, sleeps, fetchMock, gitCalls };
}

const opts = (over: Partial<RunOptions> = {}): RunOptions => ({
  ...parseArgs(["--base-url", "http://localhost:3200", "--pace-ms", "0", "--label", "test"]),
  datasetPath: DATASET_PATH,
  outDir: "/virtual/results",
  ...over,
});

describe("parseArgs", () => {
  it("needs --base-url and defaults to a 12 s pace", () => {
    expect(() => parseArgs([])).toThrow(/--base-url/);
    const o = parseArgs(["--base-url", "https://urja-preview.vercel.app/"]);
    expect(o.baseUrl).toBe("https://urja-preview.vercel.app");
    expect(o.paceMs).toBe(12000);
    expect(o.label).toBe("run");
    expect(o.outDir).toMatch(/evals[\\/]results$/);
  });

  it("reads --flag value and --flag=value, and rejects bad values", () => {
    const o = parseArgs(["--base-url=http://localhost:3200", "--label=baseline-v1", "--pace-ms=0", "--baseline", "evals/results/x.json"]);
    expect(o).toMatchObject({ baseUrl: "http://localhost:3200", label: "baseline-v1", paceMs: 0, baseline: "evals/results/x.json" });
    expect(() => parseArgs(["--base-url", "not a url"])).toThrow(/base-url/);
    expect(() => parseArgs(["--base-url", "http://x", "--label", "../evil"])).toThrow(/label/);
    expect(() => parseArgs(["--base-url", "http://x", "--pace-ms", "-5"])).toThrow(/pace-ms/);
    expect(() => parseArgs(["--base-url", "http://x", "--wat"])).toThrow(/unknown/);
  });

  it("rejects a flag with no value, an empty value, and a base URL with a query or hash", () => {
    expect(() => parseArgs(["--base-url", "http://x", "--label"])).toThrow(/--label needs a value/);
    expect(() => parseArgs(["--base-url", "http://x", "--label", "--pace-ms", "0"])).toThrow(/--label needs a value/);
    expect(() => parseArgs(["--base-url", "http://x", "--pace-ms="])).toThrow(/--pace-ms needs a value/);
    expect(() => parseArgs(["--base-url", "http://x/?a=1"])).toThrow(/query or hash/);
    expect(() => parseArgs(["--base-url", "http://x/#top"])).toThrow(/query or hash/);
  });
});

describe("cli", () => {
  it("exits 2 before any request on a usage error or a missing, unreadable or malformed --baseline", async () => {
    const h = harness();
    const files: Record<string, string> = { "bad.json": "{not json", "shape.json": JSON.stringify({ hello: 1 }) };
    h.deps.readFile = (p) => {
      if (p in files) return files[p];
      if (p === DATASET_PATH) return readFileSync(p, "utf8");
      throw new Error(`ENOENT: ${p}`);
    };
    const base = ["--base-url", "http://localhost:3200", "--pace-ms", "0", "--dataset", DATASET_PATH, "--out-dir", "/virtual"];
    expect(await cli([], h.deps)).toBe(2);
    expect(await cli([...base, "--baseline", "missing.json"], h.deps)).toBe(2);
    expect(await cli([...base, "--baseline", "bad.json"], h.deps)).toBe(2);
    expect(await cli([...base, "--baseline", "shape.json"], h.deps)).toBe(2);
    expect(h.fetchMock).not.toHaveBeenCalled();
    expect(h.writes).toEqual([]);
    expect(h.lines.join("\n")).toMatch(/baseline[\s\S]*missing\.json/);
    expect(await cli(base, h.deps)).toBe(0);
    expect(h.fetchMock).toHaveBeenCalledTimes(13);
  });
});

describe("--out and --out-dir", () => {
  const base = ["--base-url", "http://localhost:3200", "--pace-ms", "0", "--label", "gate", "--dataset", DATASET_PATH];
  const withDirs = (h: ReturnType<typeof harness>, dirs: string[], files: string[] = []) => {
    const made: string[] = [];
    h.deps.pathKind = (p) => (dirs.includes(p) ? "dir" : files.includes(p) ? "file" : null);
    h.deps.mkdir = (p) => {
      made.push(p);
    };
    return made;
  };

  it("treats an existing directory given to --out as the output directory", async () => {
    const h = harness();
    withDirs(h, ["/scratch/evals"]);
    expect(await cli([...base, "--out", "/scratch/evals"], h.deps)).toBe(0);
    expect(h.writes.map((w) => w.path)).toEqual([join("/scratch/evals", "ask-gate-abc2620.json")]);
    expect(h.lines.join("\n")).toContain(`Results: ${join("/scratch/evals", "ask-gate-abc2620.json")}`);
  });

  it("treats an --out ending in a slash as a directory to create", async () => {
    const h = harness();
    const made = withDirs(h, []);
    const { path } = await runEval({ ...opts(), out: "/scratch/new/" }, h.deps);
    expect(path).toBe(join("/scratch/new", "ask-test-abc2620.json"));
    expect(made).toContain(join("/scratch/new"));
  });

  it("still writes a plain file path given to --out", async () => {
    const h = harness();
    withDirs(h, ["/scratch"], ["/scratch/old.json"]);
    const { path } = await runEval({ ...opts(), out: "/scratch/old.json" }, h.deps);
    expect(path).toBe("/scratch/old.json");
    expect(h.writes.map((w) => w.path)).toEqual(["/scratch/old.json"]);
  });

  it("exits 2 before any request when --out-dir is an existing file or --out's folder is a file", async () => {
    const h = harness();
    withDirs(h, [], ["/scratch/a-file"]);
    expect(await cli([...base, "--out-dir", "/scratch/a-file"], h.deps)).toBe(2);
    expect(await cli([...base, "--out", "/scratch/a-file/x.json"], h.deps)).toBe(2);
    expect(await cli([...base, "--out", "/scratch/a-file/"], h.deps)).toBe(2);
    expect(h.fetchMock).not.toHaveBeenCalled();
    expect(h.writes).toEqual([]);
    expect(h.lines.join("\n")).toMatch(/--out-dir \/scratch\/a-file is a file/);
    expect(h.lines).toContain(USAGE);
  });

  it("exits 2 before any request when the output folder can't be created", async () => {
    const h = harness();
    h.deps.mkdir = () => {
      throw new Error("EACCES: permission denied");
    };
    expect(await cli([...base, "--out-dir", "/root-only/results"], h.deps)).toBe(2);
    expect(h.fetchMock).not.toHaveBeenCalled();
    expect(h.lines.join("\n")).toMatch(/can't be created: EACCES/);
  });

  it("documents a directory --out in the usage line", () => {
    expect(USAGE).toMatch(/--out <file\|dir>/);
  });

  it("prints the report even when writing the results file fails, then fails loudly", async () => {
    const h = harness();
    h.deps.writeFile = () => {
      throw new Error("EISDIR: illegal operation on a directory");
    };
    await expect(runEval(opts(), h.deps)).rejects.toThrow(/results file[\s\S]*EISDIR/);
    expect(h.lines.join("\n")).toMatch(/Gate: PASS/);
  });
});

describe("runEval", () => {
  it("posts all 13 cases to /api/ask, scores them, writes ask-{label}-{shortsha}.json and passes the gate", async () => {
    const h = harness();
    const { result, path, exitCode } = await runEval(opts(), h.deps);
    expect(h.calls).toHaveLength(13);
    expect(h.calls[0].url).toBe("http://localhost:3200/api/ask");
    expect(h.calls.map((c) => c.body.question)).toEqual(dataset.cases.map((c) => c.input.question));
    expect(h.calls[1].body.lang).toBe("hi");
    expect(path).toBe(join("/virtual/results", "ask-test-abc2620.json"));
    expect(h.writes).toHaveLength(1);
    expect(JSON.parse(h.writes[0].text)).toEqual(result);
    expect(result.cases).toHaveLength(13);
    expect(result.cases.every((c) => c.pass)).toBe(true);
    expect(result.summary).toMatchObject({ prepared: "10/10", offtopic: "3/3", p50Ms: 1000, p90Ms: 1000, forbiddenHits: 0, unsupportedNumbers: 0, gate: "PASS" });
    expect(exitCode).toBe(0);
  });

  it("EXE13: the prepared gate counts only answers the model wrote; a fallback pass never counts", async () => {
    // Two more prepared cases answered by the fallback (the EVAL-007 fixture already is one), all correct:
    // 10/10 pass, but only 7/10 by the model.
    const h = harness((id) =>
      id === "EVAL-001" || id === "EVAL-002" ? { status: 200, body: { ...good.get(id), mode: "fallback" } } : { status: 200, body: good.get(id) },
    );
    const { result, exitCode } = await runEval(opts(), h.deps);
    expect(result.summary.prepared).toBe("10/10");
    expect(result.summary.preparedByModel).toBe("7/10");
    expect(result.summary.gate).toBe("FAIL");
    expect(result.summary.gateFailures.join(" ")).toMatch(/prepared answered by the model 7\/10 < 9/);
    expect(exitCode).toBe(1);
  });

  it("EXE13: an all-fallback run fails the gate even when every answer is right", async () => {
    const h = harness((id) => ({ status: 200, body: { ...good.get(id), mode: "fallback", provenance: provenance(null) } }));
    const { result } = await runEval(opts(), h.deps);
    expect(result.summary.preparedByModel).toBe("0/10");
    expect(result.summary.gate).toBe("FAIL");
  });

  it("counts prepared passes by the model and warns on each prepared pass that isn't a model answer (9/10 by the model still passes)", async () => {
    // The EVAL-007 fixture is a fallback answer.
    const h = harness();
    const { result } = await runEval(opts(), h.deps);
    expect(result.summary.preparedByModel).toBe("9/10");
    expect(result.summary.warnings).toEqual(["EVAL-007 passed on a fallback answer, not the model"]);
    expect(result.summary.gate).toBe("PASS");
    expect(JSON.parse(h.writes[0].text).summary.preparedByModel).toBe("9/10");
    const out = h.lines.join("\n");
    expect(out).toMatch(/by the model 9\/10/);
    expect(out).toMatch(/Warning: EVAL-007 passed on a fallback answer/);
  });

  it("records provenance: commit, branch, host, model, prompt and dataset versions, dataset hash, timestamp", async () => {
    const { result } = await runEval(opts(), harness().deps);
    expect(result.provenance).toMatchObject({
      commit: "abc2620deadbeefcafe0000000000000000000000",
      branch: "build/stage7",
      dirty: false,
      baseUrlHost: "localhost:3200",
      model: "gemini-3.5-flash",
      modelSource: "responses",
      promptVersion: "ask-v1",
      datasetVersion: "1.0.0",
      datasetHash: bundle.hash,
      localDatasetHash: bundle.hash,
      ts: "2026-09-28T01:42:00.000Z",
      label: "test",
    });
    expect(result.provenance.warnings).toEqual([]);
  });

  it("EXE26: records which model wrote each answer, and counts them", async () => {
    const h = harness((id) => ({ status: 200, body: { ...good.get(id), provenance: provenance(["EVAL-002", "EVAL-005"].includes(id) ? "gemini-2.5-flash" : "gemini-3.5-flash") } }));
    const { result } = await runEval(opts(), h.deps);
    const out = h.lines.join("\n");
    expect(result.cases.find((c) => c.id === "EVAL-002")?.model).toBe("gemini-2.5-flash");
    expect(result.cases.find((c) => c.id === "EVAL-001")?.model).toBe("gemini-3.5-flash");
    // Only model answers count; the EVAL-007 fixture is a fallback answer.
    expect(result.provenance.modelCounts).toEqual({ "gemini-3.5-flash": 10, "gemini-2.5-flash": 2 });
    expect(result.summary.preparedByModel).toBe("9/10");
    expect(out).toMatch(/models gemini-3\.5-flash ×10, gemini-2\.5-flash ×2/);
  });

  it("judges dirty from tracked files only", async () => {
    const h = harness();
    await runEval(opts(), h.deps);
    expect(h.gitCalls).toContainEqual(["status", "--porcelain", "--untracked-files=no"]);
  });

  it("says when no answer came from the model", async () => {
    const h = harness((id) => ({ status: 200, body: { ...good.get(id), mode: "fallback", provenance: provenance(null) } }));
    h.deps.env = { ASK_MODEL: "gemini-3.5-flash" };
    const { result } = await runEval(opts(), h.deps);
    expect(result.provenance).toMatchObject({ model: "gemini-3.5-flash", modelSource: "ASK_MODEL env", modelsSeen: [] });
    expect(result.provenance.warnings.join(" ")).toMatch(/no answer came from the model/);
    expect(result.summary.modes).toEqual({ fallback: 13 });
  });

  it("keeps a failed case in the results, lists it, and still passes at 9/10", async () => {
    // Every other answer comes from the model, so the gate (EXE13: model answers only) sees 9/10.
    const h = harness((id) =>
      id === "EVAL-003"
        ? { status: 200, body: { mode: "model", answer: "RJ14 GC 3309 earns about ₹13 per km.", lang: "en", cites: [], provenance: provenance() } }
        : { status: 200, body: { ...good.get(id), mode: "model", provenance: provenance() } },
    );
    const { result, exitCode } = await runEval(opts(), h.deps);
    expect(result.cases).toHaveLength(13);
    const c3 = result.cases.find((c) => c.id === "EVAL-003")!;
    expect(c3.pass).toBe(false);
    expect(c3.checks.facts).toBe(false);
    expect(c3.answer).toContain("₹13");
    expect(result.summary.prepared).toBe("9/10");
    expect(result.summary.failedCases).toEqual(["EVAL-003"]);
    expect(result.summary.gate).toBe("PASS");
    expect(exitCode).toBe(0);
    expect(h.lines.join("\n")).toMatch(/Failed cases[\s\S]*EVAL-003/);
  });

  it("fails the gate and exits non-zero at 8/10, on a network error, and on a forbidden word", async () => {
    const w = (...p: string[]) => p.join("");
    const h = harness((id) => {
      if (id === "EVAL-001") return new Error("fetch failed", { cause: { code: "ECONNREFUSED" } });
      if (id === "EVAL-002") return { status: 500, body: "oops" };
      if (id === "EVAL-011") return { status: 200, body: { mode: "model", answer: `I don't have that. ${w("th", "eft")}`, lang: "en", cites: [], provenance: provenance() } };
      return { status: 200, body: { ...good.get(id), provenance: provenance() } };
    });
    const { result, exitCode } = await runEval(opts(), h.deps);
    expect(result.cases).toHaveLength(13);
    const c1 = result.cases.find((c) => c.id === "EVAL-001")!;
    expect(c1).toMatchObject({ pass: false, mode: "error", httpStatus: null });
    expect(c1.notes.join(" ")).toMatch(/ECONNREFUSED/);
    expect(result.cases.find((c) => c.id === "EVAL-002")).toMatchObject({ pass: false, mode: "error", httpStatus: 500 });
    expect(result.summary).toMatchObject({ prepared: "8/10", offtopic: "2/3", forbiddenHits: 1, gate: "FAIL" });
    expect(result.summary.gateFailures.join(" ")).toMatch(/prepared answered by the model 7\/10 < 9[\s\S]*off-topic 2\/3 < 3[\s\S]*forbidden/);
    expect(exitCode).toBe(1);
  });

  it("fails the gate when the median latency is 4 s or more", async () => {
    const { result, exitCode } = await runEval(opts(), harness(undefined, 4000).deps);
    expect(result.summary.p50Ms).toBe(4000);
    expect(result.summary.gate).toBe("FAIL");
    expect(result.summary.gateFailures.join(" ")).toMatch(/p50/);
    expect(exitCode).toBe(1);
  });

  it("paces requests 12 s apart by default and not at all with --pace-ms 0", async () => {
    const paced = harness();
    await runEval(opts({ paceMs: 12000 }), paced.deps);
    // The clock moves 1 s per request, so each wait tops up to 12 s.
    expect(paced.sleeps).toEqual(Array(12).fill(11000));
    const unpaced = harness();
    await runEval(opts(), unpaced.deps);
    expect(unpaced.sleeps).toEqual([]);
  });

  it("waits out a 429 once and retries the case", async () => {
    const h = harness((id, attempt) =>
      id === "EVAL-004" && attempt === 1
        ? { status: 429, body: { mode: "saved", answer: "Your question is saved.", lang: "en", cites: [], retryAfterS: 7, provenance: provenance(null) } }
        : { status: 200, body: { ...good.get(id), provenance: provenance() } },
    );
    const { result } = await runEval(opts(), h.deps);
    expect(h.sleeps).toEqual([7000]);
    expect(h.calls).toHaveLength(14);
    expect(result.cases.find((c) => c.id === "EVAL-004")).toMatchObject({ pass: true, retried: true, httpStatus: 200 });
  });

  it("warns when the server's dataset hash or prompt version differs from this checkout", async () => {
    const h = harness((id) => ({ status: 200, body: { ...good.get(id), provenance: { ...provenance(), datasetHash: "000000000000", promptVersion: "ask-v2" } } }));
    const { result } = await runEval(opts(), h.deps);
    expect(result.provenance.datasetHash).toBe("000000000000");
    expect(result.provenance.warnings.join(" ")).toMatch(/datasetHash[\s\S]*promptVersion/);
  });

  it("reports the delta against a baseline file", async () => {
    const baseline = { provenance: { commit: "1111111" }, cases: dataset.cases.map((c) => ({ id: c.id, pass: c.id !== "EVAL-003" && c.id !== "EVAL-009" })), summary: { prepared: "8/10", offtopic: "3/3", p50Ms: 1500 } };
    const h = harness((id) =>
      id === "EVAL-006"
        ? { status: 200, body: { mode: "model", answer: "Something happened.", lang: "en", cites: [{ tripId: "0926-04", label: "" }], provenance: provenance() } }
        : { status: 200, body: { ...good.get(id), provenance: provenance() } },
    );
    h.deps.readFile = (p) => (p === "base.json" ? JSON.stringify(baseline) : readFileSync(p, "utf8"));
    const { result } = await runEval(opts({ baseline: "base.json" }), h.deps);
    expect(result.summary.vsBaseline).toEqual({
      file: "base.json",
      commit: "1111111",
      prepared: "+1",
      offtopic: "+0",
      p50Ms: "-500",
      regressed: ["EVAL-006"],
      fixed: ["EVAL-003", "EVAL-009"],
    });
    expect(h.lines.join("\n")).toMatch(/vs baseline/);
  });

  it("prints a table row for every case and never prints a key", async () => {
    const h = harness();
    h.deps.env = { VERCEL_AUTOMATION_BYPASS_SECRET: "bypass-secret-value" };
    await runEval(opts(), h.deps);
    const out = h.lines.join("\n");
    for (const c of dataset.cases) expect(out).toContain(c.id);
    expect(out).toMatch(/Gate: PASS/);
    expect(out).not.toContain("bypass-secret-value");
    expect(h.calls[0].headers["x-vercel-protection-bypass"]).toBe("bypass-secret-value");
  });

  it("writes to --out when given", async () => {
    const h = harness();
    const { path } = await runEval(opts({ out: "/scratch/ask-smoke-nokey.json", note: "no GEMINI_API_KEY; fallback path only; not a baseline" }), h.deps);
    expect(path).toBe("/scratch/ask-smoke-nokey.json");
    expect(JSON.parse(h.writes[0].text).provenance.note).toBe("no GEMINI_API_KEY; fallback path only; not a baseline");
  });

  it("fails the gate at 9/10 when the failing prepared answer carries a figure outside the data (§2)", async () => {
    const h = harness((id) =>
      id === "EVAL-005"
        ? { status: 200, body: { mode: "model", answer: "₹1,86,400 earned; ₹11,430 doesn't add up on 3 trips; ₹14,999 more.", lang: "en", cites: [{ tripId: "0926-04", label: "" }, { tripId: "0927-02", label: "" }, { tripId: "0926-11", label: "" }], provenance: provenance() } }
        : { status: 200, body: { ...good.get(id), provenance: provenance() } },
    );
    const { result, exitCode } = await runEval(opts(), h.deps);
    expect(result.summary.prepared).toBe("9/10");
    expect(result.summary.gate).toBe("FAIL");
    expect(result.summary.gateFailures.join(" ")).toMatch(/figure outside the data: EVAL-005/);
    expect(exitCode).toBe(1);
  });

  it("fails the gate at 9/10 when a Hindi question gets a non-Hindi answer (§2)", async () => {
    const h = harness((id) =>
      id === "EVAL-009"
        ? { status: 200, body: { mode: "model", answer: "RJ14 GC 7710 (Mahesh Meena) earns the most: ₹31.8 per km.", lang: "en", cites: [], provenance: provenance() } }
        : { status: 200, body: { ...good.get(id), provenance: provenance() } },
    );
    const { result, exitCode } = await runEval(opts(), h.deps);
    expect(result.summary.prepared).toBe("9/10");
    expect(result.summary.gate).toBe("FAIL");
    expect(result.summary.gateFailures.join(" ")).toMatch(/Hindi question answered in another language: EVAL-009/);
    expect(exitCode).toBe(1);
  });

  it("redacts key-shaped strings and the bypass value in printed and written answers, keeping the leak count", async () => {
    const key = ["AI", "za"].join("") + "k".repeat(35);
    const h = harness((id) =>
      id === "EVAL-013"
        ? { status: 200, body: { mode: "model", answer: `I can't answer that. ${key} bypass-secret-value`, lang: "en", cites: [], provenance: provenance() } }
        : { status: 200, body: { ...good.get(id), provenance: provenance() } },
    );
    h.deps.env = { VERCEL_AUTOMATION_BYPASS_SECRET: "bypass-secret-value" };
    const { result } = await runEval(opts(), h.deps);
    const c13 = result.cases.find((c) => c.id === "EVAL-013")!;
    expect(c13.answer).toBe("I can't answer that. [redacted] [redacted]");
    expect(c13.leaks).toBeGreaterThan(0);
    expect(c13.pass).toBe(false);
    const everything = h.writes[0].text + h.lines.join("\n");
    expect(everything).not.toContain(key);
    expect(everything).not.toContain("bypass-secret-value");
  });

  it("fails the gate on a key-shaped string in any answer, even with every count met", async () => {
    const key = ["AI", "za"].join("") + "z".repeat(35);
    const h = harness((id) =>
      id === "EVAL-001"
        ? { status: 200, body: { ...good.get(id), answer: `${good.get(id)!.answer} ${key}`, provenance: provenance() } }
        : { status: 200, body: { ...good.get(id), provenance: provenance() } },
    );
    const { result, exitCode } = await runEval(opts(), h.deps);
    expect(result.summary.prepared).toBe("9/10");
    expect(result.summary.gateFailures.join(" ")).toMatch(/key-shaped string in an answer: EVAL-001/);
    expect(exitCode).toBe(1);
  });

  it("records a timed-out request as an error case", async () => {
    const h = harness((id) => (id === "EVAL-008" ? "hang" : { status: 200, body: { ...good.get(id), provenance: provenance() } }));
    const { result } = await runEval(opts({ timeoutMs: 20 }), h.deps);
    const c8 = result.cases.find((c) => c.id === "EVAL-008")!;
    expect(c8).toMatchObject({ pass: false, mode: "error", httpStatus: null });
    expect(c8.notes[0]).toMatch(/timed out after 20 ms/);
  });

  it("records a non-JSON body (an HTML 401 page) as an error case", async () => {
    const h = harness((id) => (id === "EVAL-007" ? { status: 401, raw: "<!doctype html><title>401</title>" } : { status: 200, body: { ...good.get(id), provenance: provenance() } }));
    const { result } = await runEval(opts(), h.deps);
    const c7 = result.cases.find((c) => c.id === "EVAL-007")!;
    expect(c7).toMatchObject({ pass: false, mode: "error", httpStatus: 401 });
    expect(c7.notes[0]).toMatch(/HTTP 401: body is not an AskResponse/);
  });

  it("retries a 429 only once: a second 429 is scored as it came", async () => {
    const saved = { mode: "saved", answer: "Your question is saved.", lang: "en", cites: [], retryAfterS: 7, provenance: provenance(null) };
    const h = harness((id) => (id === "EVAL-004" ? { status: 429, body: saved } : { status: 200, body: { ...good.get(id), provenance: provenance() } }));
    const { result } = await runEval(opts(), h.deps);
    expect(h.sleeps).toEqual([7000]);
    expect(h.calls).toHaveLength(14);
    const c4 = result.cases.find((c) => c.id === "EVAL-004")!;
    expect(c4).toMatchObject({ pass: false, mode: "saved", httpStatus: 429, retried: true });
    expect(c4.notes[0]).toBe("HTTP 429");
  });

  it("does not retry a 429 without retryAfterS", async () => {
    const saved = { mode: "saved", answer: "Your question is saved.", lang: "en", cites: [], provenance: provenance(null) };
    const h = harness((id) => (id === "EVAL-004" ? { status: 429, body: saved } : { status: 200, body: { ...good.get(id), provenance: provenance() } }));
    const { result } = await runEval(opts(), h.deps);
    expect(h.sleeps).toEqual([]);
    expect(h.calls).toHaveLength(13);
    expect(result.cases.find((c) => c.id === "EVAL-004")).toMatchObject({ httpStatus: 429, pass: false });
    expect(result.cases.find((c) => c.id === "EVAL-004")).not.toHaveProperty("retried");
  });
});
