---
id: TASK-7
title: >-
  TKT-03: Build the Lamplight foundation: tokens, fonts, shell and chart
  primitives
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-09-30'
labels:
  - P0
  - design-system
  - ready-for-agent
  - 'sp:6'
milestone: m-0
dependencies:
  - TASK-5
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: feature
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** Every screen shares one verbatim port of the approved visual language (final/lamp.css, charts.js, icons.js).

**Scope.** lamp.css → app/globals.css (@theme tokens + base + component rules, values verbatim); next/font Inter (opsz) + Anek Devanagari (wdth); icon sprite; TopBar (wordmark, Ask trigger slot, pill nav, fleet chip, mobile menu); Plate, Money, Confidence, StatusChip, DeltaChip, Panel, SectionHead; Bars, Bricks, Units, Meter, Rail, Wave as typed SVG components.

**Related TC.** TC-022 (shell), TC-023, TC-031 (shell) · **Related EVAL.** —
**Dependencies.** TKT-01 · **Estimate.** sp:6 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-03 · Plan: technical-plan.md § TKT-03
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tokens equal Design.md §12 (OKLCH) — a test parses globals.css and checks the token list
- [ ] #2 Top bar + pill nav on every route (aria-current on the active pill); the ≤760px menu reaches Morning brief, Today, Trucks, Trips, Why Urja, Ask
- [ ] #3 Chart components produce the same SVG geometry as final/charts.js for the mockup's sample inputs (snapshot tests)
- [ ] #4 Money: en-IN grouping, sign, lit/lit-loss; Confidence: 3 bars + word (High/Likely/Check, पक्का/शायद/जाँचें)
- [ ] #5 No horizontal scroll at 375/768/1440 on the shell; ⌘K hint hidden on coarse pointers
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
