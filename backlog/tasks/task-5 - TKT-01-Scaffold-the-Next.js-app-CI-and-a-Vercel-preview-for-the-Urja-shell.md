---
id: TASK-5
title: 'TKT-01: Scaffold the Next.js app, CI and a Vercel preview for the Urja shell'
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-09-30'
labels:
  - P0
  - tracer
  - ready-for-agent
  - 'sp:2'
milestone: m-0
dependencies:
  - TASK-4
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: chore
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** A reproducible toolchain and a live preview on day 1, so every later ticket regresses against CI and a real URL.

**Scope.** create-next-app (App Router, TS strict, ESLint, Tailwind v4) with pnpm; shadcn init; Vitest; Playwright (chromium); pnpm verify; lib/format.ts (₹ en-IN, litres, IST time) with tests; GitHub Actions CI; secret-scan test; placeholder Today page; Vercel preview from build/stage7.

**Related TC.** TC-060, TC-061 · **Related EVAL.** —
**Dependencies.** TASK-4 · **Estimate.** sp:2 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-01 · Plan: technical-plan.md § TKT-01
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pnpm install && pnpm verify (typecheck + lint + unit) passes in the cloud VM and in GitHub Actions on every push
- [ ] #2 pnpm build succeeds and pnpm start serves / with a placeholder h1 "Urja"
- [ ] #3 lib/format.ts: formatINR(186400) = "₹1,86,400", formatINR(-10620) = "−₹10,620" (U+2212), formatLitres(38) = "38 L", formatTimeIST renders "2:14 AM" — unit tests pass
- [ ] #4 Secret-scan test fails on a tracked Google-key pattern (AIza + 35 chars) and passes on the clean repo; .env is untracked
- [ ] #5 The Vercel preview for build/stage7 returns 200 for /; a Playwright smoke test (/ loads, no console errors) passes in the cloud VM
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
