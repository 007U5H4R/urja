---
id: TASK-20
title: 'TKT-16: Ship to production and verify the link previews'
status: To Do
assignee:
  - '@claude'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-04'
labels:
  - P0
  - deploy
  - ready-for-agent
  - 'sp:4'
milestone: m-4
dependencies:
  - TASK-19
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: task
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** The interviewer opens a working production link that unfurls correctly (acceptance #1, #5).

**Scope.** PR build/stage7 → main (user approval); Vercel production; NEXT_PUBLIC_SITE_URL; production smoke of the 5-step path; OG checks (HTML, og.png 200, LinkedIn Post Inspector, opengraph.xyz); monitoring notes; rollback path; lesson-learnt.md; Campfire + Obsidian synced.

**Related TC.** TC-020 (production), TC-050, TC-051 · **Related EVAL.** —
**Dependencies.** TKT-15 · **Estimate.** sp:4 (agent-hours) · **Owner.** @claude
Source: tickets.md § TKT-16 · Plan: technical-plan.md § TKT-16
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 TC-020 passes on the production URL
- [ ] #2 TC-050 and TC-051 PASS, or BLOCKED with the exact blocker
- [ ] #3 One live Ask answer on production uses the key from Vercel's encrypted env
- [ ] #4 lesson-learnt.md written; HANDOFF.md updated
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
