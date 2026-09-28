# Urja: project instructions

Urja is a prototype for a Product Manager interview on 2026-10-07.
- Pitch line: "An AI munshi for Indian fleet owners · a concept for Bytebeam".
- The fleet is simulated: Sharma Roadlines, Jaipur, 24 trucks.
- Every rupee on screen is computed by the rules R1–R5.
- Ask Urja is a live Gemini answer drawn from that data.

## Read first, in this order
1. `HANDOFF.md`: the current stage, the fixed numbers, open items.
2. `technical-plan.md`: §1 global constraints, §4 data spec, §16 cloud runbook, §17 per-ticket tasks.
3. `tickets.md`: TKT-01..16, which are Campfire TASK-5..20, with AC and DoD.
4. `test-cases.md` (TC-) and `evals/evaluation-plan.md` (EVAL-).
5. `Design.md`: the Design Freeze block, §12–§18 and §26.
6. `.design/exploration/final/`: the visual truth. Port it; don't reinvent it.

## Stage 7 protocol (claude.ai/code cloud session)
**Branch:** work on `build/stage7`. Never push to `main`. `main` changes only at Stage 11, after the QA gate.

**Per task:**
- Dispatch one fresh implementer subagent. Its brief is the task text, the files, the interfaces and the constraints in §1.
- Use TDD: failing test → minimal code → green → refactor.
- Then run a spec-compliance review and a code-quality review, each by a fresh reviewer subagent.
- The fix loop gets at most 2 rounds. If a third attempt fails, stop and mark the task `BLOCKED` in the ledger.
- Commit once per task: `<imperative summary> (TASK-n)`.

**Parallelism:**
- At most 3 implementers at once, each in its own worktree, with disjoint file ownership (§3.3, §15).
- Shared files are edited by one task at a time.

**Milestone gate:**
1. Run `pnpm verify`, `pnpm test:e2e` and, for M-003, `pnpm eval`.
2. An independent QA subagent re-checks the exit criteria.
3. Update `docs/exec/ledger.md` and push.
4. Post a gate report: the preview or commit, the TCs passed, open issues, and screenshots compared against the mockup.
5. **Stop and wait for the user's explicit approval.**

**Ledger:** `docs/exec/ledger.md`, one row per task:
`| TASK | TSK | status | commit | tests | evidence | notes |`

**Decisions and scope:** append decisions to `decisions.md` as `EXE1…`. Record scope changes in the ledger with a reason, then wait for the user.

## Hard rules
- **Fixed numbers:** the ones in `HANDOFF.md`, and the anchors in `technical-plan.md` §4.3, never change.
- **IDs:** TASK-5..20, M-001..M-005, TC-### and EVAL-### never change.
- **Components:** render view-model fields only. No ₹ literals in components.
- **Secrets:**
  - Read `GEMINI_API_KEY` only on the server, from `process.env`, and never prefix it with `NEXT_PUBLIC_`.
  - Never print, echo, log or commit it. Never run `env` or `printenv`.
- **`backlog/`:** this is Campfire's folder, and Campfire runs locally only. Never edit it from here; status goes in the ledger.
- **Design Freeze:** ask before changing the IA, the hero, the visual direction, the CTA hierarchy, the motion concept or the 3D concept. Pixel, browser, accessibility and performance fixes don't need approval.
- **Wording:** say "unaccounted" or "doesn't add up". Never use "theft", "stolen", "thief" or "चोरी". Low confidence says "Check".
- **Dates and time:**
  - No `Date.now()`, `Math.random()` or argument-less `new Date()` under `lib/data`.
  - Display times in IST.
  - The demo clock is Mon 28 Sep 2026, 7:12 AM.
- **Branding:** no Bytebeam logo or branding. The Why Urja page says what is simulated.
- **Versions:** pin `three@0.169.0` and `maplibre-gl@4.7.1`. Use Node 22 and pnpm.
- **Thresholds:** never weaken a threshold or a golden value to make a gate pass.

## Local sessions (the user's Mac)
- Nothing is installed or built on the Mac, because its disk is nearly full. Builds run in the cloud, in GitHub Actions or on Vercel.
- At each gate, the local session syncs Campfire (through its CLI) and the Obsidian notes from `docs/exec/ledger.md`.
