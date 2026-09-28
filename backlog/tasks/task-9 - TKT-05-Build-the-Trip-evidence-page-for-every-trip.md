---
id: TASK-9
title: 'TKT-05: Build the Trip evidence page for every trip'
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-01'
labels:
  - P0
  - trip
  - ready-for-agent
  - 'sp:8'
milestone: m-1
dependencies:
  - TASK-6
  - TASK-7
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: feature
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** The demo's peak: "2:14 AM, parked, 38 litres" — fuel falls while speed is zero, and every line of evidence has a source.

**Scope.** /trips/[tripId] static for all trips (+ /trips redirect, 404); TripHead; FlagCard with rule, confidence, evidence + sources, why-confidence, driver's side and honest prototype actions; FuelSpeedChart (desktop + phone) with rule variants; Timeline; TripLedger + route-normal chart; loading + error states.

**Related TC.** TC-003 (UI), TC-021, TC-022, TC-024 (trip), TC-031 · **Related EVAL.** —
**Dependencies.** TKT-02, TKT-03 · **Estimate.** sp:8 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-05 · Plan: technical-plan.md § TKT-05
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /trips/0926-04 matches final/trip.html; every number and string in head, flag card, evidence, timeline, ledger and chart notes is computed (TC-003)
- [ ] #2 Pages exist for all trips; /trips/unknown shows the 404 page; /trips redirects to the top flagged trip
- [ ] #3 R2 (0927-02) and R3 (0926-11) render their own evidence, chart variant and ledger from data
- [ ] #4 Driver actions change local state with an honest note ("Prototype: nothing was sent"); nothing is sent
- [ ] #5 Loading skeleton and "Couldn't load this trip" + retry render; layout per Design.md §16 at 375/768/1440
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
