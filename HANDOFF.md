# HANDOFF — Urja (Bytebeam PM interview prototype)

**Stage just completed:** 5 + 6 · Problem Breakdown + Technical Planning (compressed Full tier, S9).
- Produced 2026-09-28. **Approved 2026-09-29** ("use chrome and do it").
- Ticket **TASK-4** is Done.

**Next stage:** 7 · Execution.
- Runs in a **claude.ai/code cloud session** on `007U5H4R/urja`, branch `build/stage7` (TP10).
- Stage-table default is **Opus 5.5 / Standard**. Confirm it at the gate.

**Repo:** https://github.com/007U5H4R/urja (private), branch `main`. Local path: `/Volumes/E Drive/Dev/Code/Claude/ByteBeam Dashboard`.

**Dates:** interview 2026-10-07. Build window 2026-09-30 → 10-03. QA and deploy 10-04.

## Approved and unchanged
- `Solution-PRD.md`
- `Design.md` (the Design Freeze block, §26)
- `decisions.md` S1–S10 and D1–D6
- `.design/exploration/final/` (the visual truth)
- TASK-1 to TASK-3 (untouched)

## What Stage 5 + 6 produced (read in this order)
1. `milestones.md`: M-001 to M-005, each with objectives, entry and exit criteria, DoD and risks.
2. `tickets.md`: TKT-01..16 → **TASK-5..TASK-20**, with the dependency DAG, AC, DoD, sp, TC-/EVAL- links and granularity notes.
3. `technical-plan.md`:
   - §1 global constraints;
   - §4 the data spec: every anchor, rules R1–R5, balancing, and the 4 resolved inconsistencies;
   - §6 Ask Urja;
   - §7 the 3D decisions;
   - §16 the **cloud runbook**, including the pre-flight and the prompt that starts Stage 7;
   - §17 the atomic tasks for each ticket.
4. `test-cases.md`: TC-001 to TC-061, plus a coverage map to acceptance criteria #1–#6.
5. `evals/evaluation-plan.md` and `evals/eval-dataset.json`: the Ask Urja eval (10 prepared questions + 3 off-topic ones), the spec for a deterministic number-accuracy scorer, and the release gates.
6. `decisions.md` **TP1–TP10**: marked `proposed` until the sign-off, then `accepted`.

**Campfire (project `urja`):**
- Milestones m-0..m-4 are M-001..M-005.
- Tickets TASK-5..TASK-20 carry dependencies, P-labels, `sp:`, a topic label and `ready-for-agent`, plus AC and DoD. The build tickets are assigned to @claude-cloud; TKT-15 and TKT-16 to @claude.
- `sp` means **agent-hours**, because Campfire's Gantt axis is elapsed hours. The build totals 82 h, and the critical path is 38 h.
- Calendar targets live in the milestone and ticket due dates (09-30 → 10-04).
- TASK-4 is `sp:2`.
- `backlog doctor` reports no duplicates and no cycles.
- The Campfire server was **restarted on 2026-09-28 at 21:44**. It had loaded `projects.json` before Urja was registered, so Urja was missing from the project dropdown.

## Fixed numbers (simulated fleet; must stay consistent everywhere)
- **Yesterday (Sun 27 Sep):** earned ₹1,86,400; freight ₹4,12,000 − diesel ₹1,58,300 − tolls ₹38,900 − other ₹28,400. Unaccounted ₹11,430 = ₹3,420 + ₹4,500 + ₹3,510 (127 L at ₹90/L).
- **Flag 1 · Trip 0926-04:** RJ14 GB 4521, Ramesh Kumar. Stationary drop, 38 L, 2:14–2:40 AM, near Behror. Freight ₹28,000, profit ₹13,240, route normal ₹16,660.
- **Flag 2 · Trip 0927-02:** RJ14 GA 1182, Vikram Choudhary. Bill 250 L vs tank +200 L at Kishangarh pump, 4:50 PM (Likely).
- **Flag 3 · Trip 0926-11:** RJ14 GC 3309, Anil Bairwa. Jaipur → Bhiwandi, 1,150 km. Used 364 L vs a normal of 325 L (12% more); load 26 t vs 22 t (Check).
- **September 1–27:** 212 trips.
  - Diesel unaccounted 412 L (₹37,080) in 9 incidents: days 5, 9, 12, 17, 21, 23 and 27. 5 of the 9 were on the Behror stretch.
  - Flagged ₹58,240; recovered ₹21,600; 23 flags (18 confirmed, 3 waiting, 2 wrong = 9%).
