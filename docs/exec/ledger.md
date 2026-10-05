# Stage 7 execution ledger — Urja

## Stage 11: production (2026-10-05)
- **Merged:** 007U5H4R/urja#1 (build/stage7 → `main`), merge commit cfcd9c0. Approved by the user after QA-report.md; CI green on 3363989.
- **Production:** https://urja-three.vercel.app (Vercel production deployment of cfcd9c0). Public, confirmed by an external fetch.
- **TC-050: PASS.** All routes return 200. og:url and og:image point at production. og.png is 1200×630 and byte-identical to the repo copy. /og-card is noindex.
- **TC-020 on production: PASS** at 375 px. Fixed numbers are correct and there are 0 console errors. The live Ask call timed out, and the labelled fallback answered correctly.
- **TC-051: BLOCKED (needs the user).** LinkedIn needs a login, and opengraph.xyz is egress-blocked here. Substitute evidence is in `docs/exec/production.md`.
- **Monitoring and rollback:** `docs/exec/production.md`. **Lessons:** `lesson-learnt.md`. HANDOFF.md is updated.
- **Campfire and Obsidian sync:** for the local session, from this ledger.


## Stages 8–9 (2026-10-05, cloud session 1, resumed)
**Status:**
- **Stage 8 (TSK-15.1): done.** The user asked to move straight on to Stage 9 without waiting for approval.
- **Stage 9 (TSK-15.2): in progress.**
  - The code review and the TC matrix are done.
  - The Ask improvements (ask-v2, EXE30) are merged.
  - The final eval is **BLOCKED on Gemini quota**: every call got 429. A retry is scheduled for 18:45 UTC.
- build/stage7 head: 55c8e1a. `main` is untouched.

### Stage 8 gate report (design critique, TSK-15.1)
- **Method (EXE29):** `bw-design-critique` isn't installed here. Instead, three fresh critic subagents compared the preview at 68aced0 with Design.md and `.design/exploration/final/`. Their 40 findings merge into DES-2…DES-39 in `docs/exec/stage8-critique.md`. No finding needed a Design Freeze change.
- **Fix units:** each had TDD, a spec review and a quality review, with at most 2 fix rounds.

  | Unit | Commit | DES items | Reviews |
  |---|---|---|---|
  | S2: phone, states, scene, Why, fonts | aa6a941 | 4 (part), 14, 19, 20 (part), 21, 23, 24, 25 (part), 27, 28 (part), 30, 31 | spec PASS; quality FAIL → 1 round (toggle 44 px, flaky test) |
  | S3: Ask, maps | 1ae4f84 | 8, 9, 11, 12, 13, 17, 18, 22, 25 (part), 26 | quality PASS; spec FAIL → 1 round (attribution visible at load) |
  | S1: global CSS, shell, Today, Trip | 5406f86 | 2, 3, 4, 5, 6, 7, 10, 15, 16, 28, 29, 32, 33 | spec PASS; quality FAIL → 1 round (stretch at 100% text) |
  | F: QA follow-ups | 55c8e1a | 28 (rest at 375), axe `landmark-unique` from DES-3 | combined review PASS |

- **Independent QA on the preview at 5406f86** (`docs/exec/qa/stage8-qa.md`): 30 of 32 fixed DES items passed.
  - Unit F closed DES-28 at 375 and the new `landmark-unique` finding.
  - DES-20 is fixed in part: English wraps to 2 lines below 414 px rather than cutting off the firm name.
  - No regression against the mockups: hero composition, CTA hierarchy and Today grid are unchanged.
  - Wording is clean on 20 routes.
- **Design.md §17 Stage 8 items:**
  - 320 px reflow: PASS on all 7 routes.
  - 200% page zoom: PASS on all 7.
  - Text-only 200%: PASS at 1280; at 375, PASS on 6 of 7 at QA, then `/why` too after unit F. DES-39 is parked for 430 px and 320 px.
  - Keyboard-only TC-020 path: PASS on all 6 steps.
- **Checks on 55c8e1a:**
  - `pnpm verify`: 87 files, 1176 passed, 1 skipped.
  - `pnpm build` + `pnpm check:bundle`: clean.
  - `pnpm test:e2e`: 515 passed, 115 skipped by viewport project, 0 failed.
  - The e2e axe checks now run the wcag21 and wcag22aa tags, so `target-size` is included.
- **Parked:**
  - **DES-34 (user decision):** trip 0927-09 shows "189.89 L" next to "190 L". Option a: show "189.9 L" on both. Option b: drop "× ₹90" on fractional rows.
  - **DES-35 (user decision):** 8 hidden trucks show the same 5,924 km. Fixing it needs a generator change.
  - **DES-36:** the R4 map deviation; not on the demo path.
  - **DES-37:** the preview host on the link card.
  - **DES-38:** the 1440 glass-card route wrap; widening the card would touch the hero composition.
  - **DES-39:** text-only 200% on `/why` at 430 px and 320 px.
- **Screenshots** (app vs mockup, side by side) are in the session scratchpad, `critique/qa8/shots/sbs-*.png`; the list is in the QA report.

### Stage 9 progress (TSK-15.2)
- **Code review (CR-), `/code-review` over main...build/stage7 (357 files):** 1 finding.
  - **CR-1:** Ask ignored the request's `lang`. Fixed in 8bcb303 (`copyLang`).
- **TC matrix** (`docs/exec/qa/tc-matrix.md`, at 5406f86): 40 TCs.
  - 35 PASS.
  - 4 PARTIAL:
    - TC-020: the full path on production and Fast 3G is open.
    - TC-030: Mac rows 4–7, 9–12 and 15 are pending.
    - TC-032: the manual re-run is pending.
    - TC-055: re-measure on the current preview.
  - 1 BLOCKED: TC-051, until production.
- **Ask eval** (`evals/reports/eval-report-v1.md`):
  - **baseline-v1** (3ab14d4, at 1395e7c): prepared 7/10, 3/10 by the model; off-topic 1/3; p50 2.6 s, p90 4.5 s; gate FAIL.
  - **ask-v2** (8bcb303, EXE30): fixes the three failure classes the baseline showed:
    - missing count, place and time;
    - flag-id cites being dropped;
    - off-topic questions answered "saved".

    Two reviews, with 1 fix round on blockers B1 (any plate grounded an answer) and B2 (unflagged deterministic off-topic passes). Docs: technical-plan §6.8, TC-041 and TC-044, evaluation-plan §5.
  - **final-v1 attempt 1** (8376c5d, at 73da37a): every call got `gemini-3.5-flash` **429** (quota), then the fallback model's 404. Prepared 10/10 but 0/10 by the model; off-topic 3/3 on refusals; gate FAIL. **BLOCKED: Gemini quota or billing (the user's item).**
  - The retry is scheduled for 2026-10-05 18:45 UTC, after both quotas reset.
