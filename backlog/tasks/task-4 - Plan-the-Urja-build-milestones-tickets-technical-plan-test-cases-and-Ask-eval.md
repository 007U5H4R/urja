---
id: TASK-4
title: >-
  Plan the Urja build: milestones, tickets, technical plan, test cases and Ask
  eval
status: Done
assignee:
  - '@claude'
created_date: '2026-09-28 15:40'
updated_date: '2026-09-28 20:03'
labels:
  - P1
  - 'sp:2'
dependencies: []
priority: high
type: docs
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Stages 5+6 (compressed Full tier, S9): no build starts without an approved plan; build window opens 2026-09-30, interview 2026-10-07
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-09-28: Stage 5+6 artifacts produced — milestones.md, tickets.md (TKT-01..16 → TASK-5..20, milestones m-0..m-4), technical-plan.md (data spec §4, Ask §6, 3D §7, cloud runbook §16, tasks §17), test-cases.md (TC-001..TC-061), evals/evaluation-plan.md + evals/eval-dataset.json (EVAL-001..013), decisions TP1–TP10 (proposed). Campfire server restarted 21:44 (stale projects.json). Waiting for user sign-off; then commit + push, project CLAUDE.md, TP → accepted, TASK-4 → Done.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stages 5+6 approved 2026-09-29 ("use chrome and do it", taken as approval with the recommended options: 16 tickets at ticket level, TP3, Gemini key path A, A1 as pitch evidence, Stage 7 on Opus 5.5). Artifacts: milestones.md (M-001..M-005 → m-0..m-4), tickets.md (TKT-01..16 → TASK-5..20), technical-plan.md, test-cases.md (TC-001..061), evals/evaluation-plan.md + evals/eval-dataset.json (EVAL-001..013), decisions TP1–TP10 accepted, project CLAUDE.md for the cloud session. Four fixed-number contradictions resolved without changing any number (technical-plan §4.9). Estimates are agent-hours (82 h; critical path 38 h). Next: pre-flight (§16.1) and Stage 7 in claude.ai/code on build/stage7.
<!-- SECTION:FINAL_SUMMARY:END -->
