---
id: m-2
title: "M-003 Ask Urja, grounded and measured"
due_date: "2026-10-02"
---

## Description

Objective. Prove the AI is real and safe: live Gemini answers cite trips, answer in the question's language and never invent a rupee; the deterministic fallback answers from data when anything fails; the eval measures it.

Scope. /api/ask (context builder, Gemini client, 8 s timeout, citation guard, rate limit + daily cap, fallback, logs); ⌘K drawer + phone dock; eval harness (10 + 3 dataset, number-accuracy scorer, runner, baseline).

Tickets. TKT-07 → TKT-12 ∥ TKT-13. 16 sp (agent-hours), P0.

Exit. TC-026, TC-040–TC-046 pass; baseline eval persisted; final gate in TKT-15: EVAL-001–010 ≥ 9/10, EVAL-011–013 3/3, p50 < 4 s, 0 forbidden words, 0 unsupported ₹/L figures.

Full record: milestones.md § M-003.
