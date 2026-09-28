# Tickets — Urja

**Stage:** 5 · Problem Breakdown (with Stage 6, S9) · **Ticket:** TASK-4 · **Status:** Approved 2026-09-29; live in Campfire
**Canonical IDs:** Campfire native IDs. `TKT-##` is the provisional planning ID, kept in titles for traceability. The atomic steps for each `TSK-##.#` are in `technical-plan.md` §17. TC- cases are in `test-cases.md`; EVAL- cases are in `evals/eval-dataset.json`.
**Types and priorities** follow the global CLAUDE.md ("Campfire Ticket per Request").
- P0 means the demo breaks without it.
- P1 means an acceptance criterion or approved design element that has a fallback.
- Nothing in the build is P2 or P3: those items were already cut in Stages 2 and 4.

## Mapping (Campfire project `urja`)

| TKT | Campfire | Title | Type | Pri | sp | Milestone | Depends on | Owner | Due |
|---|---|---|---|---|---|---|---|---|---|
| — | TASK-4 | Plan the Urja build (this stage) | docs | P1 | 2 | — | — | @claude | 2026-09-29 |
| TKT-01 | TASK-5 | Scaffold the Next.js app, CI and a Vercel preview for the Urja shell | chore | P0 | 2 | M-001 (m-0) | TASK-4 | @claude-cloud | 09-30 |
| TKT-02 | TASK-6 | Simulate Sharma Roadlines and compute Today's verdict with rules R1–R5 | feature | P0 | 6 | M-001 (m-0) | TASK-5 | @claude-cloud | 09-30 |
| TKT-03 | TASK-7 | Build the Lamplight foundation: tokens, fonts, shell and chart primitives | feature | P0 | 6 | M-001 (m-0) | TASK-5 | @claude-cloud | 09-30 |
| TKT-04 | TASK-8 | Finish Today: Needs your eyes, the September cards and the trucks table | feature | P0 | 4 | M-002 (m-1) | TASK-6, TASK-7 | @claude-cloud | 10-01 |
| TKT-05 | TASK-9 | Build the Trip evidence page for every trip | feature | P0 | 8 | M-002 (m-1) | TASK-6, TASK-7 | @claude-cloud | 10-01 |
| TKT-06 | TASK-10 | Build the 7 AM message and the Morning brief in Hindi and English | feature | P0 | 6 | M-002 (m-1) | TASK-6, TASK-7 | @claude-cloud | 10-01 |
| TKT-07 | TASK-11 | Serve Ask Urja from /api/ask with guards and a deterministic fallback | feature | P0 | 8 | M-003 (m-2) | TASK-6 | @claude-cloud | 10-01 |
| TKT-08 | TASK-12 | Publish the Why Urja page | feature | P1 | 4 | M-004 (m-3) | TASK-7 | @claude-cloud | 10-02 |
| TKT-09 | TASK-13 | Make the link preview travel: OG and Twitter tags with a 1200×630 image | feature | P1 | 4 | M-004 (m-3) | TASK-7 | @claude-cloud | 10-02 |
| TKT-10 | TASK-14 | Wire the maps: Today hero Map and Fleet views, list ↔ map linking and the trip route | feature | P1 | 4 | M-002 (m-1) | TASK-8, TASK-9 | @claude-cloud | 10-02 |
| TKT-11 | TASK-15 | Give every data view its four states | feature | P1 | 4 | M-002 (m-1) | TASK-8, TASK-9, TASK-10 | @claude-cloud | 10-02 |
| TKT-12 | TASK-16 | Let owners ask: the ⌘K drawer and the phone dock | feature | P0 | 4 | M-003 (m-2) | TASK-11, TASK-9, TASK-10 | @claude-cloud | 10-02 |
| TKT-13 | TASK-17 | Measure Ask Urja: eval runner, number-accuracy scorer and baseline | task | P1 | 4 | M-003 (m-2) | TASK-11 | @claude-cloud | 10-02 |
| TKT-14 | TASK-18 | Port the 3D truck reconstruction into the Today hero | feature | P1 | 6 | M-004 (m-3) | TASK-14 | @claude-cloud | 10-03 |
| TKT-15 | TASK-19 | Run the release QA pass on the preview (Stages 8–10) | task | P0 | 8 | M-005 (m-4) | TASK-12, 13, 15, 16, 17, 18 | @claude | 10-04 |
| TKT-16 | TASK-20 | Ship to production and verify the link previews | task | P0 | 4 | M-005 (m-4) | TASK-19 | @claude | 10-04 |

