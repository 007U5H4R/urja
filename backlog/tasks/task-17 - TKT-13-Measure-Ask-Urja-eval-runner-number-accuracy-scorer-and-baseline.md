---
id: TASK-17
title: 'TKT-13: Measure Ask Urja: eval runner, number-accuracy scorer and baseline'
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-02'
labels:
  - P1
  - eval
  - ready-for-agent
  - 'sp:4'
milestone: m-2
dependencies:
  - TASK-11
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: task
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** Acceptance #3 as evidence, not a demo: a reproducible pnpm eval with provenance and a baseline before any prompt tuning.

**Scope.** evals/scorers/ask-scorer.ts (digit normalisation incl. Devanagari, ₹/L/% extraction, required facts, allowed-number set, cites, language, forbidden patterns, canary, out-of-scope) + unit tests; evals/run-ask-eval.ts (base URL, pacing, provenance); pnpm eval; evals/results/ask-baseline-v1.json.

**Related TC.** TC-060 · **Related EVAL.** EVAL-001–EVAL-013
**Dependencies.** TKT-07 · **Estimate.** sp:4 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-13 · Plan: technical-plan.md § TKT-13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scorer unit tests pass on canned answers: correct EN, correct HI, hallucinated number, missing cite, theft wording, leaked canary, off-topic refusal
- [ ] #2 pnpm eval --base-url <url> runs all 13 cases and writes a results file with provenance; failed cases are listed, never dropped
- [ ] #3 The baseline is recorded before any prompt tuning; later runs report the delta against it
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
