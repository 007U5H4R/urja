# Lessons learnt: Urja (Stages 7–11)

## What worked
- **One implementer per unit plus two fresh reviewers** (spec, then code quality), with at most 2 fix rounds. Reviewers caught real defects the implementers missed:
  - the production guard bypass through a runtime env lookup;
  - a case-sensitive leak guard;
  - "any plate grounds an answer";
  - an eval gate passing on cached answers;
  - a 6 h bench on a stray 404;
  - a 100%-text stretch regression;
  - the map attribution folded at load.
- **Disjoint file ownership across at most 3 parallel worktrees**, merged by cherry-pick. Conflicts stayed near zero, apart from shared e2e files, which merged cleanly by hunk.
- **Fixed numbers guarded by golden tests from day one.** No screen ever showed a number that disagreed with the rules R1–R5.
- **An independent QA pass on the real preview after each fix round** found what local e2e couldn't:
  - the minifier dropping `backdrop-filter`;
  - `landmark-unique` from a new scroll region;
  - text-only zoom overflow.
- **Honest gates.** Thresholds never moved. "Passed on a fallback, not the model" and "served from cache" are warnings in the runner, not hidden.

## What cost time
- **Account and environment blockers:**
  - GitHub Actions billing (TC-060);
  - Vercel Authentication on previews (fixed with a bypass credential);
  - a sandbox Chromium that doesn't trust the egress proxy's CA. Fixed by Node-side fetch, or the CA in NSS via certutil, without disabling TLS.
- **Gemini free tier.** The quota ran out after about 40 calls a day (429), and later calls timed out. The fallback model id 404'd for the key. The final eval was blocked upstream twice. Lesson: budget eval calls against the free tier from the start, record `x-ask-outcome` per case from the first run, and cache model answers for demo repeats.
- **The first eval runner didn't record why a call failed.** The baseline's fallbacks had no cause until outcomes were added. Diagnostics belong in v1.
- **`next dev` rewrites the checked-in CLAUDE.md.** Use `next build` + `next start` in agents.
- **Shared `.next` folders between a reviewer and an implementer** caused spurious 500s. Give each process its own build or port, and never rebuild under a running server.

## Do differently next time
- Put an `x-ask-cache: bypass` / outcome-diagnostics contract into the eval plan before the first run.
- Run axe with the WCAG 2.2 tags from the start. The default ruleset skips `target-size`.
- Test at 100% and 200% text together whenever fixed heights become `min-height`.
- Treat the deploy target's auth (preview protection) and the model quota as Stage 5 risks with owners, not Stage 9 surprises.
