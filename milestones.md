# Milestones — Urja

**Stage:** 5 · Problem Breakdown (combined with Stage 6 under S9) · **Ticket:** TASK-4 · **Status:** Approved 2026-09-29 ("use chrome and do it")
**Inputs:** `Solution-PRD.md` (acceptance #1–#6), `Design.md` (Design Freeze, §26), `decisions.md` (S1–S10, D1–D6), `HANDOFF.md` (fixed numbers)
**Companions:** `tickets.md` (tickets, dependencies, TC-/EVAL- links), `technical-plan.md` (how), `test-cases.md` (TC-), `evals/` (EVAL-)
**Calendar:** build 2026-09-30 → 10-03 in a claude.ai/code cloud session; QA and deploy 10-04; interview 10-07.

## At a glance

| ID | Milestone | Due | Tickets | sp | Priority | Status |
|---|---|---|---|---|---|---|
| M-001 | Data truth and foundation | 2026-09-30 | TKT-01, TKT-02, TKT-03 | 14 | P0 | To Do |
| M-002 | The demo path on real data | 2026-10-02 | TKT-04, TKT-05, TKT-06, TKT-10, TKT-11 | 26 | P0 | To Do |
| M-003 | Ask Urja, grounded and measured | 2026-10-02 | TKT-07, TKT-12, TKT-13 | 16 | P0 | To Do |
| M-004 | Delighter and public surface | 2026-10-03 | TKT-08, TKT-09, TKT-14 | 14 | P1 | To Do |
| M-005 | Release | 2026-10-04 | TKT-15, TKT-16 | 12 | P0 | To Do |

`sp` = estimated agent-hours, which is how Campfire's Gantt reads them (its axis is elapsed hours). The total is 82 h: 70 h of build and 12 h of release. The critical path, TKT-01 → TKT-02 → TKT-05 → TKT-10 → TKT-14 → TKT-15 → TKT-16, is 38 h. At about 10 agent-hours a day, with 2–3 parallel streams, the build fits 09-30 → 10-03 and leaves buffer on 10-03; QA and deploy take 10-04.

**Sequence:** M-001 must finish first. M-002, M-003 and M-004 then run as parallel streams (see `technical-plan.md` §15). M-005 needs all of them.

**Out of scope (unchanged from Solution-PRD and Design.md):**
- the Truck Report Card and the per-truck page (Design.md §8 defers them; Solution-PRD cuts them first);
- the "day" theme;
- real telemetry, login, WhatsApp sending and Bytebeam branding.

---

## M-001 · Data truth and foundation
- **Objective.** Fire the tracer bullet at the riskiest assumption first: that one simulated fleet, run through real rules, reproduces every fixed number in `HANDOFF.md` exactly. Stand up the toolchain, the cloud workflow and a Vercel preview on day 1.
- **Scope.**
  - Next.js scaffold, CI and a Vercel preview.
  - The Sharma Roadlines scenario: 24 trucks, trips from 29 Aug to 27 Sep, 212 September trips.
  - The telemetry simulator; rules R1–R5 with confidence; ledgers and aggregates; golden tests.
  - The Today verdict and ledger bar, computed from that data.
  - The Lamplight foundation: tokens, fonts, icons, the app shell, and the primitive and chart components.
- **Deliverables.** A preview URL showing the computed verdict; `pnpm verify` green; `lib/data/scenario/scenario.json` committed; golden tests for all fixed numbers.
- **Tickets.** TKT-01 → (TKT-02 ∥ TKT-03).
- **Dependencies.** TASK-4 (this plan) approved; the pre-flight in `technical-plan.md` §16.1 done by the user (Vercel project, cloud environment, key location).
- **Entry.** Plan signed off; the plan is pushed to `origin/main`; the cloud session is started on branch `build/stage7`.
- **Exit.**
  - TC-001 to TC-014 pass.
  - The preview renders "Your trucks earned ₹1,86,400 yesterday. ₹11,430 of it doesn't add up, across 3 trips." from the engine.
  - The shell renders at 375, 768 and 1440 px with no horizontal scroll.
  - CI is green. The user signs off at the phase gate.
- **DoD.** Base DoD (eval-framework) plus: determinism test (TC-012) passes; no `Date.now()` or `Math.random()` under `lib/data`; the scenario file is reviewed in the PR diff.
- **Risks.**
  - Latent contradictions in the fixed numbers. Four were found and resolved in planning (`technical-plan.md` §4.9).
  - The balancing solver takes longer than planned. Mitigation: the generator is a one-off script whose output is committed, so it can be hand-tuned.
- **Sequence / priority / status:** 1 · P0 · To Do.

## M-002 · The demo path on real data
- **Objective.** The owner's journey runs end to end on the preview: Message → Brief → Trip evidence → Today. Every screen is computed from the same data, at 375, 768 and 1440 px, with all four states.
- **Scope.**
  - Today's "Needs your eyes", September cards and trucks table.
  - The Trip evidence page for every trip.
  - The 7 AM message and the Morning brief (Hindi first) with the brief template.
  - The MapLibre hero (Map and Fleet views) with list ↔ map linking (D4), and the trip route map.
  - Screen states and the `?state=` switch.
- **Deliverables.** The demo path works on the preview; the states are reachable through `?state=`; TCs pass.
- **Tickets.** TKT-04, TKT-05, TKT-06 (after M-001) → TKT-10, TKT-11.
- **Dependencies.** M-001.
- **Entry.** M-001 exit met.
- **Exit.** TC-015, TC-020 (steps 1–4), TC-021, TC-022, TC-023, TC-024, TC-025, TC-027 and TC-028 pass on the preview. The user signs off at the phase gate.
- **DoD.** Base DoD plus a mockup-parity screenshot pair per screen (`final/*.html` vs build) attached to the gate.
- **Risks.**
  - Visual drift from `final/`. Mitigation: port `lamp.css` rules verbatim (TP4).
  - Carto tiles are blocked in the cloud sandbox. Mitigation: E2E asserts the tiles-failure state; the live map is checked on the preview.
- **Sequence / priority / status:** 2 · P0 · To Do.

## M-003 · Ask Urja, grounded and measured
- **Objective.** Show that the AI is real and safe. A live Gemini answer cites trips, answers in the question's language, and never invents a rupee. When anything fails, the deterministic fallback answers from the data. The eval measures all of this.
- **Scope.**
  - The `/api/ask` route: context builder, Gemini client with an 8 s timeout, citation guard, per-IP rate limit, daily cap, deterministic fallback, logs.
  - The drawer (⌘K, focus trap) and the phone dock.
  - The eval harness: dataset of 10 + 3, number-accuracy scorer, runner, baseline.
- **Deliverables.** Live answers on the preview; `evals/results/ask-baseline-v1.json`; the fallback shows when the key is removed or the model times out.
- **Tickets.** TKT-07 (after TKT-02) → TKT-12 ∥ TKT-13.
- **Dependencies.** TKT-02 (data), TKT-03 (UI), TKT-05 (cite links), TKT-06 (dock). The key must be available to the preview (Vercel env) and, if possible, to the cloud session (`technical-plan.md` §16.1).
- **Entry.** M-001 exit met; the model ID has been checked with `scripts/probe-gemini.ts`.
- **Exit.**
  - TC-026 and TC-040 to TC-046 pass.
  - The baseline eval run is persisted.
  - The final gate (checked in TKT-15): EVAL-001 to EVAL-010 ≥ 9/10, EVAL-011 to EVAL-013 3/3, p50 latency < 4 s, 0 forbidden words, 0 unsupported ₹ or litre figures.
- **DoD.** Base DoD plus the AI block: dataset versioned; suite executed; prompt and model configuration recorded in the results file; critical grounding evals pass.
- **Risks.**
  - The `gemini-3.5-flash` ID or its config options differ from what's expected. Mitigation: probe it first; record TP5.
  - Latency above 4 s. Mitigation: a compact context, minimal thinking, JSON output.
  - The key is unavailable in the cloud. Mitigation: run the eval against the preview.
- **Sequence / priority / status:** 3 (parallel with M-002) · P0 · To Do.

## M-004 · Delighter and public surface
- **Objective.** Add the user-mandated 3D reconstruction (D3) without risking the demo, and make the link travel: the Why Urja page plus correct Open Graph and Twitter previews.
- **Scope.**
  - The procedural three.js scene in the Today hero (Scene is the default), with poster fallback, software-GPU guard, context-loss handling, dispose on route change, and rotate/reset buttons.
  - The Why Urja page.
  - OG and Twitter metadata with a 1200×630 image rendered from the approved OG mockup.
- **Deliverables.** The scene runs on a real GPU and falls back to the poster elsewhere; `/why`; `public/og.png`; metadata in server-rendered HTML.
- **Tickets.** TKT-08, TKT-09 (after TKT-03); TKT-14 (after TKT-10).
- **Dependencies.** TKT-03; TKT-10 (hero container).
- **Entry.** M-001 exit met.
- **Exit.** TC-029, TC-050 and TC-055 pass on the preview; the TC-030 manual check passes on the Mac GPU. The user signs off.
- **DoD.** Base DoD plus the performance block: three.js and MapLibre are absent from the initial JS; Today's LCP ≤ 2.5 s (mobile profile).
- **Risks.**
  - The 3D scene hangs a weak GPU. Mitigation: the guard, the poster, a pixel-ratio cap and render-when-visible.
  - OG crawlers cache a bad image. Mitigation: verify before sharing; version the URL (`?v=N`).
- **Sequence / priority / status:** 4 (parallel with M-002 and M-003) · P1 · To Do.

## M-005 · Release
- **Objective.** Prove acceptance #1–#6 against reality and ship to the production URL the interviewer will open.
- **Scope.**
  - One design critique pass (Stage 8, `impeccable`).
  - One code-review, test and eval pass (Stage 9) and a security review (Stage 10).
  - `QA-report.md`.
  - Merge `build/stage7` → `main`; the Vercel production deploy; link-preview checks in LinkedIn Post Inspector and opengraph.xyz; monitoring notes; `lesson-learnt.md`.
- **Deliverables.** `QA-report.md`; `evals/results/ask-eval-run-v1.json` and `evals/reports/eval-report-v1.md`; the production URL; the unfurl evidence.
- **Tickets.** TKT-15 → TKT-16.
- **Dependencies.** M-002, M-003, M-004.
- **Entry.** Every build ticket is Done on `build/stage7`.
- **Exit.** The user approves the QA-report gate. Production verified: TC-020 on production, TC-050, TC-051.
- **DoD.** The universal DoD; the release gates in `evals/evaluation-plan.md` §7; thresholds are not weakened.
- **Risks.**
  - Critique findings eat into 10-04. Mitigation: DES- findings are triaged (fix, or park with a reason).
  - The LinkedIn inspector is unavailable. Mitigation: mark it BLOCKED, not PASS; retry.
- **Sequence / priority / status:** 5 · P0 · To Do.
