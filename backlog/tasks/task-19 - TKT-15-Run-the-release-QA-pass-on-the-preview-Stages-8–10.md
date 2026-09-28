---
id: TASK-19
title: 'TKT-15: Run the release QA pass on the preview (Stages 8–10)'
status: To Do
assignee:
  - '@claude'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-04'
labels:
  - P0
  - qa
  - ready-for-agent
  - 'sp:8'
milestone: m-4
dependencies:
  - TASK-12
  - TASK-13
  - TASK-15
  - TASK-16
  - TASK-17
  - TASK-18
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: task
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** One critique pass, one code-review + test/eval pass and one security pass (S9), consolidated into QA-report.md.

**Scope.** Stage 8 impeccable critique vs Design.md + final/ (DES-); Stage 9 /code-review (CR-) + every TC + the final eval run (ask-eval-run-v1.json, eval-report-v1.md); Stage 10 /security-review (SEC-) incl. key exposure and Ask abuse; QA-report.md with one recommendation.

**Related TC.** TC-020, TC-021, TC-030, TC-031, TC-032, TC-055 · **Related EVAL.** EVAL-001–EVAL-013 (final run)
**Dependencies.** TKT-08, TKT-09, TKT-11, TKT-12, TKT-13, TKT-14 · **Estimate.** sp:8 (agent-hours) · **Owner.** @claude
Source: tickets.md § TKT-15 · Plan: technical-plan.md § TKT-15
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 DES-, CR- and SEC- findings are fixed or parked with a reason
- [ ] #2 All automated TCs pass; manual TCs are recorded PASS/FAIL/BLOCKED with evidence
- [ ] #3 Eval gate met: ≥ 9/10 prepared, 3/3 off-topic, p50 < 4 s, 0 forbidden words, 0 unsupported ₹/L figures
- [ ] #4 QA-report.md approved by the user
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
