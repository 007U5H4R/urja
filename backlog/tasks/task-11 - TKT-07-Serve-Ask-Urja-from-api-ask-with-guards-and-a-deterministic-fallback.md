---
id: TASK-11
title: 'TKT-07: Serve Ask Urja from /api/ask with guards and a deterministic fallback'
status: To Do
assignee:
  - '@claude-cloud'
created_date: '2026-09-28 16:25'
updated_date: '2026-09-28 17:07'
due_date: '2026-10-01'
labels:
  - P0
  - ask
  - ready-for-agent
  - 'sp:8'
milestone: m-2
dependencies:
  - TASK-6
documentation:
  - tickets.md
  - technical-plan.md
priority: high
type: feature
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Objective.** A live model answering only from fleet data, with every failure path landing on an honest, data-computed answer (S6, S10).

**Scope.** probe-gemini script; compact context builder; system prompt with canary; Gemini REST client (x-goog-api-key header, JSON schema, 8 s timeout); zod validation; citation guard + number check; per-IP limit + daily cap; intent-matched deterministic fallback (hi/en); structured logs; provenance.

**Related TC.** TC-040–TC-046 · **Related EVAL.** EVAL-001–EVAL-013 (enables)
**Dependencies.** TKT-02 · **Estimate.** sp:8 (agent-hours) · **Owner.** @claude-cloud
Source: tickets.md § TKT-07 · Plan: technical-plan.md § TKT-07
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mocked model: the happy path returns {answer, lang, cites[], provenance{model, ms, scope}} with only existing trip ids (TC-040, TC-044)
- [ ] #2 Timeout, 429, 5xx, invalid JSON, schema-invalid and missing key all return mode "fallback" (recognised question) or "saved" (other) (TC-041, TC-042)
- [ ] #3 Rate limit and daily cap return without calling the model (TC-043)
- [ ] #4 Fallback intents answer all 10 prepared questions with numbers matching the golden values (TC-046)
- [ ] #5 The key is read only server-side, never logged, and absent from .next/static (build grep test, TC-045)
- [ ] #6 On the preview with the real key, "How much did we earn yesterday…" returns a grounded answer in under 4 s
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria demonstrated on the build/stage7 preview; evidence recorded in docs/exec/ledger.md
- [ ] #2 Linked TC- cases automated (or recorded as manual with evidence) and passing
- [ ] #3 pnpm verify green in CI on the ticket's last commit; commits carry the TASK id
<!-- DOD:END -->
