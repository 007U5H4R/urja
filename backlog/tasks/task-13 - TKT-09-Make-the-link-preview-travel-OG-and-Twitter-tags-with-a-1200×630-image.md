---
id: TASK-13
title: >-
  TKT-09: Make the link preview travel: OG and Twitter tags with a 1200×630
  image
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-02'
labels:
  - P1
  - seo
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
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** The link will be forwarded; its unfurl must carry "Where did the diesel go?" and the ₹3,420 fragment (acceptance #5).

**Scope.** metadataBase from env; per-route title/description; og:* and twitter:* tags; /og-card route (noindex) porting og/index.html with real data; scripts/render-og.ts (Playwright → public/og.png); tests.

**Related TC.** TC-050 (TC-051 in TKT-16) · **Related EVAL.** —
**Dependencies.** TKT-03 · **Estimate.** sp:4 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-09 · Plan: technical-plan.md § TKT-09
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SSR HTML of /, /why, /brief and /trips/0926-04 carries og:type, og:site_name, og:title, og:description, og:url, og:image (+width/height/alt) and twitter summary_large_image tags with absolute HTTPS URLs (TC-050)
- [ ] #2 public/og.png is 1200×630, under 500 KB, and matches og/index.html (parity screenshot)
- [ ] #3 og:image returns 200 on the preview
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