- **After the user's decisions (EXE32, 2026-10-05):**
  - **Free tier kept; Ask made frugal** (EXE31, 7ced739):
    - An in-memory answer cache, for model answers only.
    - Cooldowns: 429 → 1 s–10 min; 404 → 10 min on the primary, 6 h on the fallback.
    - `ASK_DAILY_MODEL_BUDGET`.
    - The eval runner always bypasses the cache and counts first-attempt codes.
    - Two reviews; 1 fix round on two blockers: cache vs the eval, and the 404 bench.
  - **DES-34 fixed** (e2db435): "189.9 L".
  - **DES-35:** no change.
  - **B2:** deterministic off-topic refusals count, with warnings.
  - **Hindi review:** deferred, not a blocker.
  - **TC-043 reworded** (47abd6e).
- **TC-055 re-measured on the preview at b2b5d69: PASS.**
  - `/` LCP median 1.80 s (5 runs); `/why` 1.62 s.
  - First-load JS on `/`: 186.7 KiB gzip (budget 200 KB).
- **TC-020, full path on the preview: PASS** at 375, 1440 and Fast 3G, with Ask mocked to save quota (`docs/exec/qa/stage9-tc055-tc020.md`).
- **Checks on dc18e9c:**
  - `pnpm verify`: 1235 passed, 1 skipped.
  - build + check:bundle: clean.
  - `pnpm test:e2e`: 515 passed, 115 skipped, 0 failed.
- **final-v1 attempt 2** (2026-10-05 ~18:50 UTC, d72f4d9, `evals/results/ask-final-v1-d72f4d9.json`): Gemini answered all 13 cases live (none cached).
  - Prepared: **7/10 by the model**. Off-topic: 3/3 refused by the model.
  - p50 3.1 s; forbidden words 0; unsupported figures 0.
  - **Gate: FAIL**, a real measurement now.
  - Misses:
    - EVAL-001 omits the plate and says "10 trips"; the right count is 3 flagged trips.
    - EVAL-005 omits the count.
    - EVAL-007 omits ₹58,240 and 37%.
  - Next: ask-v3 (a guard check on trip counts and stricter answer rules), not done. Recorded in `evals/reports/eval-report-v1.md`.
- **Open for the user:** none blocking. The free-tier quota limits live answers on busy days (the deterministic fallback then answers). TC-030 and TC-032 manual runs on the Mac.


