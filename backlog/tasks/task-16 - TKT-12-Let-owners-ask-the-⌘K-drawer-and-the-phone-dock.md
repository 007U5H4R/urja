---
id: TASK-16
title: 'TKT-12: Let owners ask: the ⌘K drawer and the phone dock'
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-02'
labels:
  - P0
  - ask
  - ready-for-agent
  - 'sp:4'
milestone: m-2
dependencies:
  - TASK-11
  - TASK-9
  - TASK-10
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: feature
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** Ask Urja on every screen: a search-style bar on desktop, a dock and chat on the phone, with citations and provenance (Design.md §13, §15, §17).

**Scope.** AskDrawer (shadcn/Radix Dialog: right edge, 240 ms, scrim 180 ms, focus trap, inert page, Esc, focus return) + ⌘K/Ctrl+K; phone dock on the brief + chat from the menu; idle, answering, answer, fallback and error states; cite chips → trips; provenance line.

**Related TC.** TC-026, TC-024 (Ask) · **Related EVAL.** EVAL-001–EVAL-013 (UI)
**Dependencies.** TKT-07, TKT-05, TKT-06 · **Estimate.** sp:4 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-12 · Plan: technical-plan.md § TKT-12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ⌘K opens with focus in the input; Tab stays inside; Esc closes; focus returns to the trigger; the page behind is inert (TC-026)
- [ ] #2 All five states render; fallback shows for mode "fallback" or "saved" (TC-024)
- [ ] #3 Cite chips open the right trip; provenance shows model, measured time, scope and "Urja can be wrong"
- [ ] #4 Works at 375 (dock + chat) and 1440 (drawer)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