Every build ticket carries these labels: `P#`, `sp:N`, a topic, and `ready-for-agent`. `ready-for-agent` means the spec is complete; it doesn't mean the build is authorised. The build starts only after sign-off.
`@claude-cloud` = the Stage 7 claude.ai/code session. `@claude` = a local session (gates, Campfire and Obsidian sync, the production checks that need a browser).

## Dependency DAG

```
TASK-4 (plan + sign-off)
  └─ TKT-01 scaffold ─┬─ TKT-02 data engine ─┬─ TKT-04 Today lists ──┬─ TKT-10 maps ── TKT-14 3D ──┐
                      │                      ├─ TKT-05 Trip ─────────┤                            │
                      │                      ├─ TKT-06 phone ────────┼─ TKT-11 states ────────────┤
                      │                      └─ TKT-07 Ask API ──────┼─ TKT-12 Ask UI ────────────┤
                      │                                              └─ TKT-13 Ask eval ──────────┤
                      └─ TKT-03 foundation ─┬─ (TKT-04, TKT-05, TKT-06 as above)                  │
                                            ├─ TKT-08 Why Urja ───────────────────────────────────┤
                                            └─ TKT-09 OG/Twitter ─────────────────────────────────┤
                                                                   TKT-15 release QA ── TKT-16 production
```
Other edges:
- TKT-12 also needs TKT-05 (cite links) and TKT-06 (the dock).
- TKT-11 needs TKT-04, TKT-05 and TKT-06.

**Critical path** (Campfire Gantt; `sp` = estimated agent-hours, and the Gantt axis is elapsed hours): TASK-4 → TKT-01 → TKT-02 → TKT-05 → TKT-10 → TKT-14 → TKT-15 → TKT-16 = 38 of the 82 planned agent-hours.
- At about 10 agent-hours a day, with 2–3 parallel streams (`technical-plan.md` §15), the 70 build hours fit 09-30 → 10-03, and QA plus deploy (12 h) fit 10-04.
- Real throughput depends on how many streams the cloud orchestrator runs in parallel.

## Granularity notes (for sign-off)
- **One ticket = one demoable vertical slice.** TKT-02 is the exception: its UI surface is small (the verdict and ledger bar) because its job is to kill the data risk.
- **The board stays at ticket level.** Atomic 2–5-minute steps live in `technical-plan.md` §17, and each ticket's AC and DoD checklists show progress in Campfire. Mirroring about 60 `TSK` items as Campfire subtasks would add sync work while the cloud session can't write to Campfire, so they aren't mirrored.
- **Release tickets (TKT-15, TKT-16) wrap Stages 8–11,** so the Gantt shows the real finish date. Each stage still has its own skill and its own user gate.

---

## TKT-01 → TASK-5 · Scaffold the Next.js app, CI and a Vercel preview for the Urja shell
- **Type / priority / sp / milestone / owner / due:** chore · P0 · 2 · M-001 · @claude-cloud · 2026-09-30
- **Depends on:** TASK-4 (plan approved). **Blocks:** TKT-02, TKT-03.
- **Objective.** A reproducible toolchain and a live preview on day 1, so every later ticket regresses against CI and a real URL.
- **Scope.**
  - `create-next-app`: App Router, TS strict, ESLint, Tailwind v4, pnpm. Then `shadcn init`.
  - Vitest; Playwright (Chromium); `pnpm verify`.
  - `lib/format.ts` with tests.
  - GitHub Actions CI; the secret-scan test.
  - A placeholder Today page.
  - A Vercel preview from `build/stage7`.
- **Acceptance criteria.**
  1. `pnpm install && pnpm verify` (typecheck + lint + unit) passes in the cloud VM and in GitHub Actions on every push.
  2. `pnpm build` succeeds, and `pnpm start` serves `/` with a placeholder h1 "Urja".
  3. `lib/format.ts` unit tests pass:
     - `formatINR(186400)` = "₹1,86,400"
     - `formatINR(-10620)` = "−₹10,620" (U+2212)
     - `formatLitres(38)` = "38 L"
     - `formatTimeIST` renders "2:14 AM"
  4. The secret-scan test fails on a tracked Google-key pattern (`AIza` + 35 chars) and passes on the clean repo. `.env` is untracked.
  5. The Vercel preview for `build/stage7` returns 200 for `/`. A Playwright smoke test passes in the cloud VM: `/` loads with no console errors.
