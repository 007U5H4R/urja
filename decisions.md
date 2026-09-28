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
