/**
 * TSK-07.1 · Probe the Gemini model before relying on it (TP5).
 *
 *   pnpm tsx --conditions=react-server scripts/probe-gemini.ts
 *
 * (The condition satisfies `import "server-only"` in lib/ask/config.ts and gemini.ts.)
 *
 * Reads GEMINI_API_KEY from the environment and never prints it. Lists the
 * models whose id matches ASK_MODEL (default gemini-3.5-flash), then makes one
 * timed call with a ~200-token context for each thinking setting, from the
 * fastest down, and prints the model id, the latency and which thinking config
 * the model accepted. Record the result as TP5 / an EXE decision in
 * decisions.md via the ledger, and set DEFAULT_THINKING_LEVEL in lib/ask/config.ts.
 *
 * Without a key it prints that the probe is BLOCKED-pending-key and exits 0
 * (decisions.md EXE3).
 */
import { askConfig, GEMINI_BASE_URL, type AskConfig } from "@/lib/ask/config";
import { requestBody } from "@/lib/ask/gemini";
import { ModelAnswer } from "@/lib/ask/schema";

const TINY_CONTEXT = JSON.stringify({
  fleet: { name: "Sharma Roadlines", base: "Jaipur", trucks: 24, dieselInrPerL: 90 },
  yesterday: { day: "Sun 27 Sep", trips: 17, freightInr: 412000, profitInr: 186400, unaccountedInr: 11430, unaccountedL: 127, flaggedTrips: ["0926-04", "0927-02", "0926-11"] },
  flags: [
    { trip: "0926-04", plate: "RJ14 GB 4521", driver: "Ramesh Kumar", rule: "R1 · Stationary fuel drop", litres: 38, inr: 3420, confidence: "High", place: "Behror" },
    { trip: "0927-02", plate: "RJ14 GA 1182", driver: "Vikram Choudhary", rule: "R2 · Refuel mismatch", litres: 50, inr: 4500, confidence: "Likely", place: "Kishangarh pump" },
    { trip: "0926-11", plate: "RJ14 GC 3309", driver: "Anil Bairwa", rule: "R3 · Excess consumption", litres: 39, inr: 3510, confidence: "Check", place: null },
  ],
});
const QUESTION = "How much did we earn yesterday, and how much doesn't add up?";
const THINKING_TRIES: AskConfig["thinking"][] = [{ thinkingLevel: "minimal" }, { thinkingLevel: "low" }, null];

function redact(text: string, key: string): string {
  return text.split(key).join("[redacted]").slice(0, 300);
}

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    console.log("GEMINI_API_KEY not set — probe BLOCKED-pending-key");
    return;
  }
  const base = askConfig();
  const headers = { "content-type": "application/json", "x-goog-api-key": key };

  const list = await fetch(`${GEMINI_BASE_URL}?pageSize=1000`, { headers });
  if (list.ok) {
    const { models = [] } = (await list.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const stem = base.model.split("-").slice(0, 2).join("-");
    const matches = models.filter((m) => m.name.includes(stem));
    console.log(`models matching "${stem}":`);
    for (const m of matches) console.log(`  ${m.name}${m.name.endsWith(`/${base.model}`) ? "   <- ASK_MODEL" : ""}`);
    if (!matches.some((m) => m.name.endsWith(`/${base.model}`))) console.log(`  (ASK_MODEL ${base.model} is not listed; pick the closest Flash model and record an EXE decision)`);
  } else {
    console.log(`list models: HTTP ${list.status} ${redact(await list.text(), key)}`);
  }

  for (const thinking of THINKING_TRIES) {
    const config: AskConfig = { ...base, thinking };
    const t0 = performance.now();
    const res = await fetch(`${GEMINI_BASE_URL}/${encodeURIComponent(config.model)}:generateContent`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody(TINY_CONTEXT, QUESTION, config)),
    });
    const ms = Math.round(performance.now() - t0);
    const label = thinking ? JSON.stringify({ thinkingConfig: thinking }) : "no thinkingConfig";
    if (!res.ok) {
      console.log(`${label}: HTTP ${res.status} after ${ms} ms — ${redact(await res.text(), key)}`);
      continue;
    }
    const body = (await res.json()) as {
      modelVersion?: string;
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      usageMetadata?: Record<string, number>;
    };
    const text = body.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
    let valid = false;
    try {
      valid = ModelAnswer.safeParse(JSON.parse(text)).success;
    } catch {
      valid = false;
    }
    console.log(`model: ${body.modelVersion ?? config.model}`);
    console.log(`accepted: ${label}`);
    console.log(`latency: ${ms} ms (target < 4000 ms end to end)`);
    console.log(`schema-valid answer: ${valid}`);
    console.log(`usage: ${JSON.stringify(body.usageMetadata ?? {})}`);
    console.log(`answer: ${redact(text, key)}`);
    return;
  }
  console.log("No thinking setting was accepted; see the errors above.");
  process.exitCode = 1;
}

main().catch((e: unknown) => {
  console.error(`probe failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
});