- **DoD.** Common DoD (below).
- **TC / EVAL.** TC-060, TC-061 / —
- **Tasks.** TSK-01.1 scaffold + scripts · TSK-01.2 format utils · TSK-01.3 Playwright smoke · TSK-01.4 CI + secret scan · TSK-01.5 preview check + ledger.

## TKT-02 → TASK-6 · Simulate Sharma Roadlines and compute Today's verdict with rules R1–R5
- **Type / priority / sp / milestone / owner / due:** feature · P0 · 6 · M-001 · @claude-cloud · 2026-09-30
- **Depends on:** TKT-01. **Blocks:** TKT-04, TKT-05, TKT-06, TKT-07.
- **Objective.** Kill the riskiest assumption: one simulated fleet, real rules, and every fixed number exact and consistent across screens (acceptance #2).
- **Scope.**
  - Types and constants; places, routes and the fleet.
  - A one-off scenario generator with balancing, whose output is committed as `lib/data/scenario/scenario.json`.
  - A seeded telemetry simulator; rules R1–R5 with confidence; ledgers.
  - Aggregates: yesterday, September, per truck, weekly, route normal, last 7 days, clean days, now-positions.
  - Golden tests.
  - The Today page head and ledger bar, from view models.
- **Acceptance criteria.**
  1. Golden tests TC-001 to TC-010 pass: every number in HANDOFF.md "Fixed numbers" and in the anchor tables of `technical-plan.md` §4.
  2. The rules detect exactly the scenario's 23 injected anomalies, with no misses and no extras (property test). The rule boundary tests pass (TC-011).
  3. Deterministic (TC-012): two runs give identical output hashes, and there is no `Date.now()`, `Math.random()` or argument-less `new Date()` under `lib/data`.
  4. Plausibility checks pass (TC-013): speed × time ≈ km (±2%), fuel is never negative, and balancer values stay in range.
  5. `/` renders "Your trucks earned ₹1,86,400 yesterday. ₹11,430 of it doesn't add up, across 3 trips." and the ledger bar from the engine. No ₹ literals appear in components (grep test).
  6. Wording guard (TC-014): no theft, stolen or चोरी in data-layer strings.
- **DoD.** Common DoD, plus: `scenario.json` is reviewed in the diff; the four resolved inconsistencies (`technical-plan.md` §4.9) are covered by tests.
- **TC / EVAL.** TC-001 to TC-014, TC-021 (data part) / supplies the expected values used by EVAL-001 to EVAL-013.
- **Tasks.** TSK-02.1 types + prng + clock · TSK-02.2 places, routes, fleet · TSK-02.3 scenario generator + balancing · TSK-02.4 telemetry simulator · TSK-02.5 rules + confidence · TSK-02.6 ledgers + aggregates + view models · TSK-02.7 golden, determinism and wording tests · TSK-02.8 Today head + ledger bar.

## TKT-03 → TASK-7 · Build the Lamplight foundation: tokens, fonts, shell and chart primitives
- **Type / priority / sp / milestone / owner / due:** feature · P0 · 6 · M-001 · @claude-cloud · 2026-09-30
- **Depends on:** TKT-01. **Blocks:** TKT-04, TKT-05, TKT-06, TKT-08, TKT-09.
- **Objective.** Every screen shares one verbatim port of the approved visual language (`final/lamp.css`, `charts.js`, `icons.js`).
- **Scope.**
  - `lamp.css` → `app/globals.css`: `@theme` tokens, base and component rules, values copied verbatim.
  - `next/font`: Inter (opsz) and Anek Devanagari (wdth). The icon sprite.
  - TopBar: wordmark, Ask trigger slot, pill nav, fleet chip, mobile menu.
  - Primitives: Plate, Money, Confidence, StatusChip, DeltaChip, Panel, SectionHead.
  - Chart components: Bars, Bricks, Units, Meter, Rail, Wave.
- **Acceptance criteria.**
  1. Tokens equal Design.md §12 (OKLCH). A test parses `globals.css` and checks the token list.
  2. The top bar and pill nav appear on every route, with `aria-current` on the active pill. The ≤760px menu reaches Morning brief, Today, Trucks, Trips, Why Urja and Ask.
  3. The chart components produce the same SVG geometry as `final/charts.js` for the mockup's sample inputs (snapshot tests).
  4. Money has en-IN grouping, a sign, and `lit`/`lit-loss` variants. Confidence shows 3 bars and a word (High/Likely/Check, पक्का/शायद/जाँचें).
  5. The shell has no horizontal scroll at 375, 768 and 1440 px. The ⌘K hint is hidden on coarse pointers.
- **DoD.** Common DoD, plus: the Design.md §12 contrast pairs are unchanged (re-run `contrast-b.mjs` values against the ported tokens).
- **TC / EVAL.** TC-022 (shell), TC-023, TC-031 (shell) / —
- **Tasks.** TSK-03.1 tokens, base, fonts · TSK-03.2 component CSS + icons · TSK-03.3 shell · TSK-03.4 primitives · TSK-03.5 charts + parity snapshots.

## TKT-04 → TASK-8 · Finish Today: Needs your eyes, the September cards and the trucks table
- **Type / priority / sp / milestone / owner / due:** feature · P0 · 4 · M-002 · @claude-cloud · 2026-10-01
- **Depends on:** TKT-02, TKT-03. **Blocks:** TKT-10, TKT-11.
- **Objective.** Today answers "what needs me?" and "how is the month?" with the metric-and-guardrail story (S7, D5), all computed.
- **Scope.**
  - EyesList: 3 rows plus the clean line.
  - Four KPI chart cards, with takeaway footers and aria-labels generated from data.
  - TrucksTable: ranks 1–5, the gap row, ranks 22–24. "All 24 trucks" expands the table in place.
  - The `#trucks` anchor; tablet and phone layouts (Design.md §16).
- **Acceptance criteria.**
  1. Every number in these sections comes from view models (no literals) and matches TC-006 to TC-010.
  2. The eyes rows are ordered by confidence, then ₹. Each Evidence link opens `/trips/{id}`.
  3. Chart aria-labels state the data in words and are generated from data.
  4. "All 24 trucks" expands the gap row into all 24 rows and collapses it back, and works by keyboard.
  5. The layout follows Design.md §16 at 375, 768 and 1440 px, with no horizontal scroll.
- **DoD.** Common DoD. **TC / EVAL.** TC-006 to TC-010 (UI), TC-021, TC-022, TC-031 / —
- **Tasks.** TSK-04.1 view models · TSK-04.2 EyesList · TSK-04.3 KPI cards · TSK-04.4 TrucksTable · TSK-04.5 responsive + E2E.

## TKT-05 → TASK-9 · Build the Trip evidence page for every trip
- **Type / priority / sp / milestone / owner / due:** feature · P0 · 8 · M-002 · @claude-cloud · 2026-10-01
- **Depends on:** TKT-02, TKT-03. **Blocks:** TKT-10, TKT-11, TKT-12.
- **Objective.** The demo's peak: "2:14 AM, parked, 38 litres". Fuel falls while speed is zero, and every line of evidence has a source.
- **Scope.**
  - `/trips/[tripId]`, statically generated for every trip, plus a `/trips` redirect and a 404.
  - TripHead.
  - FlagCard: rule, confidence, evidence with sources, why-confidence, the driver's side, and honest prototype actions.
  - FuelSpeedChart (desktop and phone) with a variant for each rule.
  - Timeline; TripLedger with the route-normal chart; loading and error states.
- **Acceptance criteria.**
  1. `/trips/0926-04` matches `final/trip.html` (TC-003). Every number and string is computed: head, flag card, evidence, timeline, ledger and chart notes.
  2. Pages exist for every trip; `/trips/unknown` shows the 404 page; `/trips` redirects to the top flagged trip.
  3. R2 (0927-02) and R3 (0926-11) render their own evidence, chart variant and ledger from data.
  4. The driver actions change local state and show an honest note ("Prototype: nothing was sent"). Nothing is sent.
  5. The loading skeleton and "Couldn't load this trip" with retry both render. The layout follows Design.md §16 at 375, 768 and 1440 px.
- **DoD.** Common DoD. **TC / EVAL.** TC-003 (UI), TC-021, TC-022, TC-024 (trip), TC-031 / —
- **Tasks.** TSK-05.1 route + view model · TSK-05.2 head, ledger, route-normal chart · TSK-05.3 flag card + driver's side · TSK-05.4 fuel-and-speed chart + variants · TSK-05.5 timeline, states, E2E.

## TKT-06 → TASK-10 · Build the 7 AM message and the Morning brief in Hindi and English
- **Type / priority / sp / milestone / owner / due:** feature · P0 · 6 · M-002 · @claude-cloud · 2026-10-01
- **Depends on:** TKT-02, TKT-03. **Blocks:** TKT-11, TKT-12.
- **Objective.** The owner's phone task model: the brief is home and Hindi comes first. It's generated from the flags, so it never hallucinates (S6).
- **Scope.**
  - `lib/brief/template.ts`: Hindi and English, place and driver dictionaries, confidence words.
  - `/message`: chat, the preview card with the fuel trace, quick replies, language toggle, the real host name.
  - `/brief`: earned plus 14-day bars, the leak line, 3 items, the clean line, the month card, the Ask dock slot.
  - `?lang=`, rendered on the server, plus a client toggle.
- **Acceptance criteria.**
  1. The template output for 27 Sep equals the mockup strings, in Hindi and English, with computed numbers (snapshot tests, TC-015).
  2. The toggle switches copy, `lang`, title and aria-labels. Hindi is the default; `?lang=en` renders English on first paint.
  3. The 14-day bars are the daily profit series. The month card shows ₹58,240 flagged and ₹21,600 recovered, with weekly bricks.
  4. Items link to their trips. "Only high ones" shows only High items.
  5. No horizontal scroll at 375, 768 and 1440 px. Devanagari renders in Anek Devanagari.
- **DoD.** Common DoD, plus: the Hindi strings are listed in `docs/exec/hindi-review.md` for the native-speaker review (open item).
- **TC / EVAL.** TC-015, TC-027, TC-010 (UI), TC-022 / —
- **Tasks.** TSK-06.1 template + dictionaries · TSK-06.2 /brief + toggle · TSK-06.3 /message · TSK-06.4 responsive + E2E.

## TKT-07 → TASK-11 · Serve Ask Urja from /api/ask with guards and a deterministic fallback
- **Type / priority / sp / milestone / owner / due:** feature · P0 · 8 · M-003 · @claude-cloud · 2026-10-01
- **Depends on:** TKT-02. **Blocks:** TKT-12, TKT-13.
- **Objective.** A live model that answers only from fleet data, where every failure path lands on an honest answer computed from the data (S6, S10).
- **Scope.**
  - The `probe-gemini` script; the compact context builder; the system prompt with a canary.
  - The Gemini REST client: `x-goog-api-key` header, JSON schema, 8 s timeout. zod validation.
  - The citation guard and number check; the per-IP limit and daily cap.
  - The deterministic fallback, matched by intent, in Hindi and English.
  - Structured logs; provenance.
- **Acceptance criteria.**
  1. With a mocked model, the happy path returns `{answer, lang, cites[], provenance{model, ms, scope}}` and cites only trip ids that exist (TC-040, TC-044).
  2. A timeout, 429, 5xx, invalid JSON, schema-invalid response or missing key returns mode `fallback` for a recognised question and `saved` otherwise (TC-041, TC-042).
  3. The rate limit and daily cap return without calling the model (TC-043).
  4. The fallback intents answer all 10 prepared questions with numbers matching the golden values (TC-046).
  5. The key is read only on the server, is never logged, and is absent from `.next/static` (build grep test, TC-045).
  6. On the preview with the real key, "How much did we earn yesterday…" returns a grounded answer in under 4 s.
- **DoD.** Common DoD, plus the AI block: prompt version and model configuration recorded in `lib/ask/config.ts`; the TP5 model check recorded in `decisions.md`.
- **TC / EVAL.** TC-040 to TC-046 / enables EVAL-001 to EVAL-013.
- **Tasks.** TSK-07.1 probe + model check · TSK-07.2 context + allowed numbers · TSK-07.3 prompt, schema, client · TSK-07.4 guards + limits · TSK-07.5 fallback intents · TSK-07.6 route, logs, bundle check.

## TKT-08 → TASK-12 · Publish the Why Urja page
- **Type / priority / sp / milestone / owner / due:** feature · P1 · 4 · M-004 · @claude-cloud · 2026-10-02
- **Depends on:** TKT-03. **Blocks:** TKT-15.
- **Objective.** The forwarded link's story in three minutes (Design.md §25): problem, owner, gap, Bytebeam fit, metric and guardrail, first 90 days, what's real.
- **Scope.** A port of `final/why.html`:
  - the hero with the poster and both CTAs;
  - chapters 01–07;
  - field quotes from `content/field-notes.ts`, with the honest placeholder state;
  - the competitor table, the exists/new pipeline, the two metric tiles, the first 90 days;
  - "About this prototype" and the byline.
- **Acceptance criteria.**
  1. The content matches `final/why.html`, with one h1, landmarks and a real table.
  2. Field quotes render from `content/field-notes.ts`. When it's empty, the placeholder card and ASSUMPTION note show; no quotes are invented.
  3. The poster lazy-loads below the fold. No horizontal scroll at 375, 768 and 1440 px. axe reports no violations.
- **DoD.** Common DoD. **TC / EVAL.** TC-022, TC-031 / —
- **Tasks.** TSK-08.1 content + sections · TSK-08.2 poster, responsive, axe.

## TKT-09 → TASK-13 · Make the link preview travel: OG and Twitter tags with a 1200×630 image
- **Type / priority / sp / milestone / owner / due:** feature · P1 · 4 · M-004 · @claude-cloud · 2026-10-02
- **Depends on:** TKT-03. **Blocks:** TKT-15, TKT-16.
- **Objective.** The link will be forwarded, so its unfurl must carry "Where did the diesel go?" and the ₹3,420 fragment (acceptance #5).
- **Scope.**
  - `metadataBase` from env; a title and description per route; `og:*` and `twitter:*` tags.
  - An `/og-card` route (noindex) that ports `og/index.html` with real data.
  - `scripts/render-og.ts`: Playwright renders `public/og.png`.
  - Tests.
- **Acceptance criteria.**
  1. The server-rendered HTML of `/`, `/why`, `/brief` and `/trips/0926-04` carries these tags with absolute HTTPS URLs (TC-050): `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image` (with width, height and alt), and the Twitter `summary_large_image` tags.
  2. `public/og.png` is 1200×630, under 500 KB, and matches `og/index.html` (parity screenshot).
  3. `og:image` returns 200 on the preview.
- **DoD.** Common DoD. **TC / EVAL.** TC-050 (TC-051 runs in TKT-16) / —
- **Tasks.** TSK-09.1 metadata + SSR tests · TSK-09.2 og-card, render script, asset tests.

## TKT-10 → TASK-14 · Wire the maps: Today hero Map and Fleet views, list ↔ map linking and the trip route
- **Type / priority / sp / milestone / owner / due:** feature · P1 · 4 · M-002 · @claude-cloud · 2026-10-02
- **Depends on:** TKT-04, TKT-05. **Blocks:** TKT-14.
- **Objective.** Show where it happened on a real map, one click from the scene (D3, D4). Never a rendered fake.
- **Scope.**
  - MapLibre 4.7.1 through `next/dynamic`, on the night-warmed Carto dark-matter-nolabels style, with a token → rgba resolver.
  - HeroCard: the Scene | Map | Fleet switch (Scene shows the poster until TKT-14), full screen, glass card, rail box, flag markers, lamp pool.
  - Eyes ↔ map selection. Fly-to at 1.4 s, curve 1.3; a jump under reduced motion.
  - TripMap; the tiles-failure state; attribution.
- **Acceptance criteria.**
  1. Selecting eyes row n (or marker n) lights the row, updates the glass card and rail, and flies the map. Rows 2–3 switch Scene → Map (TC-025).
  2. The Fleet view shows 24 trucks (11 moving, 12 in a yard, 1 in the workshop) from now-positions, plus the 3 numbered flags.
  3. Blocked tiles show "Map unavailable; every event is in the timeline", and the page stays usable (TC-028).
  4. Reduced motion: no ping and no fly-to (the map jumps).
  5. MapLibre is not in the initial JS of `/`.
- **DoD.** Common DoD. **TC / EVAL.** TC-025, TC-028, TC-055 (bundle) / —
- **Tasks.** TSK-10.1 map client + style + colour resolver · TSK-10.2 HeroCard · TSK-10.3 selection state · TSK-10.4 TripMap + failure + E2E.

## TKT-11 → TASK-15 · Give every data view its four states
- **Type / priority / sp / milestone / owner / due:** feature · P1 · 4 · M-002 · @claude-cloud · 2026-10-02
- **Depends on:** TKT-04, TKT-05, TKT-06. **Blocks:** TKT-15.
- **Objective.** Loading, empty, error and working on every data view, truthful and recoverable (acceptance #4, Design.md §18).
- **Scope.**
  - `?state=loading|empty|clean|error` on Today and Brief; `?state=loading|error` on Trip.
  - Real `loading.tsx` skeletons (no invented progress) and `error.tsx` with retry.
  - The clean day is 24 Sep's real data. The data-late error is computed from yesterday's trips.
- **Acceptance criteria.**
  1. Each state renders on each view with the `final/states.html` copy and numbers computed from data (TC-024).
  2. Every error says what happened, what to do next and whether anything was lost, with a visible retry.
  3. Real route loading shows the skeleton only, never invented progress.
- **DoD.** Common DoD. **TC / EVAL.** TC-024, TC-022 / —
- **Tasks.** TSK-11.1 state model + boundaries · TSK-11.2 Today + Brief states · TSK-11.3 Trip states + E2E.

## TKT-12 → TASK-16 · Let owners ask: the ⌘K drawer and the phone dock
- **Type / priority / sp / milestone / owner / due:** feature · P0 · 4 · M-003 · @claude-cloud · 2026-10-02
- **Depends on:** TKT-07, TKT-05, TKT-06. **Blocks:** TKT-15.
- **Objective.** Ask Urja on every screen: a search-style bar on desktop, a dock and chat on the phone, with citations and provenance (Design.md §13, §15, §17).
- **Scope.**
  - AskDrawer on a shadcn/Radix Dialog: right edge, 240 ms, scrim 180 ms, focus trap, inert page, Esc, focus return. Opened by ⌘K or Ctrl+K.
  - The phone dock on the brief, plus chat from the menu.
  - Idle, answering, answer, fallback and error states. Cite chips → trips. The provenance line.
- **Acceptance criteria.**
  1. ⌘K opens with focus in the input; Tab stays inside; Esc closes; focus returns to the trigger; the page behind is inert (TC-026).
  2. All five states render. The fallback shows for mode `fallback` or `saved` (TC-024).
  3. Cite chips open the right trip. Provenance shows the model, the measured time, the scope and "Urja can be wrong".
  4. Works at 375 px (dock and chat) and 1440 px (drawer).
- **DoD.** Common DoD. **TC / EVAL.** TC-026, TC-024 (Ask) / EVAL-001 to EVAL-013 (UI)
- **Tasks.** TSK-12.1 useAsk + contract · TSK-12.2 drawer + states · TSK-12.3 dock + chat · TSK-12.4 E2E.

## TKT-13 → TASK-17 · Measure Ask Urja: eval runner, number-accuracy scorer and baseline
- **Type / priority / sp / milestone / owner / due:** task · P1 · 4 · M-003 · @claude-cloud · 2026-10-02
- **Depends on:** TKT-07. **Blocks:** TKT-15.
- **Objective.** Acceptance #3 as evidence, not a demo: a reproducible `pnpm eval` with provenance, and a baseline before any prompt tuning.
- **Scope.**
  - `evals/scorers/ask-scorer.ts` and its unit tests. It covers digit normalisation (including Devanagari), ₹/L/% extraction, required facts, the allowed-number set, cites, language, forbidden patterns, the canary and out-of-scope.
  - `evals/run-ask-eval.ts`: base URL, pacing, provenance.
  - `pnpm eval`; `evals/results/ask-baseline-v1.json`.
- **Acceptance criteria.**
  1. The scorer unit tests pass on canned answers: correct English, correct Hindi, a hallucinated number, a missing cite, theft wording, a leaked canary, an off-topic refusal.
  2. `pnpm eval --base-url <url>` runs all 13 cases and writes a results file with provenance. Failed cases are listed, never dropped.
  3. The baseline is recorded before any prompt tuning; later runs report the delta against it.
- **DoD.** Common DoD, plus the AI block (the dataset version and prompt version are in the results file).
- **TC / EVAL.** TC-060 / EVAL-001 to EVAL-013.
- **Tasks.** TSK-13.1 scorer + tests · TSK-13.2 runner + provenance · TSK-13.3 baseline run.

## TKT-14 → TASK-18 · Port the 3D truck reconstruction into the Today hero
- **Type / priority / sp / milestone / owner / due:** feature · P1 · 6 · M-004 · @claude-cloud · 2026-10-03
- **Depends on:** TKT-10. **Blocks:** TKT-15.
- **Objective.** The user-mandated delighter (D3), bounded by guards so it can never break the demo (Design.md §26 and the Design Freeze 3D items).
- **Scope.**
  - Port `final/truck3d.js` into `components/scene`: three@0.169.0, procedural geometry, bloom, ACES, RoomEnvironment, fog, pixel-ratio caps.
  - Load it through `next/dynamic` after first paint, with the poster shown first.
  - The guard for a failed import, failed WebGL or a software renderer; context loss → poster.
  - Render only while visible. Reduced motion is static. No drag on coarse pointers. Orbit limits.
  - Rotate and reset buttons; dispose on unmount; the label and aria.
- **Acceptance criteria.**
  1. In headless Chromium (software GL), the poster stays and nothing errors (TC-029).
  2. On a real GPU (manual, on the Mac): the composition matches `final/scene.html`, the drag limits hold, the rotate and reset buttons work by keyboard, and reduced motion is static (TC-030).
  3. Ten Today ↔ Trip navigations leave at most one live WebGL context (TC-030).
  4. three.js is absent from the initial bundle and loads only on Today, after first paint (TC-055).
- **DoD.** Common DoD, plus the performance block (TC-055 LCP).
- **TC / EVAL.** TC-029, TC-030, TC-055 / —
- **Tasks.** TSK-14.1 scene port + dispose · TSK-14.2 guard, fallback, context loss, visibility · TSK-14.3 wrapper, controls, buttons · TSK-14.4 E2E + bundle + manual script.

## TKT-15 → TASK-19 · Run the release QA pass on the preview (Stages 8–10)
- **Type / priority / sp / milestone / owner / due:** task · P0 · 8 · M-005 · @claude · 2026-10-04
- **Depends on:** TKT-08, TKT-09, TKT-11, TKT-12, TKT-13, TKT-14. **Blocks:** TKT-16.
- **Objective.** One critique pass, one code-review plus test and eval pass, and one security pass (S9), consolidated into `QA-report.md`.
- **Scope.**
  - Stage 8: an `impeccable` critique against Design.md and `final/` (DES- findings).
  - Stage 9: `/code-review` (CR- findings), every TC, and the final eval run (`ask-eval-run-v1.json`, `eval-report-v1.md`).
  - Stage 10: `/security-review` (SEC- findings), including key exposure and Ask abuse.
  - `QA-report.md` with a single recommendation.
- **Acceptance criteria.**
  1. DES-, CR- and SEC- findings are fixed, or parked with a reason.
  2. All automated TCs pass. Manual TCs are recorded as PASS, FAIL or BLOCKED, with evidence.
  3. The eval gate is met: ≥ 9/10 prepared, 3/3 off-topic, p50 < 4 s, 0 forbidden words, 0 unsupported ₹/L figures.
  4. The user approves `QA-report.md`.
- **DoD.** The universal DoD. **TC / EVAL.** TC-020, TC-021, TC-030, TC-031, TC-032, TC-055 / EVAL-001 to EVAL-013 (final run)
- **Tasks.** TSK-15.1 Stage 8 · TSK-15.2 Stage 9 · TSK-15.3 Stage 10 + QA-report.

## TKT-16 → TASK-20 · Ship to production and verify the link previews
- **Type / priority / sp / milestone / owner / due:** task · P0 · 4 · M-005 · @claude · 2026-10-04
- **Depends on:** TKT-15. **Blocks:** —
- **Objective.** The interviewer opens a working production link that unfurls correctly (acceptance #1 and #5).
- **Scope.**
  - A PR from `build/stage7` → `main`, approved by the user.
  - Vercel production; `NEXT_PUBLIC_SITE_URL`.
  - A production smoke test of the 5-step path.
  - OG checks: the HTML, `og.png` returning 200, LinkedIn Post Inspector, opengraph.xyz.
  - Monitoring notes; the rollback path; `lesson-learnt.md`; Campfire and Obsidian synced.
- **Acceptance criteria.**
  1. TC-020 passes on the production URL.
  2. TC-050 and TC-051 PASS, or are BLOCKED with the exact blocker.
  3. One live Ask answer on production uses the key from Vercel's encrypted env.
  4. `lesson-learnt.md` is written and `HANDOFF.md` is updated.
- **DoD.** The universal DoD. **TC / EVAL.** TC-020 (production), TC-050, TC-051 / —
- **Tasks.** TSK-16.1 merge + deploy + env · TSK-16.2 production verification + monitoring + lessons.

---

## Common DoD (on every build ticket in Campfire)
1. The acceptance criteria are demonstrated on the `build/stage7` preview, with evidence recorded in `docs/exec/ledger.md`.
2. The linked TC- cases are automated (or recorded as manual with evidence) and passing.
3. `pnpm verify` is green in CI on the ticket's last commit, and the commits carry the TASK id.