- **Anil, all of September:** 125 L = ₹11,250 (Trips 0926-11, 0917-06, 0909-03).
- **Ask fallback (21–27 Sep):** 217 L (₹19,530) on 5 trips.

Everything these numbers imply is specified in `technical-plan.md` §4.3: 24 trucks, 9 diesel incidents, 14 other flags, weekly recovery, route history, the 14-day series and the clean days.

## Planning findings (covered in the gate summary)
Four contradictions were resolved **without changing any fixed number** (§4.9, TP2, TP3):
1. 0917-06 becomes a same-day trip.
2. The speed trace is derived from distance.
3. R3 reads as "≥ 12% more litres".
4. Litres are stored in centilitres, because ₹1,58,300 isn't a multiple of ₹90.

Two small content changes follow from acceptance #2:
- The empty-state counts become computed values (11 / 13).
- The WhatsApp preview shows the real host instead of "urja.app".

## Sign-off decisions (2026-09-29)
The user answered "use chrome and do it". I read that as approval of the plan with every recommended option; the user can still correct any of these:
1. **Granularity:** 16 tickets, tracked at ticket level.
2. **TP3 accepted:** R3 fires on ≥ 12% more litres.
3. **Gemini key path A:** a claude.ai/code API credential, falling back to path B.
4. **A1:** treated as evidence for Why Urja, not as a build gate.
5. **Stage 7 model:** Opus 5.5.

TP1–TP10 are now marked `accepted`.

## Sign-off steps (2026-09-29)
- **Done:**
  - The project `CLAUDE.md` was written (the §16.2 rules).
  - TP1–TP10 were marked `accepted` and the plan docs marked approved.
  - The Stage 5–6 artifacts were committed on `main` with TASK-4 and pushed.
- **In progress, via Chrome:** the §16.1 pre-flight:
  - GitHub access;
  - the "urja" environment (network allowlist, setup script);
  - the Vercel project and its non-secret env;
  - starting the cloud session with the §16.4 prompt.
- **The user's own step:** enter the Gemini key as the environment's API credential and in Vercel. Claude may not type keys into web forms.

## How Stage 7 runs and reports back
- The cloud session follows `technical-plan.md` §16.2: one implementer subagent per task, TDD, two reviews, and at most 2 fix rounds.
- Gates:
  - end of M-001 (09-30);
  - end of M-002, M-003 and M-004 (10-02 → 10-03);
  - Stages 8–11 (10-04).
- The cloud session writes `docs/exec/ledger.md`. It never edits `backlog/` and never prints secrets.
- At each gate, the local session pulls `build/stage7`, syncs Campfire through the CLI, and updates Obsidian and memory (§16.3).
- **Secrets (S10):** the key lives in the local `.env` (gitignored), in Vercel's encrypted env and, optionally, as a cloud API credential. Never in the repo, prompts, logs or chat.

## Open items (user)
- Optional, recommended: a quota or budget cap on the Gemini key; rotate the key after 2026-10-07.
- Field conversations by 2026-10-01 ("Tell me about the last trip where you lost money"). Their quotes go into `content/field-notes.ts`.
- Confirm the byline "Tushar Pathak" on Why Urja.
- Arrange a native Hindi review; TKT-06 generates `docs/exec/hindi-review.md` for it.
- Disk: the E Drive has 9.6 GB free and the internal disk 2.8 GB. Nothing is built locally; all builds run in the cloud, GitHub Actions or Vercel.

## Tooling notes
- **Campfire:**
  - CLI: `"/Volumes/E Drive/Dev/Code/Claude/PM Tools/backlog-md-fork/dist/backlog"`.
  - Board: http://127.0.0.1:6480.
  - If a newly registered project is missing from the dropdown, restart the server: kill it, then run `campfire`.
- **Planning scripts:** `/Volumes/E Drive/Dev/.scratch/urja-plan/`. `campfire-sync.mjs` created m-1..m-4 and TASK-5..20; the mapping is in `campfire-map.json`.
- **Mockup screenshots:** `/Volumes/E Drive/Dev/.scratch/urja-shots/`. Use `GPU=1`, because SwiftShader hangs the bloom scene.
