# Urja QA report (TKT-15, Stages 8–10)

**Branch:** `build/stage7` at 9f21d89. PR 007U5H4R/urja#1 is not merged and `main` is untouched.
**Date:** 2026-10-05. The interview is on 2026-10-07.

## Recommendation (single)
**GO for Stage 11 (merge to `main` and the production deploy), on one condition:** the live Ask eval (`final-v1`) is re-run at 18:45 UTC today, once the Gemini free-tier quota resets, and its result is recorded honestly.
- **If it passes** the evaluation-plan §7 gate, ship as is.
- **If Gemini is still quota-limited, ship anyway** and record the Ask eval gate as **BLOCKED upstream (free-tier quota; EXE32)**, not as passed. Why that is safe:
  - every screen, number and flow works without the model;
  - Ask answers from the deterministic fallback, which is labelled as such;
  - no threshold is weakened.

The merge to `main` needs the user's explicit approval (CLAUDE.md).

## Stage 8: design critique (TSK-15.1): PASS
- Three critics found 40 issues, which merge into DES-2…39 (`docs/exec/stage8-critique.md`; EXE29). No Design Freeze change was needed.
- Fixed and reviewed in units S1, S2, S3, F and H.
- Independent QA on the preview: `docs/exec/qa/stage8-qa.md`.
- All of the Design.md §17 Stage 8 checks pass:
  - 320 px reflow;
  - 200% page zoom;
  - a keyboard-only pass of the demo path.
- **Parked:**
  - DES-35: repeated km on hidden trucks. The user chose to leave the data as is.
  - DES-36: the R4 map deviation, which is not on the demo path.
  - DES-37: the preview host on the link card.
  - DES-38: the 1440 px glass-card wrap. Fixing it would touch the hero composition.
  - DES-39: text-only 200% on /why at 430 px and 320 px. Page zoom passes.

## Stage 9: code review, tests, eval (TSK-15.2)
- **Code review (CR-):** `/code-review` over main...build/stage7 found 1 issue, CR-1: the request `lang` was ignored. It is fixed (8bcb303).
- **Tests:**
  - `pnpm verify`: 1235 passed, 1 skipped.
  - build + `check:bundle`: clean.
  - `pnpm test:e2e`: 515 passed, 0 failed.
  - The TC matrix is in `docs/exec/qa/tc-matrix.md`.
  - TC-055 on the preview: LCP 1.80 s, first-load JS 186.7 KiB.
  - TC-020: the full path passes at 375 px, at 1440 px and on Fast 3G (`docs/exec/qa/stage9-tc055-tc020.md`).
  - Still open, manual: TC-030 rows on the Mac GPU and the TC-032 re-run. TC-051 waits for production.
- **Ask eval** (`evals/reports/eval-report-v1.md`):
  - baseline-v1: 3/10 by the model, gate FAIL.
  - ask-v2 (EXE30) and the free-tier changes (EXE31) fix every failure class the baseline exposed.
  - final-v1 attempt 1: every call got Gemini 429 (quota). 0/10 by the model; the deterministic paths were all correct; gate FAIL. **Pending:** the retry at 18:45 UTC.

## Stage 10: security review (TSK-15.3, SEC-): PASS, no findings
`/security-review` of main...build/stage7 found no vulnerabilities at confidence ≥ 8. What it checked:
- **The key:**
  - only on the server (`server-only`), sent only in the `x-goog-api-key` header;
  - never in responses, headers or logs;
  - `check:bundle` keeps it out of the client bundle.
- **Ask abuse:**
  - zod input limits and a 413 body cap;
  - leak, canary and forbidden-word guards;
  - the answer cache holds only guarded model answers over one shared static dataset, so it can't be poisoned across users;
  - `x-ask-cache: bypass` only skips the cache read.
- **`x-ask-outcome`** carries only fixed codes, environment model ids, numeric statuses and reduced reason tokens. It holds no user input. **Decision (EXE26 default):** keep it for production.
- **Redirects:** the `?lang=en` rewrite and the redirect use fixed internal paths, so there is no open redirect.
- **XSS:** the only `dangerouslySetInnerHTML` is the static icon sprite. Model answers render as text.
- **`/og-card`:** marked `noindex`. Only simulated data is exposed.
- **CI:** `push` and `pull_request` only, `contents: read`, no secrets.
- **Noted, excluded as rate limiting:** the per-IP limiter trusts the client-IP header.

## Open items (none block the GO)
- The Gemini free-tier quota limits live answers on busy days (EXE32).
- The native Hindi review is deferred (EXE32).
- TC-030 and TC-032 manual runs on the Mac.
- Stage 11 (TKT-16):
  1. merge the PR after the user approves;
  2. set `NEXT_PUBLIC_SITE_URL`;
  3. run TC-020 and TC-050 on production;
  4. run TC-051 in LinkedIn Post Inspector and opengraph.xyz;
  5. write the rollback notes and `lesson-learnt.md`.
