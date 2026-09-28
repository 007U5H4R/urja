---
id: TASK-15
title: 'TKT-11: Give every data view its four states'
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-02'
labels:
  - P1
  - states
  - ready-for-agent
  - 'sp:4'
milestone: m-1
dependencies:
  - TASK-8
  - TASK-9
  - TASK-10
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: feature
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** Loading, empty, error and working on every data view, truthful and recoverable (acceptance #4, Design.md §18).

**Scope.** ?state=loading|empty|clean|error on Today and Brief, ?state=loading|error on Trip; real loading.tsx skeletons (no invented progress) and error.tsx with retry; the clean day is 24 Sep's real data; the data-late error is computed from yesterday's trips.

**Related TC.** TC-024, TC-022 · **Related EVAL.** —
**Dependencies.** TKT-04, TKT-05, TKT-06 · **Estimate.** sp:4 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-11 · Plan: technical-plan.md § TKT-11
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each state renders on each view with the final/states.html copy and numbers computed from data (TC-024)
- [ ] #2 Every error says what happened, what to do next and whether anything was lost, with a visible retry
- [ ] #3 Real route loading shows the skeleton only — no invented progress
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
