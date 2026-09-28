---
id: TASK-14
title: >-
  TKT-10: Wire the maps: Today hero Map and Fleet views, list ↔ map linking and
  the trip route
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-02'
labels:
  - P1
  - maps
  - ready-for-agent
  - 'sp:4'
milestone: m-1
dependencies:
  - TASK-8
  - TASK-9
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: feature
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** Where it happened, on a real map one click from the scene (D3, D4) — never a rendered fake.

**Scope.** MapLibre 4.7.1 via next/dynamic; night-warmed Carto dark-matter-nolabels; token → rgba resolver; HeroCard with Scene | Map | Fleet switch (Scene = poster until TKT-14), full screen, glass card, rail box, flag markers, lamp pool; eyes ↔ map selection; fly-to 1.4 s / curve 1.3; reduced motion jump; TripMap; tiles-failure state; attribution.

**Related TC.** TC-025, TC-028, TC-055 (bundle) · **Related EVAL.** —
**Dependencies.** TKT-04, TKT-05 · **Estimate.** sp:4 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-10 · Plan: technical-plan.md § TKT-10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Selecting eyes row n (or marker n) lights the row, updates the glass card and rail and flies the map; rows 2–3 switch Scene → Map (TC-025)
- [ ] #2 Fleet view shows 24 trucks (11 moving, 12 in a yard, 1 workshop) from now-positions, plus the 3 numbered flags
- [ ] #3 Blocked tiles show "Map unavailable; every event is in the timeline" and the page stays usable (TC-028)
- [ ] #4 Reduced motion: no ping, no fly-to (jump)
- [ ] #5 MapLibre is not in the initial JS of /
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