## Stage 7 summary (updated 2026-09-29, second cloud session)
**Status: Stage 7 is complete on `build/stage7`** (PR [007U5H4R/urja#1](https://github.com/007U5H4R/urja/pull/1), not merged; `main` untouched). TKT-15 and TKT-16 (Stages 8–11) are out of scope.

**Done: all 14 build tickets (TKT-01..14 = TASK-5..18).** Each unit had one implementer (TDD), a fresh spec review and a fresh code-quality review, at most 2 fix rounds, and one commit per unit, pushed. Main code commits:

| Ticket | TASK | Commits |
|---|---|---|
| TKT-01 scaffold, CI, secret scan | TASK-5 | 38eda87, 05bb86f |
| TKT-02 data engine and verdict | TASK-6 | f8bd27d, ba6bea2, d04f4f4 |
| TKT-03 Lamplight foundation | TASK-7 | c6b0673, e1ba025 |
| TKT-04 Today lower half | TASK-8 | c4ddb91 |
| TKT-05 Trip evidence | TASK-9 | b38035c |
| TKT-06 Message and brief (+ EXE23 Hindi menu, drawer, html lang; EXE27 Hindi H1–H10) | TASK-10 | 3b5c6be, ea791c3, 36df2ca, 1d92c67 |
| TKT-07 Ask API (+ EXE24 header, EXE26 fallback model) | TASK-11 | 8b1642a, ddfb752, eb097af, 4e28c77 |
| TKT-08 Why Urja (+ EXE19 byline, EXE28 quotes) | TASK-12 | abc2620, e6741d2, a528994 |
| TKT-09 Link preview | TASK-13 | bf082f6 |
| TKT-10 Maps | TASK-14 | 9d04764, b025cff (test fix) |
| TKT-11 Screen states | TASK-15 | fb383cc |
| TKT-12 Ask UI | TASK-16 | 6e9c710 |
| TKT-13 Ask eval | TASK-17 | 42a5e92, 63bb068 |
| TKT-14 3D scene + M-004 performance fixes (+ DES-1) | TASK-18 | 0f6ab03, 2ec07f9, 9845a7b, f634a0e |

**Final checks on b025cff** (after the EXE19–EXE23 follow-ups):
- `pnpm verify`: 84 files / 1007 tests pass (1 skipped).
- `pnpm build` (flagless) + `pnpm check:bundle`: pass; no key material, no debug hooks. Routes: `/`, `/why`, `/og-card`, `/trips` static; 247 trip pages SSG; `/brief`, `/message`, `/en/brief`, `/en/message` dynamic.
- `pnpm test:e2e` on 36df2ca: 386 pass / 84 skipped by viewport project / 1 fail: the [phone] maps.spec reduced-motion test, the known flaky one. Root cause: the click scrolled the page on a phone, and the helper counted that scroll as a third marker position. b025cff measures the marker against the map instead; maps.spec then passed 240/240 with `--repeat-each=5` on all projects. The threshold (exactly 2 positions, a jump) is unchanged.

**Gates** (details under "Gates" below):
- M-001: **PASS**.
- M-002: **PASS**.
- M-003: **PASS** on every criterion that doesn't need the key.
- M-004: **PASS** (TC-055 LCP on `/` passes on the preview at 1.83 s; see the follow-up above).

**TCs passed:**
- Data and rules: TC-001–TC-014, TC-015.
- Screens and flows: TC-020 (steps 1–4), TC-021, TC-022, TC-023, TC-024, TC-025, TC-026, TC-027, TC-028, TC-029, TC-031.
- Ask: TC-040–TC-046 (mocked model and fallback).
- Link preview and quality: TC-050 (local, a VERCEL_URL build, and the preview), TC-055 (bundle; **LCP on the preview**: `/` 1.83 s, `/why` 1.52 s), TC-061.
- TKT-09 AC3: og:image 200 on the preview.
- TC-030: the automated part; manual run 1 on the Mac: rows 2, 3 and 8 PASS, row 1 PARTIAL (see `docs/exec/tc-030-manual.md`).
- EXE23: server `<html lang>` equals the screen's language on first paint (`e2e/html-lang.spec.ts`); the phone menu and the Ask drawer follow the brief's language (ask.spec, phone.spec).
- TC-060: GitHub Actions CI green on push and pull_request, most recently on 63b4af8, bb6d4b6 and 4e28c77.

**Preview:** `https://urja-git-build-stage7-tushar-49a6.vercel.app` returns 200 from this VM, because the environment's API credential adds the Vercel bypass header (done 2026-09-29). Lighthouse, og:image and `/api/ask` are all checked on it. External visitors still see Vercel Authentication.

**BLOCKED:**
1. **Live Ask (TSK-07.1 probe and TP5, TKT-07 AC6, TSK-13.3 baseline).** `GEMINI_API_KEY` is set in Vercel. The model id and key are valid: the local session's ListModels lists `models/gemini-3.5-flash`.
   - `gemini-3.5-flash` answers **429** (quota) or **503** (busy). The key's project is most likely on the free tier; the user is checking billing and quota in AI Studio.
   - EXE26 (4e28c77) now retries once on `ASK_FALLBACK_MODEL` inside the 8 s budget. But on the preview the default fallback, **`gemini-2.5-flash`, answers 404** for this key.
   - **Needs the user:** either billing/quota on the key, or a fallback model id that ListModels lists for this key, set as `ASK_FALLBACK_MODEL` in Vercel (then redeploy).
   - Evidence: `x-ask-outcome` on every response. `evals/results/ask-preview-attempt-1-eb097af.json` has 0/10 prepared by the model.
   - Retries (at most 2, at least 30 min apart, then stop):
     - Attempt 1 at 15:29 UTC was probe only, and the eval was skipped (the primary gave 429/503, the fallback 404).
     - **Attempt 2: unchanged, skipped.** There was no Vercel env change or redeploy for the key. The local session found that the Mac's key 404s on every model, so it can't pick a fallback for Vercel's key. **Retrying stopped.**
   - The unblock is the user's: billing and quota on the Vercel key's project in AI Studio, and optionally a verified `ASK_FALLBACK_MODEL` for that key. Don't set `ASK_FALLBACK_MODEL` until an id is verified.
2. **TC-051 (manual, M-005/TKT-16):** external inspectors can't pass Vercel Authentication, and TC-051 targets the production URL at Stage 11. The tags and the image are verified on the preview.
3. **Pending, manual (local session):**
   - TC-030 rows 4–7, 9–12 and 15 need the user at the Mac: an automated window was reported hidden, which throttled rAF. Rows 13–14 are for Stage 9. Re-check row 7: the buttons moved in f634a0e.
   - The native Hindi review (`docs/exec/hindi-review.md`; the AI pre-review H1–H10 was applied in 1d92c67, EXE27).

**Resolved in this session:** preview access (bypass); TC-055 LCP on `/` (was BLOCKED at 2.65 s locally; 1.83 s on the preview, with no code change and no threshold change); TKT-09 AC3; M-004 gate: PASS; DES-1 scene controls over the scene tag (f634a0e).

**User decisions (2026-09-29):**
- **EXE13: accepted.** Only answers written by Gemini count toward "≥ 9/10 prepared"; fallback answers never count. Stricter, threshold unchanged. The runner gate and evaluation-plan §2/§7 are updated, and runner tests cover it.
- **EXE16: confirmed.** The scene tag stays on the fallback poster; it is the honesty label and follows TC-029.
- **EXE19: byline confirmed** as "Tushar Pathak · Product Manager" (e6741d2).
- **EXE20/21/22: EXE12, EXE11 and EXE15 confirmed** as built.
- **EXE23: done.** On the Hindi brief, the phone menu and the Ask drawer's visible labels (chips, cite chips, provenance, buttons) follow the brief's language (ea791c3). The server sends `<html lang="hi">` on the Hindi /brief and /message on first paint, through per-language root layouts (36df2ca). Screen-state copy stays English: an accepted exception.

**Still open (the user's, no action here):**
- Gemini: billing and quota, or the fallback model id (BLOCKED item 1).
- Why Urja chapter 01's title, "I went and asked", now sits above illustrative quotes (EXE28). Keep it or change it? It's a Design Freeze copy item, so it's unchanged.
- Campfire and Obsidian sync: done by the local session from this ledger (§16.3). The cloud session never edits `backlog/`.

**DES findings:**
- **DES-1 (fixed, f634a0e, TC-030 run 1):** on desktop, `.scene-ctl` covered the scene tag. At 1200 px the buttons spanned x 46–84, y 235–361 and the tag x 61–308, y 255–364. The controls are now a row at the bottom left, above the rail box. An e2e test asserts no intersection with the tag, the glass card or the rail box at 1440, 1200 and 1024 px, and the 44 px coarse-pointer targets are kept. This is a pixel and accessibility fix, so no Design Freeze approval was needed.

**DES/CR candidates for Stage 8–9:**
- Balancer-trip outliers in long-route normals (EXE9).
- Self-written R2–R5 variant copy (EXE10).
- Fallback provenance shows "answered in 0.00 s".
- Hero cameras fitted to the data vs map.js framing.
- Fleet card says "updated just now".
- OG mini chart has 2 red bars (data-true) vs the mockup's 4.
- Moderate axe findings: `region` on /brief, `heading-order` on /message.
- /trips/0926-04 CLS 0.115 at 412 px with a 1.2 s font delay.
- `poster-img.ts` depends on a Next internal (pinned 16.3.6, parity-tested).
- Wave/Meter/Rail degenerate-input nits (TASK-7).

**Decisions logged:** EXE1–EXE28 in `decisions.md`.

Branch: `build/stage7` (never `main`). Protocol: `CLAUDE.md` + `technical-plan.md` §16.2.
Status values: todo | doing | review | done | blocked. `BLOCKED-pending-key` (historical) = needed `GEMINI_API_KEY`. The key is now in Vercel, and live checks go through the preview (§16.1 path B).
Vercel: each row records the pushed SHA. Since 2026-09-29 the VM reaches the preview through the bypass header.

## Tasks

| TASK | TSK | status | commit | tests | evidence | notes |
|---|---|---|---|---|---|---|
| TASK-5 | TSK-01.1–01.5 | done | 38eda87, 05bb86f | TC-061 pass (fail-proof shown); format 15/15 under TZ=UTC and America/Los_Angeles; smoke e2e 3/3 (desktop/tablet/phone); `pnpm build` pass | pushed SHA 05bb86f; Vercel preview **pending** (checked by the local session) | Next **16.3.6** (`pnpm view next version`), React 19.2.8, pnpm 12.6.0, Playwright 1.56.1. Spec review PASS; quality review 1 fix round (worktree ignores, symmetric rounding, U+2212 litres). **CI (TC-060): GitHub Actions jobs fail in ~2 s with no steps or logs** on both pushes: an account-side block (likely Actions billing/minutes for the private repo), not the workflow; local `pnpm verify` + `pnpm build` stood in until the account's billing was fixed. **Resolved 2026-09-29: GitHub CI green (run 55, 7d7b059).** EXE1–EXE3. |
| TASK-6 | TSK-02.1–02.2 | done | f8bd27d | 74 unit tests pass (types verbatim, PRNG, clock, geo 1.6 km / 3.1 km, fleet 24/24 rows vs §4.3) | pushed | Unit A. Spec PASS; quality PASS + 1 fix round (integer R2/R3/R4 comparators, frozen routes). Invented plaza/pump names off NH48 and all Hindi place names go to the Hindi review. |
| TASK-6 | TSK-02.3–02.5 (+ledger) | done | ba6bea2 | 258 unit tests: TC-011 boundaries (R1 15.0/15.1, geofence, 5 km/h; R2 8.0/8.1%; R3 36,399/36,400 cL; R4 6.0/6.1% + 10.1 km; R5 ₹49/₹50), property 23 detected = 23 injected, 0926-04 trace vs night0926() ±1.8 L, ledger 13,240, yesterday and September totals exact (independent re-verification script) | pushed | Unit B. Spec: 1 gap (fractional litres on most trips) fixed in round 1 → only 0927-09 fractional; quality: 9 minor fixed (R4 perf ~0.6 s cold, strict zod, --check compares file, wrong flags excluded); round 2: Hindi part-of-day boundary (शाम to 9 PM). Generator seeded, ~60 s, passes on attempt 42; scenario.json 227 KB. Decisions EXE4–EXE7. |
| TASK-6 | TSK-02.6–02.8 | done | d04f4f4 | 318 unit (golden TC-001..TC-010 with literal expected values incl. D1–D9, N1–N14, weeks, trucks, 14-day series; TC-012 determinism across fresh module loads; TC-014 AST wording scan; TC-021 no-rupee AST scan incl. `inr={…}` literals; frozen dataset); e2e today-head 12/12 (h1 exact, legend, 0 errors, no h-scroll) | pushed; screenshots 1440/375 vs final/index.html match (fonts aside) | Unit C. Spec PASS (3 golden gaps added); quality: 1 blocking (mutable shared dataset → deep-freeze) + 7 minor fixed in round 1. EXE8 (clean-line copy), EXE9 (route normal null). |
| TASK-7 | TSK-03.1–03.3 | done | c6b0673 | 67 unit (tokens vs Design.md §12, lamp.css port parity, icons, shell); e2e 21 pass / 6 project-skipped (TC-022 shell at 375/768/1440, TC-023 menu 6 destinations, .kbd hidden on coarse) | pushed; screenshots 1440/375 vs final/index.html match (fonts aside) | Unit A. Spec PASS; quality PASS + 1 fix round (menu Escape/outside/route close, hydration-safe e2e, prefetch on pills, not-found + placeholder routes, lib/ask-events.ts). Port substitutions: no Tailwind preflight, next/font owns --font/--font-hi, poster url → /truck-scene.png, .proto-banner dropped (§5.2). |
| TASK-7 | TSK-03.4–03.5 | done | e1ba025 | 192 unit tests: primitives (Money ₹1,86,400, lit-loss, U+2212; Confidence 3 bars + word, hi/en), chart parity at all 17 mockup call sites (full SVG tree vs final/charts.js in jsdom), robustness (zero/empty data) | pushed | Unit B. Spec: 1 gap (Money `sign` boolean) fixed; quality: 4 blocking (NaN on zero data, short kind arrays) fixed in round 1, re-review PASS. Known minor, not fixed: Wave with empty fuel + notes, Meter NaN value, Rail knob unclamped when t > total (no view model produces these). |
| TASK-8 | TSK-04.1–04.5 | done | c4ddb91 | 373 unit (today view golden: eyes order/texts, KPI values, chart series, table rows; string builders table-tested; apportion fix); e2e today 27/27 (TC-022 incl. expanded table, TC-006..TC-008 UI numbers, 24-row expand/collapse by Enter/Space, TC-031 axe, 0 errors) | pushed; screenshots 1440/375 vs final/index.html match below the hero | Spec PASS; quality: 1 blocking (e2e hydration race) + 8 minor fixed in round 1. WRONG_FLAG_LIMIT_PCT → constants.ts; BRICK_INR exported. Hero slot empty until TKT-10; Evidence links prefetch=false until trips merge. |
| TASK-9 | TSK-05.1–05.5 | done | b38035c | 373 unit in unit (trip view golden: TC-003 strings incl. "₹3,420 below this route's normal of ₹16,660", TC-004 R2 note, TC-005 R3 note + Check caveat, R4/R5/clean variants; last bar = last reading on every trip; R1 drop preserved desk+phone); e2e trip 43 pass / 2 project-skipped (TC-003, 404s, /trips 307, no request on driver actions, TC-022, TC-031 axe) | pushed; screenshots 1440/375 vs final/trip.html: visible text identical | Spec PASS; quality: 1 blocking (last chart bar not last reading) + 8 minor fixed in round 1. 247 static trip pages incl. 11 in progress (EXE10). Map slot empty until TKT-10. |
| TASK-10 | TSK-06.1–06.4 | done | 3b5c6be | 647 unit in unit: TC-015 every data-hi/data-en string of brief.html + message.html matched in order (hi+en), Hindi time words, hiVerb agreement, clean-day variant, lib/site.ts normaliser, hindi-review drift test; e2e phone/shell/smoke 93/93 (TC-027 toggle + no-JS ?lang=en first paint, ?only=high, item links, TC-022, axe) | pushed; screenshots 375 vs mockups match | Spec PASS; quality: 2 blocking (site URL normalisation, hand-typed review rows) + 4 minor fixed in round 1. /brief and /message are dynamic (server-side lang). EXE12: global TopBar hidden on the phone screens. `docs/exec/hindi-review.md` (245 strings) awaits the native review. |
| TASK-11 | TSK-07.2–07.6 | done | 8b1642a, ddfb752 | 469 unit in unit: TC-040 happy path, TC-041 timeout, TC-042 429/5xx/network/bad JSON/schema/no key → fallback or saved, TC-043 5/min + 40/day + 300/day without calling fetch, TC-044 cites, TC-045 key only in header / never logged / bundle scan, TC-046 all EVAL-001..010 fallback answers with golden numbers; leak guard (canary any case, prompt sentences, tag-split text); 413 body cap | pushed | Spec PASS; security review: 1 blocking (case-sensitive leak guard) + 9 minor fixed in round 1; round 2: EVAL-012 allows ₹90/L in refusals; re-review found tag-split bypass → fixed in a 3rd attempt (verified by orchestrator: guard runs on raw and stripped text). Context 39.3 KB, warmed at module init. Strict 0-cites → fallback kept per §6.5 (risk for aggregate EVALs; see TKT-13). |
| TASK-11 | TSK-07.1 + AC6 | **BLOCKED (Gemini 503 on the preview, 2026-09-29; see the follow-up)**; earlier BLOCKED-pending-key | — | `scripts/probe-gemini.ts` prints "probe BLOCKED-pending-key" without a key (run with `--conditions=react-server`) | — | Needs `GEMINI_API_KEY` (EXE3). TP5 (model id + thinking level) unverified: `thinkingLevel: "minimal"` default, override `ASK_THINKING_LEVEL`. Run the probe first when a key exists. |
| TASK-12 | TSK-08.1–08.2 | done | abc2620 | 337 unit in unit (placeholder + ASSUMPTION when quotes empty, fleet facts from data); e2e why + shell 47 pass (TC-022, axe 0 violations at 3 widths, one h1, real table, lazy poster AVIF/WebP, top-bar variant, 44 px touch targets on coarse pointers) | pushed; screenshots 1440/375 vs final/why.html match (fonts aside) | Spec PASS; quality PASS + 8 minor fixed in round 1 (why.css scoped under .essay, content-driven tiles, table name, SVG id prefixes). EXE11. Byline confirmed by the user as "Tushar Pathak · Product Manager" (EXE19, e6741d2). |
| TASK-13 | TSK-09.1–09.2 | done | bf082f6 | 754 unit in unit (lib/og alt = §9 string from data, lib/metadata per route, lib/site env cases, og.png IHDR 1200×630 and 151,669 B); e2e metadata: TC-050 tags on /, /why, /trips/0926-04, /brief (+?lang=en), /message; og.png 200; /og-card noindex, no top bar, not in nav; robots absent elsewhere | pushed; verified with a VERCEL_URL=example.vercel.app build (all https); og mockup vs /og-card parity screenshots match (2 red bars vs 4: data-true) | Spec PASS; quality: 1 blocking (site URL normalisation → adopted TASK-10's lib/site.ts) + render-script robustness fixed in round 1 and rebased on build/stage7. TKT-09 AC3: **PASS on the preview** (2026-09-29). TC-051: BLOCKED (external inspectors can't pass Vercel Authentication; it targets production at Stage 11). |
| TASK-14 | TSK-10.1–10.4 | done | 9d04764 | 878 unit in unit (css-color, warm-style, map-client ready/8 s timeout/onFail, HeroCard selection with the map never loading, deep links, unmount while pending); e2e 287 pass / 49 project-skipped on the full suite (maps.spec 48: TC-025 selection + fly 1.4 s, TC-028 Carto aborted → overlay, reduced motion jump/no ping, TC-055 no maplibre in initial JS of /, axe) | pushed; mockup vs app screenshots (map 1/2, fleet, trip) match in elements; framing fitted to data | Spec PASS; quality PASS + 7 minor fixed in round 1. maplibre-gl 4.7.1 exact, dynamic import only. New shared e2e/fixtures.ts serves an offline Carto style to every spec (the sandbox browser doesn't trust the proxy CA; TLS verification stays on); @tiles specs use live tiles via Node. `/` stays static. |
| TASK-15 | TSK-11.1–11.3 | done | fb383cc | 909 unit in unit (parseState, stateSpecimens golden: "11 of 17 done", "All 17 trips add up. ₹1,94,800 earned, nothing unaccounted.", "4th clean day", "6 trucks haven't sent data since 2 AM … The other 11 trips are ready.", "11 trucks are still on the road and 13 were in the yard or workshop"; static invariant; focus to h1); e2e states 42/42 and the full suite 329 pass / 49 project-skipped / 0 fail | pushed | Spec PASS; quality PASS + minor fixes in round 1 (trip loading.tsx deleted, focus after recovery, aria-busy scope, tests). EXE15: no route loading files on prerendered pages (scope change: TSK-11.1 loading.tsx not shipped; TC-027 no-JS first paint wins). State copy English-only, as in states.html. |
| TASK-16 | TSK-12.1–12.4 | done | 6e9c710 | 800 unit in unit (useAsk incl. timeout during body read, loader retry, error boundary; AskAnswer text-only rendering, cites, provenance); e2e ask 28 pass / 20 project-skipped (TC-026 ⌘K/Ctrl+K, 12× Tab trapped, inert, Esc/scrim, focus return; motion 0.24 s/0.18 s; TC-024 states; ?ask deep link; phone dock + full-screen chat on /, /brief, /message; axe) | pushed | Spec: 2 gaps (?ask deep link, saved banner) fixed; quality: 1 blocking (stuck on answering after a timeout mid-body) + 5 minor fixed in round 1. EXE14. First-load JS on / ≈ 182 KB gzip incl. the noModule polyfill. |
| TASK-17 | TSK-13.1–13.2 | done | 42a5e92 | 678 unit in unit: scorer per evaluation-plan §4 (24 fixtures: 13 passing, 11 failing incl. all AC1 cases), runner with mocked fetch (pacing, 429 retry, timeouts, provenance, baseline delta, §7 gate + §2 blockers enforced separately, key-shape gate, redaction); smoke run vs next start (no key): 10/10 prepared via fallback, 0/3 off-topic (saved), gate FAIL as expected — not committed | pushed | Spec: 1 gap (§2 blockers) fixed; quality: 2 blocking fixed in round 1; re-review found a comma-grouping false pass → fixed in round 2. Dataset and plan untouched. EXE13 (fallback vs model in the gate) is an OPEN user decision. |
| TASK-17 | EXE13 gate | done | ac49fef | 89 eval tests: a 10/10 run with 3 fallback answers → FAIL (7/10 by the model); all-fallback → FAIL; 9/10 by the model → PASS | pushed | User decision EXE13: the prepared gate counts only model answers; evaluation-plan §2/§7 updated. Threshold unchanged. |
| TASK-17 | follow-up | done | 63bb068 | 7 new runner tests: `--out <dir>` validated before any request | pushed | Found at the M-003 gate (EISDIR after a full run). |
| TASK-17 | TSK-13.3 | **BLOCKED (Gemini 503; preview-attempt-1 = 0/10 by the model, committed)**; earlier BLOCKED-pending-key | — | — | — | Run once `GEMINI_API_KEY` exists: `pnpm eval --base-url <preview or localhost with key> --label baseline-v1`, commit `evals/results/ask-baseline-v1-<sha>.json`, then later runs pass `--baseline <that file>`. |
| TASK-18 | TSK-14.1–14.4 | done | 0f6ab03 | 969 unit in unit (guard regex, §7 dispose order + registry, isLive, mid-load unmount, bundle-debug scanner); e2e scene: TC-029 poster + 0 errors on 3 viewports, TC-055 no three in initial JS of / or trips (loads after FCP on / only), TC-030 automated: ≤ 1 live WebGL context after 10 Today ↔ Trip navigations counted by wrapping getContext, drag limits, no zoom, keyboard rotate/reset, context loss → poster; full suite 342 pass / 63 project-skipped / 0 fail; `check:bundle` clean on a flagless build | pushed | Spec: 1 blocking (production guard bypass via runtime env lookup) fixed by inlining NEXT_PUBLIC_DEBUG_GL in next.config.ts + a bundle check; quality: 2 blocking (tablet hero overlap hid "Open the evidence"; a test that couldn't fail) + 6 minor fixed in round 1; re-review reproduced the old attack → blocked. three@0.169.0 exact. EXE16 (scene tag on the fallback poster, flagged for the user). **TC-030 manual (Mac GPU) pending:** `docs/exec/tc-030-manual.md`. M-004 gate fixes: 2ec07f9 (EXE17) and 9845a7b (EXE18). |
| TASK-18 | TC-055 LCP on / | done (preview) | 9845a7b | **Preview, Lighthouse 12.8.2 mobile simulated: / median of 9 is 1.83 s, /why median of 5 is 1.52 s, CLS ≤ 0.078.** Earlier, local: | Lighthouse mobile, simulated, local: / LCP 2.65 s (budget 2.5 s; was 7.8 s), /why 2.44 s, CLS ≤ 0.001 | local Lighthouse JSON in the session scratchpad (not in the repo) | Still over budget after the 2 allowed gate fix rounds; threshold unchanged. Remaining cost: ~125 KB gzip React/Next runtime evaluated before the first frame, plus HTTP/1.1 round trips locally. §13 measures on the preview (HTTP/2 + CDN), which the VM can't reach: **measure on the preview first**. If it still fails there, restructure Today's client islands (Stage 9/10). |
| TASK-10 | EXE23 Hindi menu + drawer | done | ea791c3 | unit: menuLinks(lang) with a typed Hindi label per href, ASK_COPY/ASK_CHIPS {en,hi}, cite chips "ट्रिप 0926-04", usePageLang observer disconnects, hindi-review drift; e2e ask + phone 116 pass / 28 project-skipped | pushed | User decision EXE23. Spec PASS, quality PASS; round 1: cite chips, typed MENU_LABEL_HI, dead askCopy removed, observer test, Hindi wording. hindi-review.md sections 8–9. State copy English (accepted exception). |
| TASK-10 | EXE23 server html lang | done | 36df2ca | unit: the last `lang` value wins in langParam and useLang; e2e html-lang.spec (hi/en first paint on /brief and /message, both orders of a repeated lang, main[lang] = html[lang], /message EN → brief flow, no cross-layout prefetch, /en/* 307); full suite 373 pass / 77 skipped in the worktree | pushed | Route groups `app/(site)` en, `app/(phone)` hi, `app/(phone-en)/en` en, with a `?lang=en` rewrite and `experimental.globalNotFound` (build notes in EXE23). Spec PASS, quality PASS; round 1: repeated-lang parity (blocking), 307 redirects, prefetch off across root layouts, stale comments. Cross-layout links do a full page load. |
| TASK-12 | EXE19 byline | done | e6741d2 | why tests: byline "A concept for Bytebeam · Tushar Pathak · Product Manager · September 2026" | pushed | User decision EXE19; BYLINE gets a `role` field. |
| TASK-14 | flaky test fix | done | b025cff | maps.spec 240/240 with --repeat-each=5 on all projects | pushed | The reduced-motion marker check measured page scroll on phones; now measured against the map. Assertion unchanged. |
| TASK-11 | EXE24 diagnostic header | done | eb097af | route tests: `x-ask-outcome` is `ok`, `http_4xx:404`/`:400`, `http_429:429`, `http_5xx:503`, `guard:no_cites` or `no_key`, and never carries the key; `pnpm verify` 1014 pass | pushed; preview serves it | Written directly (a small diagnostic, kept short on usage) with no subagent reviews. The body contract is unchanged. |
| TASK-11 | EXE26 fallback model | done | 4e28c77 | unit: retry only on 429 or 503; not on 500, 404, 400, bad JSON, network errors or timeouts; off, or the same as the primary: no retry; inside 8 s (fake timers: the fallback gets exactly what is left, and < 1 s left means no retry); 2.x Flash gets `thinkingBudget: 0`; route: provenance, `x-ask-outcome` and the log name the answering model; the guard checks the fallback's answer; eval: per-case `model` and `modelCounts`; `pnpm verify` 1034 pass | pushed; on the preview the fallback `gemini-2.5-flash` answers 404 | Spec review: PASS on every clause. Quality review: no blocking issues. Fix round 1 applied minors: thinking mapping for the primary too, Pro gets no budget, case-insensitive same-model check, and a test renamed. |
| TASK-18 | DES-1 scene controls | done | f634a0e | e2e scene.spec: the controls don't intersect the tag, the glass card or the rail box at 1440, 1200 and 1024 px (red before the fix, green after); scene.spec 14 pass; today, today-head and smoke 39 pass | pushed | Found in TC-030 run 1 on the Mac. CSS only. |
| TASK-10 | EXE27 Hindi H1–H10 | done | 1d92c67 | copy, fallback (both chip 2 wordings → 217 L answer), hindi-review generator, TC-015 mockup parity; `pnpm verify` 1039 pass; e2e why, ask, phone, trip, today, html-lang 222 pass | pushed | Implementer in a worktree. Orchestrator check: diff is wording and formatting only, and no number changed. No separate subagent reviews, to save usage. |
| TASK-12 | EXE28 illustrative quotes | done | a528994 | why tests: the label renders when any quote is illustrative; e2e why.spec | pushed | The placeholder no longer shows. Open question: chapter 01 title (EXE28). |
| TASK-19 | TSK-15.1 (Stage 8) | done | aa6a941, 1ae4f84, 5406f86, 55c8e1a | verify 1176; e2e 515 pass / 0 fail; QA on preview 30/32 → closed by unit F | docs/exec/stage8-critique.md, docs/exec/qa/stage8-qa.md | DES-2…39; EXE29. Parked DES-34…39 (34 and 35 need user decisions). |
| TASK-19 | TSK-15.2 (Stage 9) | doing | 8bcb303, 3ab14d4, 8376c5d, f2a7753, e2db435, 7ced739, dc18e9c | CR-1 fixed; TC matrix 35/4/1; eval baseline-v1 FAIL 3/10; final-v1 attempt 1 BLOCKED (Gemini 429) | docs/exec/qa/tc-matrix.md, evals/reports/eval-report-v1.md | EXE30 (ask-v2). Retry 18:45 UTC. |
| TASK-19 | TSK-15.3 (Stage 10) | done | (this commit) | /security-review main...build/stage7: 0 findings ≥ 8 confidence | QA-report.md | QA-report: GO for Stage 11, conditional on the 18:45 UTC final-v1 retry (or BLOCKED-upstream recorded). User gate: merge to main needs approval. |
| TASK-20 | TSK-16.1–16.2 | done (TC-051 BLOCKED for the user) | cfcd9c0 + this commit | TC-050 PASS, TC-020 PASS on production, TC-051 BLOCKED | docs/exec/production.md | Production https://urja-three.vercel.app |

## Gates

### Preview checks log (2026-09-29, second cloud session)
Preview access works now: the environment's API credential adds the Vercel bypass header for `*.vercel.app`. `https://urja-git-build-stage7-tushar-49a6.vercel.app/` returns **200**, not a 302 to Vercel login. It serves the latest code: `/brief` sends `<html lang="hi">` (36df2ca), and after eb097af it sends the new `x-ask-outcome` header.
- **TC-055 LCP on `/`: PASS on the preview** (budget 2.5 s, unchanged). Lighthouse 12.8.2, mobile, simulated throttling, run in the VM's Chromium through the agent proxy:
  - `/`: median of 9 runs is **1.83 s** (runs 4.43, 2.41, 1.78, 1.83, 2.45, 1.81, 1.73, 4.51, 1.66). CLS ≤ 0.003. The LCP element is `h1#h1`.
  - `/why`: median of 5 runs is **1.52 s**. CLS ≤ 0.078.
  - Two of the 9 runs on `/` came in at about 4.5 s. Their cause wasn't isolated (a CDN or edge cache miss is the likely one), so they are recorded, not excluded. No restructure was needed, so no fix round was spent.
- **TKT-09 AC3: PASS.** The preview's og:image is `https://urja-4zernaml8-tushar-49a6.vercel.app/og.png`, which is the deployment URL: 200, image/png, 1200×630, 151,669 B, the same bytes as the local build. `/og.png` on the branch URL also returns 200. All 13 OG and Twitter tags are present on `/`.
- **TC-051 (manual, M-005/TKT-16): BLOCKED for now.** The tags and the image are checked above. External inspectors (LinkedIn Post Inspector, opengraph.xyz) can't pass Vercel Authentication, because only this VM gets the bypass header, and TC-051 targets the production URL at Stage 11. Per TC-051: "record BLOCKED with the reason, not PASS".
- **TASK-11 TSK-07.1 + AC6: BLOCKED (upstream Gemini 503).** The key is set in Vercel. 11 of 11 live calls to the preview's `/api/ask` fell back.
  - Round 1: diagnosis. There are no runtime logs from here, so eb097af adds an `x-ask-outcome` header (EXE24).
  - Round 2: re-probe. **9 of 11 calls got `http_5xx:503`** (Gemini unavailable) in about 0.3–0.7 s; the other 2 timed out at the 8 s abort. The pattern held after a 90 s pause.
  - Re-check (2026-09-29, 15:00 UTC, on your request): of 7 calls, 4 got `http_429:429` from Gemini (quota exhausted; not our limiter, which would say `rate_limited`), 2 got `http_5xx:503` and 1 timed out. Still no model answer.
  - TP5 is partly verified. The model id (`gemini-3.5-flash`, the default; the Vercel `ASK_MODEL` value isn't visible from here) and `thinkingLevel: "minimal"` got neither 404 nor 400. But the model never returned an answer, so AC6 (a live answer under 4 s) is unmet.
  - **User action:** in Google AI Studio, check the key's project and the model's availability, or set `ASK_MODEL` in Vercel to an available Flash model. Then rerun the probe (`pnpm tsx --conditions=react-server scripts/probe-gemini.ts`, with the key) or `/api/ask` on the preview and read `x-ask-outcome`.
- **TASK-17 TSK-13.3: BLOCKED (same cause).** `pnpm eval` ran against the preview (label `preview-attempt-1`, committed as `evals/results/ask-preview-attempt-1-eb097af.json`):
  - prepared 10/10, but **0/10 by the model**; off-topic 0/3 (saved); modes: fallback 10, saved 3; forbidden 0.
  - **Gate: FAIL** under EXE13.
  - It is deliberately *not* labelled `baseline-v1`: a baseline must hold model answers. Run `--label baseline-v1` once Gemini answers.
- **M-004: PASS.** TC-055 LCP on `/` was the only blocked criterion, and it now passes on the preview, where §13 measures it.



_(one section per milestone, newest last)_

### Gate M-001 · Data truth and foundation — PASS (2026-09-28, delegated gate policy)
- **Commit:** d04f4f4 (code); ledger 0f09759. Vercel preview: **pending** (the VM can't reach it; the local session checks `build/stage7` returns 200).
- **Commands:** `pnpm verify` → 36 files / 318 tests pass; `pnpm test:e2e` → 30 pass / 6 skipped by project design / 0 fail; `pnpm build` pass (all routes static).
- **Independent QA subagent** (against `next start`, own scripts):
  1. TC-001..TC-014: **PASS**, including an independent tsx spot-check of every §4.3 anchor under `TZ=America/Los_Angeles`.
  2. `/` renders "Your trucks earned ₹1,86,400 yesterday. ₹11,430 of it doesn’t add up, across 3 trips." from `getTodayHead()`, with no numeric literals in components/app: **PASS**.
  3. The shell at 375/768/1440 on /, /brief, /trips, /why and the 404: no horizontal scroll, top bar everywhere, the 375 menu reaches all 6 destinations, `.kbd` hidden on the phone: **PASS**.
  4. CI (TC-060): **PASS locally** (frozen install + verify + build on Node 22.22.2 / pnpm 12.6.0); **BLOCKED on GitHub**. Every Actions run fails in ~3 s with no steps or logs, an account-side block (billing/minutes). (Resolved 2026-09-29: the cause was account billing, and GitHub CI is now green.)
  5. DoD: determinism, no wall clock under lib/data, scenario.json committed one trip per line, secret scan with fail-proof (TC-061), no NEXT_PUBLIC_ key, no forbidden words: **PASS**.
  6. Screenshot parity (`/` vs `final/index.html` at 1440 and 375) for the greeting, verdict, tags, ledger bar, legend and top bar: **PASS**. The only differences are fonts over file:// and the dropped prototype banner.
- **TCs passed:** TC-001–TC-014, TC-021 (static and data), TC-022 (shell), TC-023 (menu destinations), TC-061; TC-060 is local only.
- **Open issues:** (M) GitHub Actions account block. (L) The phone menu button is 38 px, the same as the mockup, against TC-023's 44 px target; M-002 fixes it as an accessibility fix. (L) Balancer-trip outliers in some long-route normals (EXE9), a DES/CR candidate.
- **Decision:** every exit criterion except the external CI block passes. Continuing to M-002, M-003 and M-004 in parallel streams per §15.


### Gate M-003 · Ask Urja, grounded and measured — PASS on every non-key criterion (2026-09-29, delegated gate policy)
- **Commit:** 6e9c710 (code; QA ran on 08b53a6, ledger-only after it). Vercel preview: **pending**.
- **Commands:** `pnpm verify` → 61 files / 800 tests pass; `pnpm test:e2e` → 239 pass / 49 skipped by project / 0 fail (the orchestrator and QA got the same). `pnpm eval` → no key (EXE3): the harness ran 13/13 against `next start`, prepared 10/10 (0/10 answered by the model), off-topic 0/3 ("saved"), gate FAIL as expected without a key; not committed.
- **Independent QA subagent** (against `next start -p 3060`, own curl and Playwright scripts):
  1. TC-040..TC-046: **PASS**. 400 on empty, 501 chars and bad JSON; 413 on 9 KB; all 10 EVAL-001..010 questions answered by the fallback with every expected number, plate and cite; EVAL-011..013 saved; the 6th request → 429 with retryAfterS 12 and a fallback; always no-store, never 500, no HTML echo. 76 log lines with no question, key or AIza.
  2. TC-045: **PASS**. `check:bundle` clean on 33 files; no AIza, GEMINI or generativelanguage in `.next/static`; no NEXT_PUBLIC_ key.
  3. TC-026 + TC-024 (Ask): **PASS**. Meta/Ctrl+K open with focus in the input, 25 Tab/Shift+Tab presses stay inside, main inert, Esc returns focus, a `<script>` answer renders as text, the cite goes to /trips/0926-04, and the provenance line is exact.
  4. The eval harness works end to end: **PASS**.
  5. **BLOCKED-pending-key** (not faked): the TSK-07.1 probe and TP5 model check; TKT-07 AC6 (live answer < 4 s); the persisted baseline (`pnpm eval --base-url <url with key> --label baseline-v1`); the final gate numbers (TKT-15).
- **TCs passed:** TC-024 (Ask), TC-026, TC-040–TC-046.
- **Open issues:** (M) EXE13, a user decision: should fallback answers count toward "≥ 9/10 prepared"? (M) GitHub Actions account block (from M-001). (L) `pnpm eval --out <dir>` crashes with EISDIR after the run; to be fixed as a TASK-17 follow-up. (L) Fallback provenance shows "answered in 0.00 s", which is accurate (the server takes about 2 ms) but reads oddly; a Stage 8 candidate.
- **Decision:** every criterion that doesn't need the key passes; continuing.

### Gate M-002 · The demo path on real data — PASS (2026-09-29, delegated gate policy)
- **Commit:** fb383cc (code; QA on d98975a, ledger-only after it). Vercel preview: **pending**.
- **Commands:** `pnpm verify` → 73 files / 916 tests; `pnpm test:e2e` → 329 pass / 49 skipped by project / 0 fail (the orchestrator and QA got the same).
- **Independent QA subagent** (own Playwright scripts against `next start -p 3070`, Carto served offline):
  1. TC-020 steps 1–4 at 375 and 1440 (Message → Brief → Trip "2:14 AM / 38 L / ₹3,420" → Today verdict → Map): **PASS**, 0 console errors.
  2. TC-021 numbers agree across Today, Brief (hi+en), Message (hi+en) and Trip (₹1,86,400, ₹11,430, 3 trips, ₹3,420, 38 L, ₹4,500, ₹3,510, ₹58,240, ₹21,600): **PASS**. The no-rupee-literals test passes.
  3. TC-022: 27/27 URL × width cases with no horizontal scroll, no text under 12 px: **PASS**.
  4. TC-023: the menu reaches all 6 destinations on /, /brief, /message and trips, 44 px targets: **PASS**.
  5. TC-024: every state on Today, Brief and Trip with computed copy and a focusable retry: **PASS**.
  6. TC-025: rows 1–3 update the lit row, glass card and rail knob; rows 2–3 switch to Map; Fleet reads 24 · 11/12/1: **PASS**.
  7. TC-027: with no JS, Hindi is the default and `?lang=en` gives English first paint; the toggle works: **PASS**.
  8. TC-028: Carto aborted → "Map unavailable; every event is in the timeline", page usable: **PASS**.
  9. TC-015: 24/24 **PASS**.
  10. Mockup parity pairs at 1440 and 375 for index, trip, brief, message and states: **PASS**. Differences are fonts and charts under file://, the menu button on the phone screens (EXE12), computed empty-state counts (§4.9), and the host shown as localhost locally.
- **TCs passed:** TC-015, TC-020 (1–4), TC-021, TC-022, TC-023, TC-024, TC-025, TC-027, TC-028.
- **Open issues (low):** the server sends `<html lang="en">` on the Hindi /brief (`<main lang="hi">` is right; html is fixed after hydration); the message preview host needs checking on the preview; state copy, the phone menu and the drawer are English on the Hindi brief; a focus ring shows on the trip h1 in `?state=error`.
- **Decision:** all exit criteria pass. Continuing to the M-004 gate.

### Gate M-004 · Delighter and public surface — PASS (2026-09-29, on the preview)
- **Attempt 4 (preview, eb097af):** TC-055 LCP on `/` is **1.83 s** (median of 9) and on /why **1.52 s**, with Lighthouse mobile, simulated throttling, on `urja-git-build-stage7-tushar-49a6.vercel.app`, where §13 sets the budget. TKT-09 AC3 og:image 200: **PASS**. Every other criterion is unchanged from attempt 3 (PASS). TC-030 manual (Mac GPU) is still pending in the local session. No code change for M-004 and no threshold change. `pnpm test:e2e` was not re-run: eb097af touches only the Ask API header, and `pnpm verify` passes (1014).
- **Attempt 1: FAIL → gate fix round 1.**
- **Commit:** 0f6ab03 (code). `pnpm verify` 969 pass; `pnpm test:e2e` 342 pass / 63 skipped / 0 fail; `check:bundle` clean on a flagless build.
- **Independent QA:**
  - TC-029: **PASS** (poster, 0 errors, no canvas under SwiftShader, debug hooks absent, forced flag ignored).
  - TC-030 automated: **PASS** (13/13). The manual Mac GPU part is **PENDING**.
  - TC-050: **PASS** (13 tags on 5 routes; https on a VERCEL_URL build; og.png 200, 1200×630, 151,669 B; og-card noindex).
  - TKT-08 /why: **PASS** (axe 0 violations).
  - TC-031: **PASS**.
  - TC-055 bundle: **PASS** (no three or maplibre in initial JS; / 188.8 KiB gzip incl. the noModule polyfill; three loads after FCP on / only).
- **FAIL (DoD performance block):** Lighthouse mobile (simulated) LCP is 7.8 s on / and 7.6 s on /why, against 2.5 s. With DevTools throttling: / 2.0 s, /why 4.1 s, /why CLS 0.101. Causes: a 726 KB Anek Devanagari woff2 preloaded on every route, and the /why poster lazy-loaded while it sits inside the phone viewport.
- **Action:** gate fix round 1 dispatched. Performance fixes only (font preload and subsets, image formats, eager /why poster, maplibre CSS only with the map). No threshold or Design Freeze change.
- **Attempt 2 (after fix round 1, 2ec07f9; independent QA, median of 3, Lighthouse 12.8.2 mobile): FAIL.**
  - Simulated throttling (Lighthouse default): / LCP 4.06 s (FCP 2.41, CLS 0.003, TBT 74 ms; LCP = h1.verdict, render delay 3.6 s); /why LCP 3.31 s (CLS 0.000; LCP = poster).
  - DevTools throttling: / 1.05 s, /why 0.99 s (CLS 0.078).
  - Everything else passes again: TC-029, TC-050, TC-055 bundle (/ 189.0 KB gzip incl. the noModule polyfill), /brief in Anek, /why axe, verify 969, check:bundle. e2e: 353 pass / 1 flaky (phone maps reduced-motion; passes 48/48 on rerun).
  - **Action:** gate fix round 2 (the last): font subsetting and preloading, the inlineCss trade-off, legacy JS, lazy state specimens.
- **Attempt 3 (after gate fix round 2, 9845a7b): BLOCKED on one criterion; every other criterion passes.**
  - Fix round 2 (EXE18): self-hosted font subsets with identical rendering (pixel-diffed; OFL licences shipped), one stylesheet, server-rendered posters. Transfer on /: 640 → 346 KB. First-load JS on /: 145 KB gzip.
  - **Lighthouse mobile, simulated throttling, local** (implementer median of 9): / LCP **2.65 s** (FCP 1.07 s, CLS 0.001); /why LCP **2.44 s** (CLS 0). Both are about 1 s under DevTools throttling.
  - A fresh reviewer re-checked round 2:
    - pixel parity 0–28 px of anti-aliasing noise on 14 page × width pairs;
    - ₹ paints from Inter; Devanagari paints in Anek on /brief and /message;
    - posters and preload markup identical;
    - `pnpm verify` 983 pass; e2e 366 pass / 63 skipped / 0 fail; `check:bundle` clean on a flagless build.
  - **Final M-004 criteria:**
    - TC-029: **PASS**.
    - TC-050: **PASS** (local and a VERCEL_URL build; og:image 200 on the preview is **pending**).
    - TC-055 bundle: **PASS**. TC-055 LCP on /why: **PASS locally** (2.44 s).
    - TC-055 LCP on /: **BLOCKED** (2.65 s > 2.5 s after 2 fix rounds; see the TASK-18 row).
    - TC-030 automated: **PASS**. TC-030 manual (Mac GPU): **PENDING** (local session).
    - TKT-08 /why and TC-031 axe: **PASS**.
  - **Decision (user instruction, 2026-09-29):** marked BLOCKED, continuing; no threshold changed.

## Decisions and scope log

_(EXE# entries are mirrored in `decisions.md`)_
