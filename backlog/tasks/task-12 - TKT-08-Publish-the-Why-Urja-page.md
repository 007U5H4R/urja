---
id: TASK-12
title: 'TKT-08: Publish the Why Urja page'
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-02'
labels:
  - P1
  - why
  - ready-for-agent
  - 'sp:4'
milestone: m-3
dependencies:
  - TASK-7
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: feature
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** The forwarded link's story in three minutes: problem, owner, gap, Bytebeam fit, metric + guardrail, 90 days, what's real (Design.md §25).

**Scope.** Port final/why.html: hero with the poster and both CTAs, chapters 01–07, field quotes from content/field-notes.ts with the honest placeholder state, competitor table, exists/new pipeline, two metric tiles, first 90 days, about this prototype, byline.

**Related TC.** TC-022, TC-031 · **Related EVAL.** —
**Dependencies.** TKT-03 · **Estimate.** sp:4 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-08 · Plan: technical-plan.md § TKT-08
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Content matches final/why.html; one h1; landmarks; a real table
- [ ] #2 Field quotes render from content/field-notes.ts; when empty the placeholder card and ASSUMPTION note show (no invented quotes)
- [ ] #3 The poster lazy-loads below the fold; no horizontal scroll at 375/768/1440; axe clean
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
