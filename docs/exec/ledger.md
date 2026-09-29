# Stage 7 execution ledger — Urja

## Stage 7 summary (final, 2026-09-29)
**Status: Stage 7 is complete on `build/stage7`** (PR [007U5H4R/urja#1](https://github.com/007U5H4R/urja/pull/1), not merged; `main` untouched). TKT-15 and TKT-16 (Stages 8–11) are out of scope.

**Done: all 14 build tickets (TKT-01..14 = TASK-5..18).** Each unit had one implementer (TDD), a fresh spec review and a fresh code-quality review, at most 2 fix rounds, and one commit per unit, pushed. Main code commits:

| Ticket | TASK | Commits |
|---|---|---|
| TKT-01 scaffold, CI, secret scan | TASK-5 | 38eda87, 05bb86f |
| TKT-02 data engine and verdict | TASK-6 | f8bd27d, ba6bea2, d04f4f4 |
| TKT-03 Lamplight foundation | TASK-7 | c6b0673, e1ba025 |
| TKT-04 Today lower half | TASK-8 | c4ddb91 |
| TKT-05 Trip evidence | TASK-9 | b38035c |
| TKT-06 Message and brief | TASK-10 | 3b5c6be |
| TKT-07 Ask API | TASK-11 | 8b1642a, ddfb752 |
| TKT-08 Why Urja | TASK-12 | abc2620 |
| TKT-09 Link preview | TASK-13 | bf082f6 |
| TKT-10 Maps | TASK-14 | 9d04764 |
| TKT-11 Screen states | TASK-15 | fb383cc |
| TKT-12 Ask UI | TASK-16 | 6e9c710 |
| TKT-13 Ask eval | TASK-17 | 42a5e92, 63bb068 |
| TKT-14 3D scene + M-004 performance fixes | TASK-18 | 0f6ab03, 2ec07f9, 9845a7b |

**Final checks on 9845a7b:**
- `pnpm verify`: 81 files / 983 tests pass (1 skipped).
- `pnpm test:e2e`: 366 pass / 63 skipped by viewport project / 0 fail. One known flaky test ([phone] maps.spec reduced-motion) failed once under full-suite load elsewhere and passes on rerun.
- `pnpm check:bundle` (flagless build): no key material, no debug hooks.

**Gates** (details under "Gates" below):
- M-001: **PASS**.
- M-002: **PASS**.
- M-003: **PASS** on every criterion that doesn't need the key.
- M-004: **PASS** except TC-055 LCP on `/` (**BLOCKED**).

**TCs passed** (automated, locally):
- Data and rules: TC-001–TC-014, TC-015.
- Screens and flows: TC-020 (steps 1–4), TC-021, TC-022, TC-023, TC-024, TC-025, TC-026, TC-027, TC-028, TC-029, TC-031.
- Ask: TC-040–TC-046.
- Link preview and quality: TC-050 (local and a VERCEL_URL build), TC-055 (bundle; LCP on /why), TC-061.
- TC-030's automated part.
- TC-060: GitHub Actions CI is green on both push and pull_request (cb49283). A flaky wrapper test found by the first real CI run was fixed in the test only; the component is unchanged.

**BLOCKED:**
1. **BLOCKED-pending-key** (no `GEMINI_API_KEY` here, EXE3; never faked):
   - TSK-07.1 probe and the TP5 model/thinking check. Run `pnpm tsx --conditions=react-server scripts/probe-gemini.ts` first.
   - TKT-07 AC6: a live answer in under 4 s.
   - TSK-13.3 baseline: `pnpm eval --base-url <preview or localhost with key> --label baseline-v1`, then commit `evals/results/ask-baseline-v1-<sha>.json`.
   - The final eval gate numbers (TKT-15), now counting only model answers (EXE13).
2. **TC-055 LCP on `/` (BLOCKED; budget stays 2.5 s):** Lighthouse mobile with simulated throttling, locally, is 2.65 s after the 2 allowed fix rounds (it was 7.8 s). /why is at 2.44 s. §13 measures on the preview (HTTP/2 + CDN). **Next step, once the Vercel Protection Bypass secret is in this environment: measure it on the preview first.** If it still fails there, restructure Today's client islands.
3. **Pending on the preview.** The Vercel preview builds and deploys: build/stage7 at 75ca01e is **Ready** (2026-09-29 10:35 UTC), at `urja-git-build-stage7-tushar-49a6.vercel.app`. But it sits behind Vercel Authentication, so the VM gets redirected to Vercel's login and can't run these checks:
   - preview 200;
   - og:image 200 on the preview (TKT-09 AC3);
   - TC-051 unfurl;
   - Lighthouse on the preview.
4. **Pending, manual (local session):** TC-030 on the Mac GPU (`docs/exec/tc-030-manual.md`) and the native Hindi review (`docs/exec/hindi-review.md`, 245 strings).
5. **CI (TC-060) on GitHub: resolved 2026-09-29.** The earlier block was account billing. GitHub's annotation said "recent account payments have failed or your spending limit needs to be increased". After billing was fixed, run 55 (push, 7d7b059, attempt 2) passed every step: checkout, pnpm setup, Node 22, frozen install, `pnpm verify`, `pnpm build`, `pnpm check:bundle`.

**User decisions (2026-09-29):**
- **EXE13: accepted.** Only answers written by Gemini count toward "≥ 9/10 prepared"; fallback answers never count. Stricter, threshold unchanged. The runner gate and evaluation-plan §2/§7 are updated, and runner tests cover it.
- **EXE16: confirmed.** The scene tag stays on the fallback poster; it is the honesty label and follows TC-029.

**Still open (the user's, no action here):**
- The byline "Tushar Pathak" (`content/why.ts`) is not yet confirmed. Field quotes (`content/field-notes.ts`) are empty and the placeholder shows.
- The user will add `GEMINI_API_KEY` in Vercel and a Vercel Protection Bypass secret to this cloud environment. **When the bypass secret appears, measure TC-055 LCP on the preview first** (blocked item 2), then the other preview checks (item 3).
- Judgement calls to confirm when convenient:
  - EXE12: /brief and /message use their own top bar, following the phone mockups.
  - EXE11: /why's phone menu has no "Ask Urja", matching why.html.
  - EXE15: no route `loading.tsx` on prerendered pages; `?state=loading` shows the skeleton instead.
  - State copy, drawer labels and the phone menu are English-only on the Hindi brief.

**DES/CR candidates for Stage 8–9:**
- Balancer-trip outliers in long-route normals (EXE9).
- Self-written R2–R5 variant copy (EXE10).
- Fallback provenance shows "answered in 0.00 s".
- Server `<html lang="en">` on the Hindi /brief (`<main lang="hi">` is correct).
- Hero cameras fitted to the data vs map.js framing.
- Fleet card says "updated just now".
- OG mini chart has 2 red bars (data-true) vs the mockup's 4.
- Moderate axe findings: `region` on /brief, `heading-order` on /message.
- /trips/0926-04 CLS 0.115 at 412 px with a 1.2 s font delay.
- `poster-img.ts` depends on a Next internal (pinned 16.3.6, parity-tested).
- Wave/Meter/Rail degenerate-input nits (TASK-7).

**Decisions logged:** EXE1–EXE18 in `decisions.md`.

Branch: `build/stage7` (never `main`). Protocol: `CLAUDE.md` + `technical-plan.md` §16.2.
Status values: todo | doing | review | done | blocked. `BLOCKED-pending-key` = needs `GEMINI_API_KEY`, which this cloud environment does not have (§16.1 path B).
Vercel: previews may be missing or auth-protected from the VM, so each row records the pushed SHA; preview checks are **pending** for the local session (§16.3).

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
| TASK-11 | TSK-07.1 + AC6 | **BLOCKED-pending-key** | — | `scripts/probe-gemini.ts` prints "probe BLOCKED-pending-key" without a key (run with `--conditions=react-server`) | — | Needs `GEMINI_API_KEY` (EXE3). TP5 (model id + thinking level) unverified: `thinkingLevel: "minimal"` default, override `ASK_THINKING_LEVEL`. Run the probe first when a key exists. |
| TASK-12 | TSK-08.1–08.2 | done | abc2620 | 337 unit in unit (placeholder + ASSUMPTION when quotes empty, fleet facts from data); e2e why + shell 47 pass (TC-022, axe 0 violations at 3 widths, one h1, real table, lazy poster AVIF/WebP, top-bar variant, 44 px touch targets on coarse pointers) | pushed; screenshots 1440/375 vs final/why.html match (fonts aside) | Spec PASS; quality PASS + 8 minor fixed in round 1 (why.css scoped under .essay, content-driven tiles, table name, SVG id prefixes). EXE11. Byline "Tushar Pathak" awaits user confirmation (`content/why.ts` BYLINE). |
| TASK-13 | TSK-09.1–09.2 | done | bf082f6 | 754 unit in unit (lib/og alt = §9 string from data, lib/metadata per route, lib/site env cases, og.png IHDR 1200×630 and 151,669 B); e2e metadata: TC-050 tags on /, /why, /trips/0926-04, /brief (+?lang=en), /message; og.png 200; /og-card noindex, no top bar, not in nav; robots absent elsewhere | pushed; verified with a VERCEL_URL=example.vercel.app build (all https); og mockup vs /og-card parity screenshots match (2 red bars vs 4: data-true) | Spec PASS; quality: 1 blocking (site URL normalisation → adopted TASK-10's lib/site.ts) + render-script robustness fixed in round 1 and rebased on build/stage7. TKT-09 AC3 (og:image 200 on the preview) and TC-051 are pending (preview access). |
| TASK-14 | TSK-10.1–10.4 | done | 9d04764 | 878 unit in unit (css-color, warm-style, map-client ready/8 s timeout/onFail, HeroCard selection with the map never loading, deep links, unmount while pending); e2e 287 pass / 49 project-skipped on the full suite (maps.spec 48: TC-025 selection + fly 1.4 s, TC-028 Carto aborted → overlay, reduced motion jump/no ping, TC-055 no maplibre in initial JS of /, axe) | pushed; mockup vs app screenshots (map 1/2, fleet, trip) match in elements; framing fitted to data | Spec PASS; quality PASS + 7 minor fixed in round 1. maplibre-gl 4.7.1 exact, dynamic import only. New shared e2e/fixtures.ts serves an offline Carto style to every spec (the sandbox browser doesn't trust the proxy CA; TLS verification stays on); @tiles specs use live tiles via Node. `/` stays static. |
| TASK-15 | TSK-11.1–11.3 | done | fb383cc | 909 unit in unit (parseState, stateSpecimens golden: "11 of 17 done", "All 17 trips add up. ₹1,94,800 earned, nothing unaccounted.", "4th clean day", "6 trucks haven't sent data since 2 AM … The other 11 trips are ready.", "11 trucks are still on the road and 13 were in the yard or workshop"; static invariant; focus to h1); e2e states 42/42 and the full suite 329 pass / 49 project-skipped / 0 fail | pushed | Spec PASS; quality PASS + minor fixes in round 1 (trip loading.tsx deleted, focus after recovery, aria-busy scope, tests). EXE15: no route loading files on prerendered pages (scope change: TSK-11.1 loading.tsx not shipped; TC-027 no-JS first paint wins). State copy English-only, as in states.html. |
| TASK-16 | TSK-12.1–12.4 | done | 6e9c710 | 800 unit in unit (useAsk incl. timeout during body read, loader retry, error boundary; AskAnswer text-only rendering, cites, provenance); e2e ask 28 pass / 20 project-skipped (TC-026 ⌘K/Ctrl+K, 12× Tab trapped, inert, Esc/scrim, focus return; motion 0.24 s/0.18 s; TC-024 states; ?ask deep link; phone dock + full-screen chat on /, /brief, /message; axe) | pushed | Spec: 2 gaps (?ask deep link, saved banner) fixed; quality: 1 blocking (stuck on answering after a timeout mid-body) + 5 minor fixed in round 1. EXE14. First-load JS on / ≈ 182 KB gzip incl. the noModule polyfill. |
| TASK-17 | TSK-13.1–13.2 | done | 42a5e92 | 678 unit in unit: scorer per evaluation-plan §4 (24 fixtures: 13 passing, 11 failing incl. all AC1 cases), runner with mocked fetch (pacing, 429 retry, timeouts, provenance, baseline delta, §7 gate + §2 blockers enforced separately, key-shape gate, redaction); smoke run vs next start (no key): 10/10 prepared via fallback, 0/3 off-topic (saved), gate FAIL as expected — not committed | pushed | Spec: 1 gap (§2 blockers) fixed; quality: 2 blocking fixed in round 1; re-review found a comma-grouping false pass → fixed in round 2. Dataset and plan untouched. EXE13 (fallback vs model in the gate) is an OPEN user decision. |
| TASK-17 | EXE13 gate | done | (this commit) | 89 eval tests: a 10/10 run with 3 fallback answers → FAIL (7/10 by the model); all-fallback → FAIL; 9/10 by the model → PASS | pushed | User decision EXE13: the prepared gate counts only model answers; evaluation-plan §2/§7 updated. Threshold unchanged. |
| TASK-17 | follow-up | done | 63bb068 | 7 new runner tests: `--out <dir>` validated before any request | pushed | Found at the M-003 gate (EISDIR after a full run). |
| TASK-17 | TSK-13.3 | **BLOCKED-pending-key** | — | — | — | Run once `GEMINI_API_KEY` exists: `pnpm eval --base-url <preview or localhost with key> --label baseline-v1`, commit `evals/results/ask-baseline-v1-<sha>.json`, then later runs pass `--baseline <that file>`. |
| TASK-18 | TSK-14.1–14.4 | done | 0f6ab03 | 969 unit in unit (guard regex, §7 dispose order + registry, isLive, mid-load unmount, bundle-debug scanner); e2e scene: TC-029 poster + 0 errors on 3 viewports, TC-055 no three in initial JS of / or trips (loads after FCP on / only), TC-030 automated: ≤ 1 live WebGL context after 10 Today ↔ Trip navigations counted by wrapping getContext, drag limits, no zoom, keyboard rotate/reset, context loss → poster; full suite 342 pass / 63 project-skipped / 0 fail; `check:bundle` clean on a flagless build | pushed | Spec: 1 blocking (production guard bypass via runtime env lookup) fixed by inlining NEXT_PUBLIC_DEBUG_GL in next.config.ts + a bundle check; quality: 2 blocking (tablet hero overlap hid "Open the evidence"; a test that couldn't fail) + 6 minor fixed in round 1; re-review reproduced the old attack → blocked. three@0.169.0 exact. EXE16 (scene tag on the fallback poster, flagged for the user). **TC-030 manual (Mac GPU) pending:** `docs/exec/tc-030-manual.md`. M-004 gate fixes: 2ec07f9 (EXE17) and 9845a7b (EXE18). |
| TASK-18 | TC-055 LCP on / | **BLOCKED** | 9845a7b | Lighthouse mobile, simulated, local: / LCP 2.65 s (budget 2.5 s; was 7.8 s), /why 2.44 s, CLS ≤ 0.001 | local Lighthouse JSON in the session scratchpad (not in the repo) | Still over budget after the 2 allowed gate fix rounds; threshold unchanged. Remaining cost: ~125 KB gzip React/Next runtime evaluated before the first frame, plus HTTP/1.1 round trips locally. §13 measures on the preview (HTTP/2 + CDN), which the VM can't reach: **measure on the preview first**. If it still fails there, restructure Today's client islands (Stage 9/10). |
| TASK-19 | TSK-15.* | todo (out of Stage 7 scope) | — | — | — | TKT-15 Stages 8–10 (local @claude) |
| TASK-20 | TSK-16.* | todo (out of Stage 7 scope) | — | — | — | TKT-16 Stage 11 (local @claude) |

## Gates

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

### Gate M-004 · Delighter and public surface — BLOCKED on TC-055 LCP for / only; everything else PASS (2026-09-29)
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
