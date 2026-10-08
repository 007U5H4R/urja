# Bet spec: SuprFleet "Munshi → credit" (draft for user review)

> **Label corrections (2026-10-07, after the research honesty pass; numbers unchanged):** §3's CV Stage 3 3.3–4.8% is our assumption (only 3.35% and 3.7% are cited); §5 H3's ₹150–300 is our estimate from listed prices; §7's referral role under the RBI 2025 Directions is our reading; §6's family column is a stream kind (families are source systems, EXE43); §11's launch gate is '≥ 1 NBFC in referral-pilot talks' (EXE46); confidence vs autonomy wording per EXE45; metric targets per EXE47; §2 moat 4 and §7 'Who pays for Free' hold once a lender signs, and until then the paid tiers and the pilot budget fund Free (EXE46). North Star in two layers per EXE50: Urja's ₹ recovered per truck per month, guarded by wrong flags under 10%, with verified truck-months (§8–§9, unchanged) as the bet's layer above; phase 1 adds 'start NBFC referral-pilot talks'; hypotheses read 'not field-tested yet'.

**Status:** draft, 2026-10-07. This file freezes the numbers and copy that the prototype (TASK-21..29), the strategy doc, the deck and the PRD use.

**Labels:**
- **[R#]** cites the research memos in `docs/bet/research/`. Those are search-snippet level and still **unverified** until the verification pass.
- **[A]** marks an assumption we chose and will defend as one.
- **[D]** marks a figure computed from the simulated dataset.

## 1. The product in one sentence
SuprFleet Munshi closes a small fleet owner's books every morning: it reconciles each truck's diesel, tolls and trips into a per-truck profit with evidence, in Hindi on WhatsApp, using telemetry the truck already sends. That verified ledger becomes the record a lender can finance against, with the owner's consent.

## 2. Segment, job, why now, moat
- **Segment (phase 1):** truck operators with 1–20 trucks. About 75% of India's ~3.5 M operators own fewer than 5 trucks [R india-structure #1]. They are served by GPS boxes (BlackBuck, WheelsEye) and khata apps (TransportBook), but nobody reconciles telemetry into rupees [R competitors §c].
- **Job:** "Where did my money go yesterday, and what do I do about it?" Fuel is 45–55% of operating cost [R india-structure #4, #6], and leakage is often cited at about 8% of diesel. That figure is soft [R india-structure #6].
- **Segment (phase 2):** EV 2W/3W delivery fleets. This is Bytebeam's public base: Zypp, plus OEMs [R competitors #3]. L5 e-3W penetration is above 31% [R india-structure #36], and banks cite resale-value fear [R india-structure #38]. The same ledger, plus battery health, becomes the finance record.
- **Why now:**
  - Mandated or factory telemetry already exists: AIS-140 and OEM telematics [R india-structure #12, #14].
  - FASTag covers more than 98% of NH tolls [R #8].
  - There are about 140 M e-way bills a month [R #17].
  - Account Aggregator consent is at scale (₹1.67 lakh cr disbursed in FY25) [R #26].
  - WhatsApp has 500 M+ users, and a utility message costs ₹0.145 [R #18, #19].
  - LLMs make a Hindi munshi cheap to run.
- **Moat:**
  1. Verified-ledger history per truck compounds, and a copycat can't backfill it.
  2. The driver's-side dispute loop sets our wrong-flag rate, which a lender trusts.
  3. Device-agnostic ingestion: SuprNova's ~1M-vehicle platform is a claim in the brief that we couldn't verify publicly [R competitors §b].
  4. Lender partnerships fund the free tier, and a pure-SaaS rival can't match that price.

## 3. The 5–10x
Each multiple is worked out and defended separately.

| Dimension | Status quo | SuprFleet Munshi | Multiple |
|---|---|---|---|
| Time to know a leak | Month-end munshi register (~30 days) | Next morning (1 day) | **~30x faster** [A: month-end reconciliation is typical] |
| Hardware to measure fuel | Sensor ₹8,000–12,500 + ₹400–750 per month [R competitors #29] | ₹0 new hardware (stream fusion on existing feeds) | Removes the main barrier for the long tail |
| What the owner gets | A dot on a map, or a manual khata | A ₹ answer, evidence, the driver's side, and a next action | Changes the job, not the speed |
| Credit access | Used-truck loan priced blind (CV Stage 3 3.3–4.8%) [R india-structure #20–22] | Lender sees verified cash flow | Lower-risk loans [A] |

## 4. The board (axes, and where we play)
Columns are the jobs: Leakage and books · Uptime and maintenance · Compliance · Find loads · Finance and insure the asset · Driver safety.

| Segment | Books | Uptime | Compliance | Loads | Finance | Safety |
|---|---|---|---|---|---|---|
| Small trucks (1–20) | **CHOSEN (phase 1)** | Intangles is strong, low WTP | AIS-140 is a commodity | BlackBuck/Vahak network effects | **Phase 1b: via the ledger** | Video hardware too costly |
| Mid/large trucks | Fleetx serves it | Intangles | Served | Brokers | NBFCs in-house | Netradyne/Lytx |
| EV 2W/3W delivery | **Phase 2** | Bytebeam OEM base | Light | Platforms | **Phase 2: battery + earnings ledger** | Low priority |
| Staff/school buses | Low pain | Medium | High (school safety) | n/a | n/a | Medium |
| Intercity buses | Medium | Medium | Medium | n/a | n/a | Medium |

**Dropped candidates, with reasons:**
- **Load matching:** network effects favour incumbents (BlackBuck, Vahak with 20 L+ businesses) [R competitors #34].
- **Predictive maintenance:** Intangles is strong (500k+ vehicles) [R competitors #20], and the payoff for small owners is slower.
- **Compliance on autopilot:** AIS-140 turns tracking into a commodity floor [R global #29], and it is easy for incumbents to copy.
- **Video-AI safety:** the device and data costs don't fit the long tail. It is proven in the US, where insurance pays [R global (b)2].
- **Fuel card:** interchange is thin in India, and Motive's card was 4% of revenue [R global #5].
- **Insurance telematics now:** IRDAI pay-as-you-drive is nascent and private-car only [R india-structure #41]. It is phase 3.

## 5. Hypotheses (all untested by field calls; research verdicts)

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Leakage is material for small fleets | Supported, but the number is soft (~8% oft-cited; vendor 10–37%) |
| H2 | Owners act on a daily WhatsApp brief | Untested. No evidence either way, so it's an assumption. The pilot measures it |
| H3 | Small operators' software WTP is low | Partly contradicted: they pay ₹150–300 per truck per month for GPS plus khata [R competitors §d]. Paying for bookkeeping is unproven |
| H4 | Lenders value verified per-truck cash flow | The direction is supported. No evidence of a lender paying a third party, so the model is a **lending partnership** |
| H5 | Factory fuel data is enough without a sensor | Weak: CAN steps are 10–40 L [R india-structure #40]. Hence stream fusion and honest confidence |
| H6 | Flags that skip the driver's side drive drivers away | Untested. Kept as the guardrail metric |
| H7 | Insurers would price on telemetry (India) | Weak now. Phase 3 |

## 6. Streams and confidence (the panel's lens)
Confidence rises as each stream rules out an innocent cause; autonomy needs independent families to agree (the L4 auto-hold needs High and ≥ 2 families):

| Stream | Family | Exists today? |
|---|---|---|
| GPS · ignition (AIS-140/OEM) | position | Yes, mandated |
| CAN fuel level | fuel | Yes on BS-VI, coarse [R #40] |
| Geofence (pumps, plazas, yards) | place | Platform |
| FASTag | money/place | Yes, >98% of NH tolls |
| E-way bill / ULIP | load/trip | Yes, ~140 M a month |
| Fuel bill (typed) → **bill OCR** | money | OCR simulated in the prototype |
| Fleet history | baseline | Platform |
| **Camera** | visual | Optional, simulated in the prototype |

**Showcases** (deterministic, from the dataset):
- **0926-04:** Check → Likely → Likely → High → High (the camera adds the 2nd family), which unlocks L4.
- **0927-02:** Likely → High once bill OCR replaces the hand-typed bill.
- **0926-11:** stays at Check. No stream lifts a heavy-load cap. That is the honest counter-example.

## 7. Autonomy ladder × tiers

| Level | Action | Gate | Tier |
|---|---|---|---|
| L1 Insight | Morning brief, flags, evidence, Ask | — | **Free** |
| L2 Deterministic action | Ask the driver; hold the fuel card; recover from settlement | Hold needs ≥ Likely; recover needs High or confirmed | **Munshi** |
| L3 Corrective SOP | Block a pump; set a route diesel norm; night-stop rule | — | **Pro** |
| L4 Guardrail | Auto-hold a driver advance above **₹2,000** when the flag is High, with a one-tap owner override | High **and** ≥ 2 stream families | **Autopilot** |
| L5 Autopilot | Self-closing daily settlement | Future, not built now | — |

**Pricing**, per truck per month [A, anchored on R competitors §d: owners spend ₹150–300 today]:

| Tier | Price | Includes |
|---|---|---|
| Free | ₹0 | L1 |
| Munshi | ₹299 | L1–L2 and the daily close |
| Pro | ₹499 | Adds L3 and benchmarks vs similar fleets |
| Autopilot | ₹799 | Adds L4 guardrails |

**Cost to serve** per truck per month [A unless cited]:

| Item | Cost |
|---|---|
| WhatsApp utility messages (~30 × ₹0.145) [R #19] | ₹4 |
| LLM (Gemini Flash, ~40 answers) | ₹15 |
| Ingestion, storage, compute | ₹25 |
| Bill OCR (~20 bills) | ₹4 |
| Support amortised | ₹30 |
| **Total** | **≈ ₹78** |

**Who pays for Free:** the lending partnership. SuprFleet is a referral or lending-service partner under the RBI Digital Lending Directions 2025 [R india-structure #28]. Each funded loan pays a referral fee of 0.5–1.5% of the loan amount [A; DSA payout ranges vary and are unverified]. One ₹10 lakh used-truck loan therefore pays ₹5,000–15,000, which covers 5–16 years of Free cost on that truck [A].

## 8. Verified ledger and trust score
- **Verified day:** the books closed, every trip reconciled, and no unresolved flag older than 48 h.
- **Verified truck-month:** at least 25 verified days in the month.
- **Trust score (0–100)** [A weights]:

| Factor | Weight |
|---|---|
| Data completeness (trip-minutes without a GPS gap over 5 min) | 30 |
| Flag resolution within 48 h | 25 |
| Leakage as a share of diesel ₹ (lower is better) | 20 |
| Weekly profit stability | 15 |
| Utilisation | 10 |

  The score is labelled "provisional" until 180 verified days.
- **Lender view:** the dataset holds 27 days, so the page shows "27 of 180 verified days". **No projected months.**

## 9. Metrics
- **North Star:** **verified truck-months**. It ties owner value (closed books) to the asset a lender trusts.
- **Primary metrics:**
  - % of mornings the brief is opened;
  - % of flags acted on within 24 h;
  - ₹ recovered per truck per month;
  - daily-close completion rate;
  - Free → Munshi conversion;
  - loan-ready trucks and loans referred.
- **Guardrails:**
  - wrong-flag rate under 10% (driver disputes accepted as innocent);
  - driver 90-day retention;
  - owner churn;
  - Ask answer accuracy (eval ≥ 9/10 by the model);
  - consent revocations;
  - cost to serve under ₹100 per truck per month.

## 10. Roadmap and what we are not building
- **Phase 1 (0–6 months):**
  - the daily close, brief and evidence on existing streams (AIS-140/OEM, FASTag, e-way bill, bill OCR);
  - L1–L2;
  - 3 pilot fleets in Jaipur, Kishangarh and Delhi;
  - measure the wrong-flag rate before owners see flags.
- **Phase 2 (6–12 months):**
  - L3 SOPs, L4 guardrails, benchmarks;
  - the first NBFC lending partnership, with consent flow (AA/DPDP);
  - the EV 2W/3W delivery-fleet ledger, adding battery health.
- **Phase 3 (12–24 months):** insurance pricing (once IRDAI's commercial-vehicle pay-as-you-drive matures), resale certificates and self-closing settlement.
- **Not building:**
  - our own hardware or dongle;
  - video dashcams for the long tail;
  - a load marketplace;
  - our own NBFC (a stated option later, not now);
  - a fuel card;
  - driver scoring without the driver's side.

## 11. GTM (launch)
1. **Existing base first:** fleets already on SuprNova/SuprFleet and AIS-140 device vendors. Activate Free (the brief) at no cost.
2. **Transport-nagar munshi network:** recruit munshis as champions in Jaipur, Kishangarh and Delhi; Hindi-first.
3. **Lender channel:** an NBFC (used-CV book) offers SuprFleet Munshi to its borrowers. The lender gets better collections data; the borrower gets cheaper credit. That is distribution the lender pays for.
4. **WhatsApp-led upgrade:** Free → Munshi from inside the brief ("hold this card?" → upgrade).
5. **Launch criteria:**
   - wrong-flag rate under 10% across 3 pilots;
   - brief opened on ≥ 60% of mornings [A];
   - ≥ 1 lending partner signed.
