---
id: TASK-10
title: 'TKT-06: Build the 7 AM message and the Morning brief in Hindi and English'
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-01'
labels:
  - P0
  - phone
  - ready-for-agent
  - 'sp:6'
milestone: m-1
dependencies:
  - TASK-6
  - TASK-7
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: feature
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** The owner's phone task model: the brief is home, Hindi first, generated from the flags so it never hallucinates (S6).

**Scope.** lib/brief/template.ts (hi + en, place/driver dictionaries, confidence words); /message (chat, preview card with the fuel trace, quick replies, language toggle, real host name); /brief (earned + 14-day bars, leak line, 3 items, clean line, month card, Ask dock slot); ?lang= SSR + client toggle.

**Related TC.** TC-015, TC-027, TC-010 (UI), TC-022 · **Related EVAL.** —
**Dependencies.** TKT-02, TKT-03 · **Estimate.** sp:6 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-06 · Plan: technical-plan.md § TKT-06
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Template output for 27 Sep equals the mockup strings in hi and en with computed numbers (snapshot tests, TC-015)
- [ ] #2 The toggle switches copy, lang, title and aria-labels; Hindi by default; ?lang=en renders English on first paint
- [ ] #3 14-day bars = the daily profit series; the month card = ₹58,240 flagged / ₹21,600 recovered with weekly bricks
- [ ] #4 Items link to their trips; "Only high ones" shows only High items
- [ ] #5 No horizontal scroll at 375/768/1440; Devanagari renders in Anek Devanagari
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
