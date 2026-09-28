# HANDOFF — Urja (Bytebeam PM interview prototype)

**Stage just completed:** 4 · UI/UX Design. Approved 2026-09-28 ("Approved go ahead"). Ticket TASK-2.
**Next stage:** 5 + 6 combined (Problem Breakdown + Technical Planning), per compressed Full tier S9. Model **Fable 5.1 / Medium**.
**Repo:** https://github.com/007U5H4R/urja (private), branch `main`. Local path: `/Volumes/E Drive/Dev/Code/Claude/ByteBeam Dashboard`.
**Interview:** 2026-10-07. Build window 2026-09-30 → 10-03; QA + deploy 10-04.

## What is approved (read these first)
1. `Solution-PRD.md`: problem, scope, rules R1–R5, AI design, acceptance criteria #1–#6.
2. `Design.md`: direction B "Lamplight" (TerraFlux-inspired) with the **Design Freeze** block at the top, and **§26 Spatial 3D** (the Today hero truck scene).
3. `decisions.md`: S1–S9 (solution) and D1–D6 (design). D3 records that the user explicitly overrode the 3D necessity gate.
4. `.design/exploration/final/`: **the visual truth.**
   - `index.html` (Today, with `?map`, `?fleet`, `?ask`)
   - `trip.html`, `brief.html` (`?lang=en`), `message.html`, `states.html`, `why.html`, `scene.html`
   - shared: `lamp.css` (tokens + components), `charts.js`, `map.js`, `truck3d.js`, `icons.js`, `assets/truck-scene.png`
   - OG mockup: `.design/exploration/og/`
   - Direction A (superseded) is kept in `option-a/`.
5. The gallery: `.design/exploration/index.html`.

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

## What Stage 5 + 6 must produce
- `milestones.md` + `tickets.md` as vertical slices, each with `TC-`/`EVAL-` links, created in **Campfire**. The CLI is `"/Volumes/E Drive/Dev/Code/Claude/PM Tools/backlog-md-fork/dist/backlog"`. Never hand-pick IDs; use types and P-labels.
- `technical-plan.md`: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, MapLibre, three.js. The simulated data generator must reproduce the numbers above exactly. It also covers:
  - the rules engine R1–R5;
  - the brief template;
  - the Gemini `gemini-3.5-flash` Ask route with a rate limit, daily cap, timeout and deterministic fallback;
  - OG/Twitter tags with a 1200×630 image;
  - Vercel.
- `test-cases.md` + a small **Ask Urja eval**: 10 prepared questions plus 3 off-topic ones (Solution-PRD acceptance #3), and a scorer for number accuracy.
- Port the 3D scene to the app: a dynamically imported client component; poster fallback; software-GPU guard; dispose on route change.

## How Stage 7 should run (user preference: cloud)
- The user wants the remaining work in the cloud.
  - The Agent tool's `isolation: remote` **fell back to a local git worktree**.
  - For a real cloud run, use **a claude.ai/code session on this repo**, started with RemoteTrigger or by the user.
- **Gates stay with the user:** every stage ends with a sign-off.
- Campfire and Obsidian are local-only; sync them from the local session when the cloud reports back.
- **Secrets (S10):** the user chose to **keep the existing Gemini key** (accepted risk). It stays in the local `.env` only (gitignored). At deploy it goes into Vercel's encrypted env; for a cloud build session, the user adds it to that environment, or the build uses the deterministic Ask fallback and a mocked client. Never in the repo, prompts, logs or chat.

## Open items (user)
- Optional, recommended: a quota or budget cap on the Gemini key; rotate it after 2026-10-07.
- Field conversations by 2026-10-01 ("Tell me about the last trip where you lost money").
- Confirm the byline "Tushar Pathak" on Why Urja; arrange a native Hindi review of the copy.
- The E Drive is 95% full (about 6.4 GB free). Keep build output lean, or build in the cloud.

## Tooling notes
- Mockup screenshots: `/Volumes/E Drive/Dev/.scratch/urja-shots/`.
  - `shoot.mjs` and `scene-shot.mjs`; use `GPU=1`, because the three.js bloom scene hangs SwiftShader.
  - Scripts self-timeout (`MAXMS`), so Chrome is never orphaned.
- Contrast: `contrast-b.mjs`, 23 of 23 pass. Detector: `npx impeccable detect .design/exploration/final` gives 48 findings, all justified in Design.md §24.
