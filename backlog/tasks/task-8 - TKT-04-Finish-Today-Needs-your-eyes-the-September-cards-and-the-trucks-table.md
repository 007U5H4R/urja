---
id: TASK-8
title: >-
  TKT-04: Finish Today: Needs your eyes, the September cards and the trucks
  table
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-01'
labels:
  - P0
  - today
  - ready-for-agent
  - 'sp:4'
milestone: m-1
dependencies:
  - TASK-6
  - TASK-7
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: feature
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** Today answers "what needs me" and "how is the month" with the metric-and-guardrail story (S7, D5), all computed.

**Scope.** EyesList (3 rows + clean line), four KPI chart cards with takeaway footers and data-driven aria-labels, TrucksTable (ranks 1–5, gap row, 22–24; "All 24 trucks" expands in place), #trucks anchor, tablet/phone layouts (Design.md §16).

**Related TC.** TC-006–TC-010 (UI), TC-021, TC-022, TC-031 · **Related EVAL.** —
**Dependencies.** TKT-02, TKT-03 · **Estimate.** sp:4 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-04 · Plan: technical-plan.md § TKT-04
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every number in these sections comes from view models (no literals) and matches TC-006–TC-010
- [ ] #2 Eyes rows are ordered by confidence, then ₹; each Evidence link opens /trips/{id}
- [ ] #3 Chart aria-labels state the data in words, generated from data
- [ ] #4 "All 24 trucks" expands the gap row into all 24 rows and collapses back; keyboard accessible
- [ ] #5 Layout per Design.md §16 at 375/768/1440; no horizontal scroll
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
