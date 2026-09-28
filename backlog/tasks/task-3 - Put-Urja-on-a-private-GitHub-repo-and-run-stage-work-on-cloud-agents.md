---
id: TASK-3
title: Put Urja on a private GitHub repo and run stage work on cloud agents
status: In Progress
assignee: []
created_date: '2026-09-28 12:05'
updated_date: '2026-09-28 15:19'
labels:
  - P2
dependencies: []
priority: medium
type: chore
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User asked to run the remaining tasks and workflow in cloud sessions; cloud agents clone from GitHub, while gates, Campfire and Obsidian stay in this local session.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-09-28: private repo 007U5H4R/urja created and pushed (main at 54aedcd). The Agent tool's remote isolation ran the Stage 4 pages in a local worktree (.claude/worktrees/, gitignored), not the cloud. Remaining: run Stage 7 in a real claude.ai/code session (RemoteTrigger) after the Stage 5/6 plan is approved. Gemini key: user keeps the existing key (S10); add it to the cloud env/Vercel at build/deploy, never in the repo.
<!-- SECTION:NOTES:END -->
