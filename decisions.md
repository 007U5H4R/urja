# Decision Log — Urja

## S1 · Prove product thinking, not just UI — accepted
**Context.** The deliverable is for a PM interview whose JD says "building is cheap, finding the right problem is the job."
**Decision.** A problem-first prototype with discovery, metric and guardrail built in; UI held to a world-class bar in service of the story.
**Rejected.** A broad, polished telemetry dashboard (shows building skill, the cheap part); an even split (dilutes the story).

## S2 · Design the future commercial-fleet product, not today's OEM dashboard — accepted
**Context.** Bytebeam today serves EV OEMs; the JD names an AI-native platform for Indian commercial fleets with no public footprint.
**Decision.** Design a slice of that future product.
**Rejected.** Redesigning the existing City/Model/Dealer OEM dashboard (improves what exists, not what they're hiring for).

## S3 · Primary user is the small/mid fleet owner on mobile — accepted
**Context.** Competitors built control-room software for enterprise fleet managers.
**Decision.** Owner of 10–100 trucks, mobile/WhatsApp-first, Hindi-capable; desktop view for evidence and the live demo.
**Rejected.** Enterprise fleet manager (crowded — Fleetx, LocoNav); driver (weak tie to money outcome).

## S4 · Own trip-profit leakage as an "AI munshi" — accepted
**Context.** Fuel is 35–45% of cost; leakage is measurable from CAN + GPS + FASTag. Validation pending via field conversations by 2026-10-01.
**Decision.** Urja reconciles each trip and delivers a morning brief with evidence.
**Rejected.** Predictive maintenance (Intangles owns it); driver churn (loose tie to vehicle data); idle trucks (parked as fallback).

## S5 · Name "Urja", framed as "a concept for Bytebeam" — accepted
**Context.** User wanted a name that shows energy; using Bytebeam's brand on a public URL would impersonate them.
**Decision.** "Urja" (Hindi for energy), own branding, amber "energy" accent.
**Rejected.** Bytebeam logo/branding; Prana, Veg.

## S6 · Hybrid AI: deterministic detection + live Ask box — accepted
**Context.** An AI-first interviewer will probe whether the AI is real; a live-only design is fragile in a demo.
**Decision.** Rules compute every flag; brief is templated from them; one live Gemini `gemini-3.5-flash` "Ask Urja" route with rate limit, daily cap, timeout and fallback. User supplied a Gemini key (not Anthropic).
**Rejected.** Fully scripted AI (breaks on a real question); fully live AI (fragile, costly, hallucination risk on ₹ figures).

## S7 · Metric = ₹ recovered per truck per month; guardrail = false-accusation rate — accepted
**Context.** The JD asks for a success metric and a guardrail for "what breaks if it works too well."
**Decision.** North star ₹ recovered/truck/month; leading = brief open rate, flag action rate; guardrail = false-accusation rate < 10% and driver 90-day retention ≥ baseline. Product shows confidence and a driver's side on every flag.
**Rejected.** Dashboard engagement as the metric (vanity for this user).

## S8 · Stack and delivery — accepted
**Context.** 9 days to the interview; demo must not break; the link will be forwarded.
**Decision.** Next.js + TypeScript + Tailwind + shadcn/ui, MapLibre, simulated data (Sharma Roadlines, Jaipur, 24 trucks, 30 days), one server route for Gemini, Vercel. Pitch lives in-app on a "Why Urja" page; optional one-page PDF. Dark cinematic brand with amber accent, light mode on mobile. English + Hindi on the owner's mobile screens.
**Rejected.** Real backend/telemetry (risk, no PM signal); separate PDF deck as primary (one link travels better).

## S9 · Compressed Full-tier process — accepted
**Context.** UI work is Full tier by default, but the full 12-stage chain would consume most of the 9 days.
**Decision.** Discovery (done via grilling) → Solution PRD → Design (Design.md + mockup) → build → one critique pass → one code-review/QA pass → deploy. Human sign-off after PRD and design.
**Rejected.** Full 12 stages with a fresh session each (too slow for the deadline); no process (risks building the wrong thing).

## D1 · Visual direction "Lamplight" (TerraFlux-inspired) replaces "The Munshi's Ledger" — accepted 2026-09-28
**Context.** At the Stage 4 gate the user asked for a UI/UX like TerraFlux (FocoTik, Muzli + Behance) to get a "million dollar app" feeling. Direction A was flat and editorial.
**Decision.** Near-black warm canvas, amber lamp light under a semantic **rule of light** (only what needs attention glows), focus-and-context bar charts (lit/dim/hatched/brick/mirrored), pill navigation, glass cards only over imagery, tick rails, Inter + Anek Devanagari. Urja's verdict-first IA, plates, lakh grouping and driver-neutral wording are kept.
**Rejected.** Copying TerraFlux's structure wholesale (a generic KPI home with no verdict); keeping A unchanged.

## D2 · Dark theme on the phone too — accepted 2026-09-28
**Context.** Q13 had a light phone ("morning paper"); the reference and the user's direction are dark everywhere.
**Decision.** One dark theme on every surface. A "day" theme is the first fallback if field conversations show owners reading outdoors in sunlight.
**Rejected.** Light phone with dark desktop (breaks cohesion with the new direction).

## D3 · Today hero = 3D truck scene with Scene | Map | Fleet — accepted 2026-09-28 (user override)
**Context.** User: "I want 3d object like trucks … This will be a delighter", then "supersede all the rules and include the 3D truck" and "It will bypass all rules". The 3D necessity gate was explicitly overridden.
**Decision.** Procedural three.js scene reconstructing flag 1 (RJ14 GB 4521 parked off NH48, fuel tank lit red), labelled "Reconstruction from GPS + fuel sensor". Real map and fleet map one click away; poster fallback; software-GPU guard; reduced motion = static.
**Rejected.** Downloaded truck models (licensing, weight); a fake "live map" render (dishonest); 3D on every screen (cost, distraction).

## D4 · List ↔ map linking on Today — accepted 2026-09-28
**Context.** The hero and "Needs your eyes" showed the same three flags without connecting them.
**Decision.** Selecting a row or a numbered marker lights the row, updates the glass card and the tick rail, and flies the map to the trip.
**Rejected.** A separate fleet-map section (duplicated the hero).

## D5 · Guardrail shown to the owner: "When Urja was wrong" — accepted 2026-09-28
**Context.** The false-accusation guardrail (S7) was only in the pitch.
**Decision.** A first-class card on Today: 2 of 23 flags (9%), limit 10%, cleared by the driver's side.
**Rejected.** Keeping the guardrail PM-only (hides the trust story from the user it protects).

## D6 · Fuel evidence as mirrored bars: fuel above, speed below — accepted 2026-09-28
**Context.** TerraFlux uses decorative mirrored bars; the stationary-drop rule needs "fuel fell while not moving".
**Decision.** Fuel-in-tank bars above the axis, speed bars below; the drop window and refuel lit; a dashed "without the drop" line.
**Rejected.** A separate moving/stopped strip (A), which needed a legend to read.

## S10 · Keep the existing Gemini key (user-accepted risk) — accepted 2026-09-28
**Context.** The Gemini key was pasted in chat, so it is exposed; the default is to rotate. The user decided: "no worries use that old API key, I am fine with that".
**Decision.** Keep the key. It lives only in the local `.env` (gitignored; verified absent from tracked files) and, at deploy, in Vercel's encrypted env. It is never written to the repo, prompts, logs or chat. Mitigations: the app's own rate limit + daily cap (S6); recommended quota/budget cap on the key in Google AI Studio; rotate after the interview.
**Rejected.** Rotating now (user declined).

## TP1 · Break the build into 16 vertical-slice tickets across 5 milestones; the board tracks tickets, not steps — accepted 2026-09-29
**Context.** Stages 5 and 6 are combined (S9). There are 4 build days, and the cloud executor can't write to Campfire.
**Decision.**
- Five milestones: M-001 data truth and foundation, M-002 demo path, M-003 Ask, M-004 3D and the public surface, M-005 release.
- Tickets TKT-01..16 map to TASK-5..20. Each has a type, a P-label, `sp:`, dependencies, acceptance criteria and a definition of done.
- The ~60 atomic tasks live in `technical-plan.md` §17, not as Campfire subtasks.
- TKT-15 and TKT-16 wrap Stages 8–11, so the Gantt shows the real finish date.
**Rejected.**
- Campfire subtasks for every step: sync overhead while the cloud can't write to the board.
- Layer tickets (all data, then all UI): nothing demoable until late.

## TP2 · Build the data from a committed scenario, a seeded simulator and one balancing pass; store litres as centilitres — accepted 2026-09-29
**Context.** Acceptance #2 requires every ₹ to be computed and to agree across screens. The fixed numbers were authored for the mockup, and planning found hidden contradictions in them.
**Decision.**
- A one-off `scripts/generate-scenario.ts` writes a committed `scenario.json`: trips, commercial inputs, injected anomalies, resolutions and current positions.
- A seeded simulator expands it into per-minute telemetry. The rules detect flags from that telemetry and never read the injections.
- Balancing trips make the fixed day and truck totals exact.
- Litres are stored as integer centilitres, and ₹ = round(cL × 90 / 100).
- The fixes for the contradictions are recorded in `technical-plan.md` §4.9:
  - 0917-06 becomes a same-day trip.
  - Speed is derived from distance, so the speed bars for 0926-04 are shorter.
  - Yesterday's balancer trip carries fractional litres.
  - The empty-state specimen and the WhatsApp preview host use computed or real values.
**Rejected.**
- Hard-coding numbers in the UI: breaks acceptance #2 and the claim on the Why Urja page.
- A summary-only simulation without telemetry: the rules wouldn't really run.
- Changing any fixed number: the user wants them kept unchanged.

## TP3 · R3 fires on ≥ 12% more litres than the truck's usual for the route; a heavier load lowers confidence — accepted 2026-09-29
**Context.** The Solution-PRD writes R3 as "km/L > 12% worse than the baseline for that route and load". Flag 3 (364 vs 325 L) is exactly 12.0% more litres, which is only 10.7% worse km/L, so the rule as written would not fire. Yet the approved copy says "Used 39 L (12%) more diesel", and it cites load as the reason for Check.
**Decision.**
- R3 fires when litres used ≥ 1.12 × this truck's baseline for the route (inclusive).
- The baseline doesn't adjust for load. A load above the truck's usual caps confidence at Check.
**Rejected.**
- Keeping the km/L wording: flag 3, a fixed number, would disappear.
- Moving the baseline to 324 L: that changes a fixed number.

## TP4 · Port `lamp.css` verbatim inside Tailwind v4; shadcn/ui only for the Ask sheet — accepted 2026-09-29
**Context.** S8 chose Tailwind and shadcn/ui. The approved visual truth is 43 KB of hand-tuned `lamp.css` plus the markup in `final/*.html`.
**Decision.**
- Tokens go into `@theme`, and component CSS is copied with its class names.
- Components emit the mockup's markup. Tailwind utilities are used only as glue for new layout.
- shadcn/ui supplies the Radix Dialog behind the Ask sheet: focus trap, inert page, Esc and focus return.
**Rejected.** Rewriting every component in Tailwind utilities or restyled shadcn: high risk of visual drift, and slower.

## TP5 · Call Gemini over REST with a JSON schema; verify the model ID before building on it — accepted 2026-09-29 (probe result pending, TSK-07.1)
**Context.** S6 names `gemini-3.5-flash`, but the exact model ID, thinking options and latency can't be verified during planning.
**Decision.**
- Call `generativelanguage.googleapis.com` with `fetch`, passing the key in the `x-goog-api-key` header.
- Request `responseMimeType: application/json` with a `responseSchema`, temperature 0.2, and an 8 s AbortController.
- Run `scripts/probe-gemini.ts` first. If the ID or config differs, use the closest available Flash model and record the change as an EXE decision.
**Rejected.**
- An SDK dependency for a single call: less control over the timeout and headers.
- Free-text output: citations and refusals couldn't be validated.

## TP6 · Rate-limit in memory per instance, with a Google-side quota as the real backstop — accepted 2026-09-29
**Context.** S6 requires a per-IP rate limit and a daily cap, and S10 keeps using an exposed key. This is a one-week demo.
**Decision.**
- A per-IP token bucket (5 per minute, 40 per day) and a global cap of 300 per day, held in memory on each Vercel instance.
- The user sets a quota or budget cap on the key in Google AI Studio, as S10 recommends.
- Counts of rate-limited and capped requests go to the logs.
**Rejected.** Upstash/Redis: an account, env vars and a new failure mode for a demo. Revisit if the link spreads widely.

## TP7 · 3D: vanilla three.js r169 in a client component, WebGL, poster first, dispose on unmount — accepted 2026-09-29
**Context.** Design.md §26 leaves the choice between R3F and vanilla three.js to Stage 6. The approved scene is a 17 KB imperative module, tuned on r169 with UnrealBloom.
**Decision.**
- Port `truck3d.js` almost line for line into a `next/dynamic` client component (`ssr: false`), using WebGLRenderer and procedural geometry only. Pin three@0.169.0.
- Show the poster first. A guard falls back to it when the import or WebGL fails, when the renderer is software, and on context loss.
- Render only while the scene is visible. Under reduced motion, render once and stay static.
- `dispose()` releases everything and forces context loss.
- Rotate and reset buttons give keyboard access.
**Rejected.**
- React Three Fiber: a rewrite plus a different postprocessing stack, which means visual drift and extra weight.
- WebGPURenderer: nothing here needs it.
- A GLTF pipeline: the geometry is procedural.

## TP8 · Maps: MapLibre 4.7.1 in an imperative client component; selection lives in React state — accepted 2026-09-29
**Context.** D4 links the list and the map. Carto tiles may be blocked in the cloud sandbox, or unreachable if the interview room is offline.
**Decision.**
- Port the mockup's `map.js` into a dynamically imported client component.
- HeroCard owns the selected flag and the current view; the map only subscribes.
- If tiles fail, the rows, glass card and rail keep working, and the map shows "Map unavailable; every event is in the timeline".
**Rejected.**
- react-map-gl: an extra abstraction over code that already works.
- Keeping the selection inside the map: selection would break whenever the map fails to load.

## TP9 · Render the OG image as a static PNG from an `/og-card` route with Playwright — accepted 2026-09-29
**Context.** The approved OG mockup uses a glass card (backdrop-filter), a masked poster, OKLCH colours and glow. `next/og`/Satori supports none of backdrop-filter, mask-image or OKLCH.
**Decision.**
- `/og-card` (noindex) ports `og/index.html` using real trip data.
- `scripts/render-og.ts` screenshots it at 1200×630 to `public/og.png`, under 500 KB.
- The metadata points to the image with absolute URLs.
**Rejected.**
- `next/og`: drifts visually from the approved OG mockup.
- A hand-exported image: it could drift from the data.

## TP10 · Run Stage 7 in a claude.ai/code cloud session with an embedded runbook — accepted 2026-09-29
**Context.** The user wants execution in the cloud. The Agent tool's remote isolation fell back to a local worktree. Cloud VMs don't have the user's personal skills, Campfire or Obsidian.
**Decision.**
- The cloud session works on `build/stage7`. It follows `technical-plan.md` §16.2 and the project `CLAUDE.md`:
  - one implementer subagent per task, with TDD, two reviews and at most 2 fix rounds;
  - it stops at every milestone gate;
  - it records status in `docs/exec/ledger.md` and never edits `backlog/`.
- The local session syncs Campfire and Obsidian at each gate.
- Gemini key, path A (recommended): an environment API credential, so the key never reaches the VM. Path B: live evals run against the Vercel preview.
- `main` changes only at Stage 11.
**Rejected.**
- Copying the user's personal skills into the repo: they carry local paths and would confuse the cloud session.
- Building locally: breaks the machine rule and the E Drive disk limit.
- A plain environment variable for the key: anyone who uses the environment can see it.

## EXE1 · Stage 7 runs its gates autonomously; "task" = one implementer unit — accepted 2026-09-28 (Stage 7 cloud session)
**Context.** The user is AFK and delegated gate decisions: continue past a milestone when every exit criterion passes; stop only on a gate still failing after 2 fix rounds, or on a Design Freeze, fixed-number, golden-value or threshold change.
**Decision.**
- Each gate still runs `pnpm verify`, `pnpm test:e2e` (plus `pnpm eval` when a key exists) and an independent QA subagent, and its report is written into `docs/exec/ledger.md` and pushed.
- One implementer subagent per unit of work, with TDD, a spec review and a quality review by fresh subagents, and at most 2 fix rounds. Small tickets are one unit (one commit). Large tickets (TKT-02) are split into a few units along the §17 TSK boundaries, each committed as `<imperative summary> (TASK-n)` and pushed; §17 itself prescribes per-TSK commits.
- Parallel streams run in separate git worktrees outside the repo; their single commit per unit is cherry-picked onto `build/stage7`.

## EXE2 · shadcn configured by hand; Playwright pinned to 1.56.1 — accepted 2026-09-28
- `ui.shadcn.com` is blocked by the cloud egress policy, so `components.json`, `lib/utils.ts` (`cn`) and the shadcn deps were written by hand. Components shadcn would add later (the Sheet in TKT-12) are written directly on `@radix-ui/react-dialog` if the registry is still unreachable.
- `@playwright/test` is pinned to 1.56.1, which matches the Chromium revision (1194) preinstalled in the VM; CI installs its own browser.
- The Playwright web server runs `pnpm build && exec next start -p 3000`: pnpm 12 starts script children in a new process group, which left `next start` alive after the run.

## EXE3 · No Gemini key and no preview access in the cloud VM — accepted 2026-09-28
- `GEMINI_API_KEY` is not available here (§16.1 path B). Ask is built and tested with a mocked client and the deterministic fallback. TSK-07.1 (probe), TKT-07 AC6 (live answer < 4 s) and TSK-13.3 (baseline run) are `BLOCKED-pending-key` in the ledger.
- Vercel previews may not exist yet or may be auth-protected; each ledger row records the pushed SHA and preview checks are marked pending for the local session.

## EXE4 · R3 nets out litres another rule already explains — accepted 2026-09-28
- §4.4 defines R3's `used` as tank consumption minus the R1 and R2 litres. The build also subtracts the diesel that an R4 detour's extra km explains (extra km ÷ the truck's km/L on the route).
- Without it, N14 (the 260 km police diversion, ₹6,780, marked wrong) also fires R3 at +22% and creates a 24th flag, which breaks "23 flags" and double-counts the same litres.
- The 1.12 threshold is unchanged and compared in integers (`used×100 ≥ 112×baseline`). R2's litres never reached the tank, so they are not in tank consumption to begin with.

## EXE5 · R1's `at` is the drop's onset — accepted 2026-09-28
- §4.4 says `at` is the first minute the smoothed fuel is ≥ 1 L below the window-start level. With a 5-sample median that lands one minute after the anchored 2:14 AM.
- The build defines `at` as the last minute the smoothed fuel is still within 1 L of the start level, i.e. the onset, so flag 1 reads 2:14–2:40 AM as anchored (§4.3). `until` is unchanged.

## EXE6 · Noise-free tank readings for the ledger — accepted 2026-09-28
- `Trip.tank {startCl, endCl}` and `RefuelBill.tankRiseCl` were added to the §4.1 types: the sensor's settled readings at trip start, trip end and around each refuel.
- The ledger (§4.5) and R3 read them, so diesel totals are exact (for example, yesterday's ₹1,58,300). R1 and R2 still detect from the noisy per-minute samples. The first and last samples carry no noise, so the readings equal the telemetry.

## EXE7 · Non-anchor plaza tariffs — accepted 2026-09-28
- The mockups name only the three JAI-OKH plazas (₹705, ₹725, ₹710; unchanged). The other plazas and pumps were named after towns on the route, and their tariffs were set to ₹790–1,180 so 27 Sep's tolls can reach the anchored ₹38,900 inside TC-013's ₹100–1,500 band.
- Plaza and pump names and every Hindi place name go into `docs/exec/hindi-review.md` for the native review.

## EXE8 · The Today clean line drops the quoted word — accepted 2026-09-28
- The mockup's clean line (`final/index.html:101`) reads: Urja says “unaccounted”, never “theft”. The wording rule (CLAUDE.md, §1, TC-014) forbids that word anywhere in UI copy, even quoted.
- The build reads: "The other 14 trips add up: diesel, tolls and km all match. Urja only points at what doesn't add up. You decide." The count is computed. This is a copy fix under an existing hard rule, not a Design Freeze change.

## EXE9 · Route normal needs earlier clean trips on the same route — accepted 2026-09-28
- `routeNormal(tripId)` is the mean profit of the last 13 clean trips on the same route that ended before this trip (fewer if fewer exist). For 0926-04 that is exactly the 13 anchor trips, ₹16,660.
- 18 trips have no earlier clean trip on their route, so `routeNormal` returns `null` and the Trip page says there is no route history yet instead of inventing a normal.
- Open for Stage 8: some balancer trips on long routes (for example on AHM-JAI) carry low profits (₹850–1,520), which show as outliers in that route's normal chart. It's not an anchor; it's a DES/CR candidate.

## EXE10 · Trip pages for trucks still on the road — accepted 2026-09-28
- Every trip gets a static page, including the 11 in progress at 7:12 AM. Those pages say "On the road", show the chart and timeline up to the last reading, and show no profit, flag or ledger. Nothing is invented for the unfinished part.
- Unknown ids get the root 404 page (Next's `dynamicParams = false` behaviour).
- Trips over 10 hours use a wider chart step (for example 15/30 min) so the chart keeps about 115 bars; the header states the step.
- The R2–R5 and clean-trip variant copy (only R1 was mocked up, §5.4) was written in the build and goes to the Stage 8 critique.

## EXE11 · The Why Urja top bar follows its own mockup — accepted 2026-09-28
- On `/why` the top bar matches `final/why.html`: wordmark, pills, "Start the demo" and the menu, with no Ask field and no fleet chip. The phone menu on `/why` therefore has no "Ask Urja" item. Every other route keeps the full shell, and TC-023's "menu reaches Ask" holds there.
- The page's own styles (`why.html`'s `<style>` block) are ported verbatim into `components/why/why.css`, scoped under `.essay` and loaded only by `/why`.
- Touch targets: on coarse pointers the phone menu button and the top-bar and hero buttons are at least 44 px (TC-023). This is an accessibility fix, so it needs no design review.

## EXE12 · The phone screens keep their own top bar — accepted 2026-09-29
- `final/brief.html` and `final/message.html` are phone screens with their own `.m-top` bar (wordmark plus menu) and no global top bar. The build renders them the same way: the global TopBar is hidden on `/brief` and `/message`, and the screen's own menu reaches Morning brief, Today, Trucks, Trips, Why Urja and Ask. TKT-03 AC2's "top bar on every route" is read as "every desktop-shell route". The mockups are the frozen visual truth, so this follows the Design Freeze rather than changing it.
- `/brief` and `/message` render per request, so `?lang=en` is English on first paint (TC-027).

## EXE13 · Only model answers count toward the Ask eval gate — accepted 2026-09-29 (user decision)
- The eval runner scores whatever `/api/ask` returns. If the guard rejects the model's answers, the deterministic fallback, which is correct by construction, can pass all 10 prepared cases, and the §7 gate would read PASS while Gemini answered nothing.
- **Built:** the runner reports `preparedByModel` ("x/10") and warns on every passing prepared case that did not come from the model. The gate itself is unchanged, per evaluation-plan §7 as written.
- **Decided (user, 2026-09-29): yes.** "≥ 9/10 prepared" now means ≥ 9/10 prepared answers **written by the model** (`mode: "model"`); fallback answers never count. It is stricter, and the threshold is unchanged. Implemented in `evals/run-ask-eval.ts` `summarise()` and in evaluation-plan §2 and §7, with runner tests (a 10/10 run with fallback answers fails; all-fallback fails).
- **Related:** §6.5's strict "a data question with 0 valid cites → fallback" rule means aggregate questions (EVAL-003/007/008/009) that the model answers without citing a trip will show as fallback. Tune the prompt, or accept cited trucks as citations, only after the baseline run.

## EXE14 · Ask drawer build details — accepted 2026-09-29
- The drawer is Radix Dialog, written directly because the shadcn registry is blocked (EXE2). Its motion is CSS keyframes keyed to Radix's open/closed state, with the §6.6 values (240 ms `cubic-bezier(.2,.8,.2,1)`, 180 ms scrim, none under reduced motion).
- The drawer chunk loads lazily, warmed when the browser is idle and mounted on first open, to keep `/` under the 200 KB first-load budget.
- A fallback answer's provenance reads "straight from your data, no AI" instead of a model name. Saved answers carry the banner's first clause ("Urja's AI couldn't answer right now."), because the second half promises a number a saved answer doesn't have.
- The drawer's own labels stay English on the Hindi brief (no Hindi drawer copy is specified). This is a follow-up for Stage 8.

## EXE15 · No route loading.tsx on prerendered pages; ?state= swaps on the client — accepted 2026-09-29
- **Scope change (TKT-11 TSK-11.1; TKT-05 TSK-05.5):** `app/loading.tsx`, `app/brief/loading.tsx` and `app/trips/[tripId]/loading.tsx` are not shipped. On statically prerendered routes a loading boundary makes Next stream the skeleton first and hide the real page in `<div hidden>` until a script runs. That hides the content from no-JS readers, delays LCP, and broke TC-027's no-JS first paint and the `/trips` 307. The loading skeleton is still shown truthfully through `?state=loading` (TC-024), and nothing shows invented progress (TKT-11 AC3).
- `?state=` on Today and Trip is read on the client after hydration, so `/` stays static (○). The cost: a hard load of `/?state=…` shows the working view until hydration, and the specimen payload ships with `/`. `/brief` reads `?state` on the server (it is already dynamic for `?lang`).
- **Not a Design Freeze item:** a performance and no-JS fix; the states' copy and layout follow `final/states.html`. A cleaner alternative for later is query-based rewrites to prerendered specimen routes.

## EXE16 · The scene tag shows on the poster — accepted 2026-09-29, confirmed by the user
- TC-029 asks for "the poster … with the scene tag" when the 3D scene falls back, but the mockup's CSS (`.truck3d:not(.ready) .scene-tag{display:none}`) hides the tag until a live frame renders. The build follows TC-029: in the fallback state the tag shows at the top left of the poster, without its pointer line, and stays hidden on phones.
- This is a label's visibility, not the 3D concept, camera or composition, so it is treated as a spec conflict resolved toward the test case. **Confirmed by the user (2026-09-29): keep it; it is the honesty label.**
- Debug hooks for the context-count test (`window.__urjaGL`, `__urjaGLForce`) exist only when the build sets `NEXT_PUBLIC_DEBUG_GL=1`. The value is inlined at build time, so production builds contain neither, and a bundle check enforces it.

## EXE17 · Performance fixes for the M-004 budget — accepted 2026-09-29
- Anek Devanagari is no longer preloaded (`preload: false`, look unchanged). English pages don't download the 726 KB Devanagari file; Hindi pages still paint in Anek.
- Inter's fallback metrics are defined for Linux/Android as well as Arial systems, to keep CLS ≤ 0.1 during the font swap. The only visible change is the fallback-rendered → glyph.
- `experimental.inlineCss` removes the render-blocking stylesheet round trip.
- The Why Urja poster is not lazy-loaded. TKT-08 AC3 and §13 assume it sits below the fold, but on phones it is inside the first viewport, where lazy loading made it a late LCP element. It is now preloaded with high fetch priority, served as WebP (about 10 KB).
- Performance fixes only: no threshold, visual direction or Design Freeze item changed.

## EXE18 · Self-hosted font subsets, one stylesheet, server-rendered posters (M-004 fix round 2) — accepted 2026-09-29
- **Fonts.** app/fonts.ts serves Google's own Inter and Anek Devanagari files through `next/font/local`, split by unicode-range so a page fetches only what it draws: Inter core (42 KB of the 73 KB latin file, preloaded), Inter ₹ (2 KB, preloaded; Google put ₹ in the 131 KB latin-ext file), and a plate-only Anek face (25 KB of the 114 KB latin file) as its own family, "Anek Plate", used by `.plate` and the 3D plate. Every other face is Google's file unchanged, with the code points it won in Google's CSS. Axes (opsz, wght, wdth) are kept.
- **Look unchanged, pixel for pixel.** Chromium on Linux autohints these fonts using the whole font, so the subsets keep all layout features, glyph names, every code point of the kept glyphs, and (plate) the Latin reference letters the autohinter measures. Screenshots of /, /why, /brief (hi/en), /message, /trips, a trip page and the 404, phone and desktop, match the next/font/google build; the only differences are a 2 px scrollbar strip that also differs between two baseline captures, and a few anti-aliased pixels at the rounded top-right corner of the /why poster on desktop.
- **CSS.** `experimental.inlineCss` is off: it put the stylesheet in Today's HTML three times (62 KB gzip). app/site.css bundles globals + map/scene/states CSS into one stylesheet request (was four).
- **Posters.** Today's and Why Urja's posters are plain `<img>` props from `getImgProps` on the server (same markup and preload as `<Image fill preload>`), so neither page ships next/image's client code (−5 KB gzip; one fewer request on /why).
- Performance fixes only: no Design Freeze item, threshold or fixed number changed. The `.plate` font-family now reads `var(--font-plate), var(--font-hi), var(--font)` (tests/lamp-port.test.ts lists it).
- **Measured (Lighthouse 12.8.2 mobile, simulated, median of 9, local `next start`):** / LCP 3.63 → 2.65 s (still over 2.5), /why 3.31 → 2.44 s, CLS ≤ 0.001, first-load JS on / 145 KB gzip. The rest of Today's LCP is its ~125 KB gzip of React and Next runtime, which Lantern counts because it evaluates before the text paints; see the M-004 gate report.
- **Licences:** the fonts are SIL OFL 1.1. `app/fonts/OFL-Inter.txt` and `app/fonts/OFL-Anek.txt` carry each project's copyright line and the full licence text (OFL §2), and `tests/fonts.test.ts` checks they are there.
- **Result:** Lighthouse mobile with simulated throttling, locally: / LCP 2.65 s (from 7.8 s), /why 2.44 s, CLS ≤ 0.001. / is still over the 2.5 s budget after the two allowed fix rounds, so TC-055 LCP on / is **BLOCKED** in the ledger and the threshold is unchanged. §13 sets the budget "on the preview" (HTTP/2, CDN), so the preview measurement decides it.

## EXE19 · Byline confirmed — accepted 2026-09-29 (user decision)
- The Why Urja byline author is "Tushar Pathak · Product Manager" (`content/why.ts` `BYLINE.author`). The byline open item is closed.

## EXE20 · EXE12 confirmed by the user — 2026-09-29
- /brief and /message keep their own `.m-top` bar and hide the global top bar, following the frozen phone mockups.

## EXE21 · EXE11 confirmed by the user — 2026-09-29
- The /why phone menu has no "Ask Urja", matching `final/why.html`.

## EXE22 · EXE15 confirmed by the user — 2026-09-29
- No route `loading.tsx` on prerendered pages. This protects no-JS first paint and LCP; `?state=loading` shows the skeleton.

## EXE23 · Hindi brief: the menu, the Ask drawer and `<html lang>` follow the language — accepted 2026-09-29 (user decision)
- When the brief or message is in Hindi (`lang=hi`), the phone menu items and every visible label in the Ask drawer (title, input placeholder, chips, buttons, state lines, fallback banner, provenance line) are Hindi. Every new Hindi string goes into `docs/exec/hindi-review.md` for the native review.
- **Accepted exception:** the screen-state copy (`?state=loading|empty|clean|error`) stays English. These states are rare and `final/states.html` is English.
- **Accessibility fix:** the server sends `<html lang="hi">` on the Hindi /brief and /message on first paint (and `lang="en"` for `?lang=en`), not `lang="en"` corrected after hydration. Today and the other pages stay statically prerendered; public URLs don't change.
- **How it's built (EXE23 part 2):**
  - Three root layouts through route groups: `app/(site)` renders `lang="en"` with the top bar; `app/(phone)` (/brief, /message) renders `lang="hi"`; `app/(phone-en)` (internal /en/brief, /en/message) renders `lang="en"`. All three render one shared `app/root-document.tsx`, so fonts, CSS, the icon sprite and the Ask provider can't drift.
  - `next.config.ts` rewrites (not redirects) `?lang=en` to the English group, so public URLs don't change. Direct hits on /en/* redirect to the public URL.
  - Unmatched URLs use `app/global-not-found.tsx`. This needs `experimental.globalNotFound` in Next 16.3.6 (pinned exactly); re-check it on any Next upgrade.
  - Trade-off: a link between root layouts (phone ↔ site, Hindi ↔ English phone) is a full page load. The in-place language toggle is still instant. On the demo path, only Brief → Trip is a full load (about 260 ms locally).

## EXE24 · Ask names its outcome in an `x-ask-outcome` header — accepted 2026-09-29 (Stage 7 follow-up)
- The preview's `/api/ask` fell back on every call, and the cloud session can't read Vercel runtime logs. Every answered `/api/ask` response (200, or 429 when rate-limited) now carries `x-ask-outcome`: `ok`, `timeout`, `network`, `http_4xx:<status>`, `http_429:429`, `http_5xx:<status>`, `bad_json`, `schema`, `guard:<reason>`, `no_key`, `rate_limited`, `cap` or `error`. The 400 and 413 validation errors don't carry it. It holds the same code the log line already records, plus the upstream HTTP status. It never carries the key or the question (a route test checks this). The response body contract (§6.1) is unchanged.
- **What it showed (2026-09-29):** Gemini returned 503 on 9 of 11 calls, and the other 2 timed out at 8 s. TSK-07.1/AC6 and TSK-13.3 are BLOCKED on this upstream unavailability, not on the code. Picking another model is a TP5 decision for the user (the Vercel `ASK_MODEL` setting).

## EXE25 · TC-055 is measured on the preview through the agent proxy — accepted 2026-09-29
- Lighthouse 12.8.2 (mobile, simulated throttling) ran in the VM's Chromium via `--proxy-server`. The proxy's CA was added to the NSS store with `certutil`, so TLS is still verified. The proxy adds the Vercel bypass header.
- Results: `/` has a median LCP of 1.83 s over 9 runs (two outliers at about 4.5 s are kept in the record), and `/why` 1.52 s over 5 runs, against the unchanged 2.5 s budget. M-004 passes. Proxy hops add latency on top of the real path, so these numbers err on the slow side.

## EXE26 · A fallback model answers when the primary is busy — accepted 2026-09-29 (user decision, relayed by the local session)
- **Why:** the preview's Gemini calls got 429 (quota) and 503 (busy) from `gemini-3.5-flash`. The local session confirmed that the key and the model id are valid (ListModels lists `models/gemini-3.5-flash` with generateContent), so the free tier is the likely cause. The live demo shouldn't depend on one busy model.
- **Built:** `callGeminiWithFallback` (lib/ask/gemini.ts).
  - On an upstream **429 or 503**, and only then, it asks `ASK_FALLBACK_MODEL` once. The default is `gemini-2.5-flash`; `off` disables it; a value equal to the primary disables it too.
  - The retry runs **inside the existing 8 s budget**, with whatever the first call left. It is skipped when less than 1 s is left (`MIN_RETRY_MS`). `ASK_TIMEOUT_MS` stays 8000.
  - Any other failure, or a second failure, goes to the deterministic fallback as before. The guard checks the fallback model's answer like any other.
- **Thinking config:** Gemini 2.x rejects `thinkingLevel`. `thinkingFor` sends `thinkingBudget: 0` to 2.x Flash (the lowest-latency setting, like "minimal" on Gemini 3) and no thinking config to other 2.x models (Pro can't turn thinking off). It applies to the primary too, so `ASK_MODEL` can be a 2.x Flash.
- **Named everywhere:**
  - `provenance.model` is the model that answered, so the UI's provenance line reads "Gemini 2.5 Flash".
  - `x-ask-outcome` becomes `<outcome>[:<detail>][; model=<model>][; after=<first outcome> <first model>]`, for example `ok; model=gemini-2.5-flash; after=http_429:429 gemini-3.5-flash`. This extends the EXE24 format.
  - The log line gains `firstAttempt`.
  - The eval records `model` per case and `modelCounts` in provenance.
- **Gate unchanged:** an answer from the fallback model is `mode: "model"` and counts as a model answer (EXE13). No threshold, golden value or dataset changed.
- **x-ask-outcome (user decision):** kept through Stage 9 QA. The Stage 10 security review decides whether it ships to `main`; the default is keep, since it carries no key or question.

## EXE27 · Hindi AI pre-review H1–H10 applied — accepted 2026-09-29 (user decision, relayed by the local session)
- An AI pre-review (not a native speaker) of `docs/exec/hindi-review.md`. H1–H10 are applied in the source strings, and the doc is regenerated with the header line "AI pre-review 2026-09-29 applied H1–H10; native review pending." The native review stays open.
- **H1** changes a documented choice: technical-plan §6.6 and the mockups showed chip 2 in Hindi on the English drawer. It is now English ("How much diesel went unaccounted last week?"), and the Hindi drops गायब ("पिछले हफ़्ते कितने डीज़ल का हिसाब नहीं मिला?"). Both chips reach the same fallback answer (217 L, ₹19,530, 5 trips), and a test covers it. EVAL-002 and a route test keep the old user wording as input; that is a user's question, not our copy.
- **Also applied, for consistency:** टंकी and सीमा on R2's "8%" line, and Indian km grouping in two English trip lines.
- **Mockups:** 4 Hindi strings in `.design/exploration/final/brief.html` and chip 2 in `final/index.html` were updated to the new copy, because TC-015 compares the brief with the mockup. These are copy changes only, with no layout or visual change.
- **Unchanged:** all numbers (km grouping is formatting only). Left for the native reviewer: मान लिया / माना, मामला, and the time-of-day boundaries.

## EXE28 · Field quotes are illustrative and labelled as such — accepted 2026-09-29 (user decision)
- `content/field-notes.ts` has four composite quotes with `illustrative: true`. Chapter 01 of Why Urja shows the label "Illustrative quotes, not from interviews: composites written to show what fleet owners commonly describe. Real field notes will replace them." above the cards, and each card has an "Illustrative" chip. They are never presented as interviews.
- **Open for the user:** chapter 01's title, "I went and asked", now sits above illustrative quotes. It is unchanged here, because titles are part of the Why Urja IA and copy under the Design Freeze.

## EXE29 · Stage 8 critique without the `bw-design-critique` skill — judgement call 2026-10-05 (to confirm)
- **Why:** TSK-15.1 names `bw-design-critique` (milestones.md says `impeccable`). Neither skill is installed in this cloud session, and the user asked to move to the next stage.
- **Done instead:** three fresh critic subagents reviewed the preview (`urja-git-build-stage7-tushar-49a6.vercel.app`, build/stage7 at 68aced0) against Design.md (Design Freeze, §7, §12–§19, §24–§26) and `.design/exploration/final/`, split by area:
  - A: Today and Trip;
  - B: the phone screens, Ask and states;
  - C: Why Urja and OG, plus the Stage 8 accessibility items Design.md §17 defers (320 px reflow, 200% text, a keyboard-only pass).
- **Findings and fixes:** findings are numbered DES-2 onward (DES-1 is already fixed). Pixel, accessibility, browser and performance findings are fixed on build/stage7 without approval. Anything touching a Design Freeze item is parked for the user.
- **Browser access:** the sandbox Chromium doesn't trust the agent proxy's CA in this session. The critique helper fetches each request Node-side (`NODE_EXTRA_CA_CERTS`, TLS verified) and fulfils it in the page. TLS checks are never disabled.
- **Option for the user:** run `bw-design-critique` locally against the preview as well. Its findings join the same DES list.

## EXE30 · Ask ask-v2: grounded citations, trip counts and refusals — judgement call 2026-10-05 (Stage 9; one question for the user)
- **Why:** baseline-v1 (3ab14d4, Gemini live on the preview) scored 3/10 prepared answers by the model and 1/3 off-topic.
  - EVAL-002, 005 and 006 left out the count, place or time.
  - 001, 007, 008 and 009 fell back. The likely cause is that the guard dropped flag-id cites (`0926-11-R3`) to zero citations; 007 and 009 had nothing to cite at all.
  - 011 and 013 returned "saved", which carries no refusal wording.
- **Built** (8bcb303, after a spec review and a quality review, with 1 fix round): technical-plan §6.8 lists every change.
  - The ask-v2 answer rules, plus count fields in the context.
  - A flag id maps to its trip. A plate grounds an answer only when the answer names it; the reviewer's blocker B1 closed the "any plate" hole.
  - Off-topic questions get a fixed refusal on non-model paths.
  - `maxOutputTokens` is 1024.
  - CR-1 `copyLang`.
  - The runner records the outcome of each call.
- **Unchanged:** the scorer, the dataset, every threshold, every golden value, and the §6.3 instruction text.
- **Residual risk:** an answer that names and cites only a plate passes the guard while making trip-level claims. Its figures are still checked against the data, and EVAL-006 and EVAL-010 still need trip cites.
- **Known limit:** when the model can't answer, the refusal keywords decide alone. Tests cover both directions: in-scope questions about diesel price or driver instructions are not refused.
- **For the user (B2):**
  - Off-topic cases can now pass on the fixed refusal with no model answer. evaluation-plan §4.7 doesn't look at mode, so this is allowed.
  - The runner now warns on each such pass.
  - Should off-topic, like prepared (EXE13), count only model answers? Default until you decide: the threshold stays, the warnings are reported, and an off-topic 3/3 is never claimed for the model unless every pass came from the model.
