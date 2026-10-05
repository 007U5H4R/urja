# Ask Urja eval report v1 (Stage 9, TSK-15.2)

**Status: gate FAIL on a real measurement.** final-v1 attempt 2 (2026-10-05 ~18:50 UTC) got a Gemini answer on all 13 cases, none cached. Result:
- prepared 7/10 answered by the model (the gate needs ≥ 9);
- off-topic 3/3 refused by the model;
- no forbidden words and no unsupported figures.

The release went ahead on the QA-report condition: the gate is recorded honestly, not as passed.

The gate (evaluation-plan §7, with EXE13): prepared ≥ 9/10 answered by the model, off-topic 3/3, forbidden 0, and the §2 blockers clear.

| | baseline-v1 | final-v1 attempt 1 | **final-v1 attempt 2** | target |
|---|---|---|---|---|
| Commit · prompt | 1395e7c · ask-v1 | 73da37a · ask-v2 (EXE30) | d72f4d9 · ask-v2 + EXE31 | release candidate |
| Run (UTC) | 2026-10-05 ~02:30 | 2026-10-05 04:38 | 2026-10-05 ~18:50 | — |
| Prepared (all passes) | 7/10 | 10/10 | 7/10 | — |
| **Prepared, answered by the model** | **3/10** | **0/10** | **7/10** | **≥ 9/10** |
| Off-topic | 1/3 | 3/3 (all deterministic refusals) | 3/3 (all model refusals) | 3/3 |
| Forbidden words | 0 | 0 | 0 | 0 |
| Unsupported figures | 0 | 0 | 0 | 0 |
| p50 / p90 (client, via the agent proxy) | 2.6 s / 4.5 s | 0.75 s / 0.86 s (no model calls) | 3.1 s / 5.9 s (13 live, 0 cached) | p50 < 4 s (TKT-07 AC6) |
| Modes | model 7, fallback 4, saved 2 | fallback 10, saved 3 | model 13 | — |
| Gate | FAIL | FAIL | FAIL | PASS |

Results:
- `evals/results/ask-baseline-v1-1395e7c.json`
- `evals/results/ask-final-v1-73da37a.json`
- `evals/results/ask-final-v1-d72f4d9.json`

## final-v1 attempt 2: what still fails
- **EVAL-001** ("who had the most unaccounted diesel"):
  - The answer names Anil Bairwa, 125 L and ₹11,250, but not his plate.
  - It says **"across 10 trips"**, but the 125 L comes from **3** flagged trips, so the count is wrong. The guard checks ₹ and litre figures, not trip counts.
- **EVAL-005:** the figures are right, but it leaves out "across 3 trips". `missing=count` flagged it.
- **EVAL-007:** it gives ₹21,600 recovered but omits ₹58,240 flagged and 37%.
- **Improved since the baseline:** EVAL-002, 006, 011 and 013. The model now gives counts and place/time on those, and refuses off-topic questions itself.
- **Regressed:** EVAL-001 and 007.
- **Next fix (ask-v3, not done):**
  - check trip counts in the guard, against the cited trips;
  - have the prompt require the plate with a driver's name, and the flagged total plus the rate for a recovery question.
  - Then re-run final-v1 within the free-tier budget.

## What the baseline showed and what changed (EXE30, 8bcb303)
- **Missing facts.** EVAL-002, 005 and 006 left out the count, place or time.
  - Fix: the context now carries trip counts, and the ask-v2 rule 8 asks for count, place and time.
  - A diagnostic `missing=` in `x-ask-outcome` names any omission. It never rewrites the answer.
- **Fallbacks.** EVAL-001, 007, 008 and 009 fell back. The likely cause is that the guard dropped flag-id cites (`0926-11-R3`) to zero citations.
  - Fix: a flag id now maps to its trip, the context lists the recovered and wrong trips, and rule 7 says to cite trips.
  - A cited plate grounds an answer only when the answer names it.
- **Off-topic.** EVAL-011 and 013 got "saved", which carries no refusal wording.
  - Fix: a fixed refusal on non-model paths.
  - The runner warns when an off-topic case passes on a refusal rather than a model answer. Whether off-topic should count only model answers is open for the user (EXE30, B2).
- **Diagnostics.** The runner now records `x-ask-outcome` for every case.

## Why final-v1 attempt 1 is not a measure of ask-v2
- Every call got **429 from `gemini-3.5-flash`** (quota). The fallback model, `gemini-2.5-flash`, then answered 404 for this key, as already known from EXE26.
- Probe: `x-ask-outcome: http_4xx:404; model=gemini-2.5-flash; after=http_429:429 gemini-3.5-flash`.
- The runner's outcome column shows only the last attempt (`http_4xx:404`). The first attempt's 429 is visible in the header's `after=`. Runner improvement for later: count the first attempt's code.
- The day's calls (critique, baseline, QA, eval) most likely used up the key's free-tier daily quota.
- The deterministic paths behaved correctly: all 10 prepared cases had the right figures, all 3 off-topic cases were refused, and there were no forbidden words and no leaks.

## To unblock (the user's item, as before)
- Billing or quota on the Vercel key's Google AI Studio project.
- Optionally, set `ASK_FALLBACK_MODEL` to a model this key lists, then redeploy. Don't set it to an unverified id.
- Then: `pnpm eval --base-url <preview> --label final-v1 --baseline evals/results/ask-baseline-v1-1395e7c.json`.
