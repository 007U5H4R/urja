---
id: TASK-6
title: 'TKT-02: Simulate Sharma Roadlines and compute Today''s verdict with rules R1–R5'
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-09-30'
labels:
  - P0
  - data
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
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** Kill the riskiest assumption: one simulated fleet, real rules, every fixed number exact and consistent across screens (acceptance #2).

**Scope.** Types + constants; places, routes, fleet; one-off scenario generator with balancing → committed lib/data/scenario/scenario.json; seeded telemetry simulator; rules R1–R5 + confidence; ledgers; aggregates (yesterday, September, per-truck, weekly, route normal, last 7 days, clean days, now-positions); golden tests; Today page head (greeting, verdict, tags) + ledger bar from view models.

**Related TC.** TC-001–TC-014, TC-021 (data part) · **Related EVAL.** Feeds EVAL-001–013 expected values
**Dependencies.** TKT-01 · **Estimate.** sp:6 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-02 · Plan: technical-plan.md § TKT-02
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Golden tests TC-001–TC-010 pass: every number in HANDOFF.md "Fixed numbers" and technical-plan.md §4 anchor tables
- [ ] #2 Rules detect exactly the scenario's 23 injected anomalies — no misses, no extras (property test) — and rule boundary tests pass (TC-011)
- [ ] #3 Deterministic: two runs give identical output hashes; no Date.now()/Math.random()/argless new Date() under lib/data (TC-012)
- [ ] #4 Plausibility checks pass: speed × time ≈ km (±2%), fuel never negative, balancer values in range (TC-013)
- [ ] #5 / renders "Your trucks earned ₹1,86,400 yesterday. ₹11,430 of it doesn't add up, across 3 trips." and the ledger bar from the engine; no ₹ literals in components (grep test)
- [ ] #6 Wording guard: no theft/stolen/चोरी in data-layer strings (TC-014)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
