# Stage 7 execution ledger — Urja

Branch: `build/stage7` (never `main`). Protocol: `CLAUDE.md` + `technical-plan.md` §16.2.
Status values: todo | doing | review | done | blocked. `BLOCKED-pending-key` = needs `GEMINI_API_KEY`, which this cloud environment does not have (§16.1 path B).
Vercel: previews may be missing or auth-protected from the VM, so each row records the pushed SHA; preview checks are **pending** for the local session (§16.3).

## Tasks

| TASK | TSK | status | commit | tests | evidence | notes |
|---|---|---|---|---|---|---|
| TASK-5 | TSK-01.1–01.5 | done | 38eda87, 05bb86f | TC-061 pass (fail-proof shown); format 15/15 under TZ=UTC and America/Los_Angeles; smoke e2e 3/3 (desktop/tablet/phone); `pnpm build` pass | pushed SHA 05bb86f; Vercel preview **pending** (checked by the local session) | Next **16.3.6** (`pnpm view next version`), React 19.2.8, pnpm 12.6.0, Playwright 1.56.1. Spec review PASS; quality review 1 fix round (worktree ignores, symmetric rounding, U+2212 litres). **CI (TC-060): GitHub Actions jobs fail in ~2 s with no steps or logs** on both pushes: an account-side block (likely Actions billing/minutes for the private repo), not the workflow; local `pnpm verify` + `pnpm build` stand in until the user checks Settings → Billing. EXE1–EXE3. |
| TASK-6 | TSK-02.1–02.2 | done | f8bd27d | 74 unit tests pass (types verbatim, PRNG, clock, geo 1.6 km / 3.1 km, fleet 24/24 rows vs §4.3) | pushed | Unit A. Spec PASS; quality PASS + 1 fix round (integer R2/R3/R4 comparators, frozen routes). Invented plaza/pump names off NH48 and all Hindi place names go to the Hindi review. |
| TASK-6 | TSK-02.3–02.5 (+ledger) | done | ba6bea2 | 258 unit tests: TC-011 boundaries (R1 15.0/15.1, geofence, 5 km/h; R2 8.0/8.1%; R3 36,399/36,400 cL; R4 6.0/6.1% + 10.1 km; R5 ₹49/₹50), property 23 detected = 23 injected, 0926-04 trace vs night0926() ±1.8 L, ledger 13,240, yesterday and September totals exact (independent re-verification script) | pushed | Unit B. Spec: 1 gap (fractional litres on most trips) fixed in round 1 → only 0927-09 fractional; quality: 9 minor fixed (R4 perf ~0.6 s cold, strict zod, --check compares file, wrong flags excluded); round 2: Hindi part-of-day boundary (शाम to 9 PM). Generator seeded, ~60 s, passes on attempt 42; scenario.json 227 KB. Decisions EXE4–EXE7. |
| TASK-6 | TSK-02.6–02.8 | todo | — | — | — | Unit C: aggregates, views, golden tests, Today head |
| TASK-7 | TSK-03.1–03.3 | done | c6b0673 | 67 unit (tokens vs Design.md §12, lamp.css port parity, icons, shell); e2e 21 pass / 6 project-skipped (TC-022 shell at 375/768/1440, TC-023 menu 6 destinations, .kbd hidden on coarse) | pushed; screenshots 1440/375 vs final/index.html match (fonts aside) | Unit A. Spec PASS; quality PASS + 1 fix round (menu Escape/outside/route close, hydration-safe e2e, prefetch on pills, not-found + placeholder routes, lib/ask-events.ts). Port substitutions: no Tailwind preflight, next/font owns --font/--font-hi, poster url → /truck-scene.png, .proto-banner dropped (§5.2). |
| TASK-7 | TSK-03.4–03.5 | done | e1ba025 | 192 unit tests: primitives (Money ₹1,86,400, lit-loss, U+2212; Confidence 3 bars + word, hi/en), chart parity at all 17 mockup call sites (full SVG tree vs final/charts.js in jsdom), robustness (zero/empty data) | pushed | Unit B. Spec: 1 gap (Money `sign` boolean) fixed; quality: 4 blocking (NaN on zero data, short kind arrays) fixed in round 1, re-review PASS. Known minor, not fixed: Wave with empty fuel + notes, Meter NaN value, Rail knob unclamped when t > total (no view model produces these). |
| TASK-8 | TSK-04.1–04.5 | todo | — | — | — | TKT-04 Today lower half |
| TASK-9 | TSK-05.1–05.5 | todo | — | — | — | TKT-05 Trip evidence |
| TASK-10 | TSK-06.1–06.4 | todo | — | — | — | TKT-06 Message and brief |
| TASK-11 | TSK-07.1–07.6 | todo | — | — | — | TKT-07 Ask API |
| TASK-12 | TSK-08.1–08.2 | todo | — | — | — | TKT-08 Why Urja |
| TASK-13 | TSK-09.1–09.2 | todo | — | — | — | TKT-09 Link preview |
| TASK-14 | TSK-10.1–10.4 | todo | — | — | — | TKT-10 Maps |
| TASK-15 | TSK-11.1–11.3 | todo | — | — | — | TKT-11 Screen states |
| TASK-16 | TSK-12.1–12.4 | todo | — | — | — | TKT-12 Ask UI |
| TASK-17 | TSK-13.1–13.3 | todo | — | — | — | TKT-13 Ask eval |
| TASK-18 | TSK-14.1–14.4 | todo | — | — | — | TKT-14 3D scene |
| TASK-19 | TSK-15.* | todo | — | — | — | TKT-15: not in this session's scope (local @claude) |
| TASK-20 | TSK-16.* | todo | — | — | — | TKT-16: not in this session's scope (local @claude) |

## Gates

_(one section per milestone, newest last)_

## Decisions and scope log

_(EXE# entries are mirrored in `decisions.md`)_
