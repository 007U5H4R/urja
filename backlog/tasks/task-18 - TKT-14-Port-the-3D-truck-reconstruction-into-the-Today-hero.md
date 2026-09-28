---
id: TASK-18
title: 'TKT-14: Port the 3D truck reconstruction into the Today hero'
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-03'
labels:
  - P1
  - 3d
  - ready-for-agent
  - 'sp:6'
milestone: m-3
dependencies:
  - TASK-14
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** The user-mandated delighter (D3), bounded by guards so it can never break the demo (Design.md §26, Design Freeze 3D items).

**Scope.** Port final/truck3d.js to components/scene (three@0.169.0, procedural, bloom, ACES, RoomEnvironment, fog, pixel-ratio caps); next/dynamic after first paint; poster first; guard for import/WebGL/software renderer; context-loss → poster; render while visible; reduced motion static; coarse pointer no drag; orbit limits; rotate/reset buttons; dispose on unmount; label + aria.

**Related TC.** TC-029, TC-030, TC-055 · **Related EVAL.** —
**Dependencies.** TKT-10 · **Estimate.** sp:6 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-14 · Plan: technical-plan.md § TKT-14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Headless Chromium (software GL): the poster stays and nothing errors (TC-029)
- [ ] #2 Real GPU (manual, Mac): composition matches final/scene.html; drag limits hold; rotate/reset buttons work by keyboard; reduced motion is static (TC-030)
- [ ] #3 Ten Today ↔ Trip navigations leave at most one live WebGL context (TC-030)
- [ ] #4 three.js is absent from the initial bundle and loads only on Today after first paint (TC-055)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
