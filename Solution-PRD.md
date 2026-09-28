# Solution PRD — Urja

**Status:** Approved 2026-09-28 · **Owner:** Tushar · **Ticket:** TASK-1 · **Inputs:** `Discovery-PRD.md`, `decisions.md`

## One line
**Urja — an AI munshi for Indian fleet owners.** It reconciles every trip's diesel, tolls and kilometres from vehicle data, and tells the owner each morning, in Hindi or English, where money leaked and how sure it is. *A concept for Bytebeam.*

## Why this is 5–10x, not a little better
| Today (competitors) | Urja |
|---|---|
| Control-room dashboard the owner never opens | Morning brief where the owner already is (WhatsApp-style) |
| Charts and alerts | Rupees per trip, one sentence per problem |
| Fuel-theft alerts need an extra fuel sensor | Uses CAN fuel level + GPS + FASTag that Bytebeam-class devices already stream |
| "Theft!" alerts that sour driver relationships | Every flag carries a confidence level and a **driver's side** |
| English-first | Hindi-first on mobile |

## How it maps to Bytebeam's existing platform
CAN/DBC parsers (fuel level, odometer, RPM) → Streams → geofences (fuel pumps, depots, toll plazas) → **leakage rules** (new) → Alerts over **WhatsApp/SMS** (exists) → dashboard panels (Track Devices, Timeseries, Histogram exist). The new product is the reconciliation + AI layer, not new hardware.

## Users and jobs
- **Primary — fleet owner (mobile):** "Tell me, without me digging, which trips lost money yesterday and why."
- **Secondary — owner or munshi at a desk (desktop):** "Show me the evidence, rank my trucks, let me ask questions."
- **Affected — driver:** must be able to explain before being judged.

## Screens (in demo order)
1. **Morning Brief** (mobile-first) — a WhatsApp-style message: yesterday's fleet profit, ₹ leaked, the top 3 issues each as one sentence with truck, place, time and confidence. Hindi / English toggle. Tapping an issue opens the trip.
2. **Trip Evidence** — map trail with planned vs actual route; fuel-level chart with the anomaly marked; event timeline; trip P&L (freight − diesel − tolls − driver allowance − other); flag card with confidence, the rule that fired and the evidence; **driver's side** (driver's explanation, owner accepts or rejects).
3. **Fleet Overview** (desktop) — KPIs (yesterday's profit, month-to-date leakage, trucks with open flags); trucks ranked by ₹ profit per km; live map; monthly report cards (Flighty-style, one theme colour per card).
4. **Truck Report Card** — one truck's month: km, km/L against its baseline, profit per km, leakage, trips list.
5. **Ask Urja** — a live AI question box on every screen (drawer on desktop, chat on mobile). Answers in the question's language, only from fleet data, and cites the trucks/trips it used.
6. **Why Urja** — the pitch: field findings, problem, user, competitors, metric and guardrail, Bytebeam mapping, what's next.

## Leakage rules (real computation on simulated data)
| Rule | Fires when | Label shown |
|---|---|---|
| R1 Stationary fuel drop | Fuel falls > 15 L within 30 min while speed = 0, outside a fuel-pump geofence | "Diesel unaccounted" |
| R2 Refuel mismatch | Claimed refuel litres exceed the CAN fuel-level rise by > 8% | "Fuel bill higher than tank rise" |
| R3 Excess consumption | Trip km/L is > 12% worse than the truck's baseline for that route and load | "Used more diesel than usual" |
| R4 Route deviation | Actual km exceeds planned km by > 6%, or a detour of > 10 km | "Extra km off route" |
| R5 Toll mismatch | Toll expense claimed differs from FASTag deductions | "Toll claim doesn't match FASTag" |

Each flag gets **confidence** (High / Medium / Low) from signal quality (GPS gaps, sensor noise, how far past the threshold). Low-confidence flags say "Check", never an accusation. Wording always says "unaccounted", never "theft".

## AI design
- **Detection is deterministic** (rules above) so every rupee shown is explainable.
- **Morning brief** is generated from the computed flags (templated, both languages) — no model needed, so it never hallucinates.
- **Ask Urja** uses Gemini (`gemini-3.5-flash`) through one server route. The model receives a compact JSON summary of the fleet data and must answer only from it, say "I don't have that data" otherwise, and list the trucks and trips it used. Guards: server-side key only, per-IP rate limit, daily call cap, 8-second timeout, pre-written fallback answers for the demo questions.

## Metrics (the product story)
- **North star:** ₹ leakage recovered per truck per month.
- **Leading indicators:** share of mornings the owner opens the brief; share of flags the owner acts on (resolve, dispute, call the driver) within 24 hours.
- **Guardrail:** **false-accusation rate** (flags the driver disputes and the owner accepts as innocent ÷ all flags) stays under 10%; driver 90-day retention does not fall below the fleet's baseline. If the tool "works too well", owners blame drivers for sensor glitches and good drivers leave.

## Prototype acceptance criteria (what "done" means before 2026-10-04)
1. The 5-step demo path (brief → trip → fleet → Ask Urja → Why Urja) runs start to finish on the deployed URL with no errors.
2. Every ₹ figure on screen is computed from the simulated data, and the numbers agree across screens.
3. Ask Urja answers a set of 10 prepared questions correctly and grounded in the data (≥ 9/10), and handles 3 off-topic or unanswerable questions without making things up. Typical answer arrives in under 4 seconds; on API failure, the fallback shows.
4. Works at 375 px, 768 px and 1440 px with no horizontal scroll; every data view has loading, empty, error and working states.
5. The link preview (Open Graph and Twitter tags, 1200×630 image) renders correctly in LinkedIn Post Inspector and opengraph.xyz.
6. Typecheck, lint and tests pass.

## Out of scope
Real telemetry ingestion, login and multiple companies, actually sending WhatsApp messages, driver-facing app, dispatch and load booking, predictive maintenance, OTA, payments and invoicing, Bytebeam branding.

## Risks
| Risk | Mitigation |
|---|---|
| Field conversations don't confirm leakage (A1) | Decide by 2026-10-01; parked alternatives in Discovery-PRD |
| Live AI fails during the interview | Fallback answers + rehearse offline mode |
| Scope overruns the 5 build days | Screens 1–3 and 5 are must-have; 4 (Truck Report Card) is cut first |
| Gemini key was pasted in chat | Rotate before deploy; spend cap + budget alert |
| E Drive at 94% full (8 GB free) | Monitor free space during install and build |
