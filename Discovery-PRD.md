# Discovery PRD — Urja

**Status:** Approved 2026-09-28 (from the Stage 1 grilling session) · **Owner:** Tushar · **Ticket:** TASK-1

## Why this exists
Tushar interviews for **Product Manager, Bytebeam** on **2026-10-07**. The JD says Bytebeam is "building an AI-native platform for Indian commercial fleets" and that "building is cheap, so finding the right problem is the job." The deliverable must therefore prove **discovery and product judgement first**, with world-class UI in service of that — not a prettier telemetry dashboard.

## Context (facts, researched 2026-09-28)
- **Bytebeam today** is a horizontal IoT platform (device management, OTA, remote debugging, dashboards, alerts via email/Slack/webhook/**WhatsApp/SMS**, CAN/DBC parsers). Customers are mostly EV 2W/3W OEMs and energy companies (River, Simple, Lectrix, Exponent, Royal Enfield, Zypp). The commercial-fleet product has **no public footprint** — it is greenfield.
- **Competitors:** Fleetx (fuel-sensor theft alerts, FASTag, trip P&L, TMS — "AI-powered"), Intangles (predictive maintenance), LocoNav (GPS, video, scorecards), Samsara globally (AI agents, daily fleet summaries). Indian vendors compete on vernacular apps and < $3/vehicle/month.
- **Pain signals (vendor-blog sources — directional, not proven):** fuel is 35–45% of operating cost; 15–20% of fuel spend claimed lost to theft/fraud; driver behaviour adds 10–15%; driver churn claimed at 57% within 6 months; freight margins are thin.

## The user
**Owner of a small/mid Indian commercial fleet (10–100 trucks)**, often owner-operator. Lives on phone and WhatsApp, may prefer Hindi, thinks in rupees per trip — not charts. Does not sit in a control room; the control-room products (built for enterprise fleet managers) do not serve this person.

## The problem
> "The truck finished the trip — why did I make almost nothing?"

Trip profit leaks through diesel that disappears (siphoning, inflated fuel bills, idling, bad driving), toll/expense claims that don't match FASTag, and extra km off the planned route. Today a **munshi** (trip accountant) reconciles this by hand, days late, from paper slips. The owner finds out at month end, if at all.

## Assumptions to validate before building (by 2026-10-01)
| # | Assumption | How | Kill signal |
|---|---|---|---|
| A1 | Leakage is a top-3 money pain for small-fleet owners | 2–3 conversations: "Tell me about the last trip where you lost money." | Nobody mentions diesel/expenses unprompted |
| A2 | Owners would act on a daily brief on WhatsApp | Ask how they hear about trip problems today | They only review monthly and don't want more |
| A3 | Accusing drivers is the real risk of such a tool | Ask how they handle suspected diesel loss today | — (informs the guardrail) |

If A1 fails, we switch problems **before** the build (candidates parked: idle trucks / low utilisation; driver retention).

## Scope of the prototype
A deployed, clickable concept on simulated data for one fictional fleet (**Sharma Roadlines, Jaipur, 24 trucks, 30 days**), plus a "Why Urja" story page. No real telemetry, no login, no real WhatsApp sending.

## Success
- **Interview success:** the interviewer remembers a real problem, a clear user, a metric with a guardrail, and a credible path on Bytebeam's own stack — and can open the link themselves.
- **Product success (the story being pitched):** see `Solution-PRD.md` § Metrics.
