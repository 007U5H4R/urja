# SuprFleet 2030: research report

*Research deliverable for the PM take-home "SuprFleet 2030: where is fleet management heading, and what should Bytebeam's SuprFleet build?" Date: 7 Oct 2026. Companion to `docs/bet/bet-spec.md`.*

---

## 1. Status

**Every source in this report is UNVERIFIED.** The three research memos behind it were built from web-search snippets. The environment's network policy blocked page fetches, so no cited page was opened. The one exception is Bytebeam's GitHub org [S77], which the memo author did open. Every figure below needs a page-level check before it goes in front of the panel.

**No field calls were made.** No fleet owner, driver, munshi or lender was interviewed. Nothing here is a field quote. Where a hypothesis rests on behaviour, it is marked "untested by field calls".

**Figures to verify first, in priority order:**

| # | Figure | Why it matters | Source | Known issue |
|---|---|---|---|---|
| 1 | 75% of ~3.5 M operators own fewer than 5 trucks | Sizes the segment | [S36] | Other sources say 68% (no quote found) and 80% [S105]; read the Zinka prospectus directly |
| 2 | Diesel leakage ~8% of fuel filled | The core pain claim | [S41] | A vendor blog citing MotorIndia; a citation of a citation |
| 3 | WhatsApp utility message ₹0.145 | Cost to serve | [S54] | Reseller blog; check Meta's own rate card |
| 4 | CV Stage 3 of 3.35–4.79%; used-vehicle loans growing at 15% CAGR vs 11% new | The credit thesis | [S55]–[S57], [S59] | Rating rationales and press, not annual reports |
| 5 | FASTag >98% of NH tolls; 140.6 M e-way bills in Mar 2026; ₹1.67 lakh cr disbursed via AA in FY25 | "Why now" | [S43], [S52], [S61] | Press coverage of government figures |
| 6 | IRDAI made pay-as-you-drive a mandatory first offer (Jun 2024) | The insurance timing | [S66] | A personal-finance site paraphrasing the master circular |
| 7 | CAN fuel level moves in 10–40 L steps | H5 and the "no new hardware" claim | [S75] | A generic US patent, not a measurement of Indian BS-VI trucks |
| 8 | AIS-140 scope | Which trucks already stream GPS | [S47] vs [S29] | Rule 125H says national-permit goods carriers registered from 1 Jan 2019. A Fleetx blog says all CVs registered before Jan 2025 must comply by 31 Mar 2026. These conflict |
| 9 | Fuel-monitoring software at ₹400–950/month | The 5–10x hardware argument | [S104] | The snippet says "INR 400 to INR 750". The ₹950 upper bound has no quote |
| 10 | BlackBuck "≈₹460 per operator per year" | H3 | Memo, no quote | The ₹427 cr revenue base has no source. ₹427 cr ÷ 7.65 lakh operators ≈ ₹5,600 a year (≈₹465 a month), not ₹460 a year. Do not use until it is re-derived |
| 11 | SuprFleet base of "~1 million vehicles" | GTM step 1 | The brief [S110] | No public footprint; it may be mostly EV 2W |

---

## 2. Executive summary

- **The box is becoming a commodity floor. The money moves to whoever closes a transaction.** Mandates and factory telematics make tracking a compliance cost [S29], [S30]. The players with margin control a money flow: Corpay's fuel payments [S19], TriumphPay's freight payments [S23], Nirvana's underwriting [S20].
- **India inverts the Western stack.** Public rails (FASTag, e-way bill, ULIP, Account Aggregator) already carry the data a per-truck ledger needs [S43], [S51], [S52], [S61]. The monetisable moment is the used-truck loan, not the new-truck OEM subscription [S55], [S59].
- **The proven Western wedge, video safety, breaks in India.** It pays in the US because insurers price on it [S21]. Indian commercial-vehicle telematics insurance is not live yet [S76].
- **The unowned job is "which truck lost money yesterday, and why".** GPS vendors sell a dot on a map. Khata apps hold the books with no telemetry. Fuel reconciliation needs a sensor the long tail doesn't buy [S84], [S104], [S107]. This is the job SuprFleet should take, for 1–20 truck operators, phase 1.
- **The verified ledger is the moat and the business model.** History per truck compounds. A lender can underwrite against it with the owner's consent (AA/DPDP) [S61], [S68]. Agents running fleets, driverless trucks and fuel cards are hype in India for now.

---

## 3. The board

The brief asks for the whole board before any idea. We use two grids. The first places segments against jobs. The second places telemetry streams against the brief's autonomy ladder.

### 3.1 Segments × jobs

Cells show who serves the cell today and the verdict for us.

| Segment | Leakage and books | Uptime | Compliance | Loads | Finance / insure the asset | Safety |
|---|---|---|---|---|---|---|
| **Small trucks (1–20)** | **White space.** Khata apps with no telemetry (TransportBook ₹4,999/yr [S107]); GPS vendors with no ₹ reconciliation. **CHOSEN, phase 1** | Intangles is strong, but WTP is low [S94] | AIS-140 is a commodity (₹2,800–5,500 hardware [S84]) | BlackBuck and Vahak hold network effects [S96], [S109] | NBFCs price used-CV loans without operating data. **Phase 1b, via the ledger** | Video hardware costs too much for the long tail |
| Mid/large trucks | Fleetx (₹300–600/vehicle/month [S85]) | Intangles | Served | Brokers | NBFCs keep the data in-house [S64] | Netradyne, Lytx [S13], [S12] |
| EV 2W/3W delivery | **Phase 2** (battery and earnings ledger) | Bytebeam's OEM base [S79] | Light | Platforms | Banks fear resale value [S73]. **Phase 2** | Low priority |
| Staff/school buses | Low pain | Medium | High (school safety) | n/a | n/a | Medium |
| Intercity buses | Medium | Medium | Medium | n/a | n/a | Medium |

The bus rows are judgments, not research. None of the three memos studied buses. That is a gap, listed in §12.

### 3.2 Telemetry streams × autonomy ladder (small trucks, books job)

The brief says confidence rises as independent streams agree. The table lists what exists in India today and what each rung of the ladder could do with it.

| Stream (brief's family) | Exists in India today? | L1 Insight | L2 Deterministic action | L3 Corrective SOP | L4 Guardrail |
|---|---|---|---|---|---|
| GPS, ignition (Vehicle, Trip) | Mandated for some CVs; enforcement is gamed [S47], [S48] | Unplanned stop, idle time | Ask the driver | Night-stop rule | Combined with other streams |
| CAN fuel level (Vehicle) | On new OEM-connected trucks; coarse steps [S49], [S75] | Fuel drop vs distance | Ask the driver | Route diesel norm | Only with a second stream family |
| Geofence: pumps, plazas, yards (Route, Infrastructure) | Platform-built | Fill at an unlisted pump | Flag the pump | Block a pump | — |
| FASTag (Infrastructure, money) | >98% of NH toll value [S43] | Toll vs route mismatch | Recover from settlement | — | — |
| E-way bill / ULIP (Compliance, Customer) | 140.6 M bills in Mar 2026; 129 APIs [S52], [S51] | Trip revenue vs cost | — | Lane benchmark | — |
| Fuel bill, typed → OCR (money) | Paper today | Bill vs tank delta | Hold the fuel card | — | — |
| Driver's side (Driver) | Not captured anywhere | Dispute recorded | Accept or reject | — | Wrong-flag rate cap |
| Camera (Camera) | Rare in the long tail | Visual check of a halt or fill | — | — | Second family unlocks L4 |

The ladder, with the bet-spec gates:

| Level | Example | Gate | Tier [A] |
|---|---|---|---|
| L1 Insight | Morning brief, flags, evidence, Ask | — | Free |
| L2 Deterministic action | Ask the driver; hold the fuel card; recover from settlement | Hold needs ≥ Likely; recover needs High or confirmed | Munshi ₹299 |
| L3 Corrective SOP | Block a pump; set a route diesel norm | — | Pro ₹499 |
| L4 Guardrail | Auto-hold a driver advance above ₹2,000 when a flag is High, with a one-tap owner override | High and ≥ 2 stream families | Autopilot ₹799 |
| L5 Autopilot | Self-closing daily settlement | Future | — |

### 3.3 Where competitors play, and the white space

| Player | Cells occupied | Highest rung |
|---|---|---|
| BlackBuck | Small trucks × payments, GPS, loads, loans [S96] | L2 on payments rails; little public AI [S96] |
| WheelsEye | Small/mid trucks × GPS, FASTag, fuel card [S74] | L1 |
| Fleetx | Mid/large × fuel, toll, trips, video, TMS [S82], [S85] | Claims "agentic TMS" [S86] |
| Intangles | Large fleets × uptime [S94], [S95] | L1–L3 (prediction plus suggestion) |
| LocoNav / Sensorise | SMB × GPS, video, scorecards [S93] | L1 (anomaly detection) |
| TransportBook / TransportKhata | Small trucks × books, no telemetry [S107] | Manual |
| RoaDo, LOBB, Vahak | Transporters × loads over WhatsApp [S108], [S109] | L4 in loads (AI agents auto-award bids) [S108] |

**White space:** small trucks × leakage and books, at L1–L4, built from fused existing streams with no new hardware. Second white space: the same ledger as a credit record (small trucks × finance). Nobody found in the memos joins the two.

### 3.4 Dropped candidates

| Candidate | Why dropped | Evidence |
|---|---|---|
| Load matching | Network effects favour incumbents | Vahak claims 20+ lakh businesses [S109]; BlackBuck has 963k operators [S96] |
| Predictive maintenance | Intangles is strong; the payoff for a small owner is slower | 500k+ vehicles, 41k+ operators [S95] |
| Compliance on autopilot | AIS-140 is a commodity floor and easy to copy | [S29], [S84] |
| Video-AI safety | Device and data costs don't fit the long tail; the ROI chain needs an insurer who pays | Proven in the US [S12], [S21]; not in India [S76] |
| Fuel card | Interchange is thin in India; Motive's card was 4% of revenue after ~3 years | [S5] |
| Insurance telematics now | IRDAI PAYD exists on paper; products are private-car; no CV programme found | [S65], [S66], [S76] |
| Mid/large trucks as the lead segment | Fleetx serves it; NBFCs hold the data in-house | [S82], [S64] |
| Buses (staff, school, intercity) | Lower books pain, and not researched | Judgment; see §12 |

---

## 4. Global: where the serious players are betting

| Player | Bet | Evidence |
|---|---|---|
| Samsara | A horizontal data platform, now adding AI agents. Its first agent is a safety coach | FY26 ARR ~$1.9 B, +30% in constant currency [S2]; 3,194 customers above $100k ARR [S1]; agent pricing not yet set: "first understand usage patterns" [S3] |
| Motive | The same platform, plus embedded finance (Motive Card) | ARR $501 M, +27% [S6]; Spend Management was 2%, 3% and 4% of revenue in 2023, 2024 and 9M 2025 [S5]; IPO filed Dec 2025 [S4], withdrawn Sep 2026 for a $1.3 B+ private raise [S7] |
| Geotab | Data-first, open marketplace, OEM connectors | 5 M subscriptions, 100 B data points a day [S8]; OEM network covers ">80% of leading global vehicle manufacturers" [S9] |
| OEM embedded (Ford Pro, GM) | Factory telematics as recurring software | Ford Pro has 840k paid subscriptions; software and services are 19% of EBIT [S14]; EBIT $6.8 B [S15]; Fleet for GM activates over the air on OnStar [S11] |
| Video-first (Lytx, Netradyne) | Video AI for safety and claims | Lytx: 5.5 M drivers, 311 B miles [S12]; Netradyne: 450k subscriptions, $90 M Series D [S13] |
| Data marketplaces (Wejo, Otonomo) | Sell OEM data feeds | Wejo: $8.4 M revenue, $159.3 M loss, administration in 2023 [S16]; Otonomo merged into Urgent.ly [S17] |
| Fintech (Corpay, WEX, TriumphPay) | Capture payment margin | Corpay Vehicle Payments $2.14 B revenue [S19]; WEX: 600k fleet customers [S18]; Triumph: $51.3 B brokered freight presented [S23] |
| Insurance (Nirvana, Progressive) | Price risk on telematics | Nirvana valued at $1.5 B [S20]; Progressive gives 3–15% discounts for ELD data [S21] and reportedly requires some applicants to install Motive devices [S22] |
| Autonomy (Aurora, Kodiak) | Driverless Class 8 on fixed lanes | Aurora aims to exit 2026 with 200 driverless trucks [S24] and talks of 30,000 by 2030 [S25]; Kodiak: 8 of 100 trucks delivered [S26]; TuSimple and Embark exited [S27], [S28] |

### The four disagreements, with our judgment

1. **OEM-embedded vs aftermarket.** Ford and GM say embedded wins [S14], [S11]. Geotab hedges with both [S9]. 82.7% of 2024-built vehicles ship with embedded telematics (a US-centric figure) [S30]. *Judgment:* embedded wins new light vehicles in mature markets. In India, small owners buy used trucks. About 0.67 M trucks are OEM-connected (Tata 5 lakh CVs [S49] plus Ashok Leyland 170k [S50]) against ~12.5 M trucks [S36]. The 2030 architecture for India is device-agnostic: aftermarket boxes, OEM APIs where they exist, and public rails.
2. **Video-first vs data-first.** Lytx and Netradyne against Geotab. *Judgment:* video is the revenue wedge where an insurer pays; data is the retention moat. Samsara and Motive have both converged on doing both. In India the insurer doesn't pay yet, so neither pure play has a small-fleet buyer. The buyer pays for rupees.
3. **Software vs fintech monetisation.** Motive and Nirvana bet on finance; Samsara stays on subscription. *Judgment:* fintech pays only where the platform controls the transaction (underwriting, freight payment) [S20], [S23]. Skimming interchange is slow: 4% of Motive's revenue [S5]. In India the controllable transaction is the used-CV loan.
4. **Horizontal platform vs vertical workflow.** Samsara (horizontal, IT buyers) against Kodiak and Atlas (vertical, oilfield sand) [S1], [S26]. *Judgment:* horizontal wins with enterprise IT buyers. India's owner-operators have no IT buyer, so a vertical workflow is the only way to get paid above the AIS-140 floor. Ours is the munshi's daily close.

---

## 5. Structural trends, with mechanism

| # | Trend | Mechanism | What it means in India |
|---|---|---|---|
| 1 | **Connectivity becomes a compliance floor** | Mandates (US ELD; India AIS-140) turn the box into a cost of doing business. Embedded telematics push its marginal price toward zero [S29], [S30] | Same direction, with a twist. The box is cheap (₹2,800–5,500 [S84]), but compliance is gamed: RTOs register vehicles "without physical installation" [S48]. Mandated data exists but is unreliable, so cross-checking streams has value |
| 2 | **Data earns only when tied to a workflow** | Samsara's and Geotab's data scale feeds benchmarks and AI inside a daily workflow [S2], [S8]. Wejo had the same data pitch with no workflow and died at $8.4 M revenue [S16] | The Indian small-fleet workflow is the munshi's books, not dispatch. An LLM interface over existing data makes a Hindi munshi cheap to run [A: no LLM price was researched] |
| 3 | **Safety video wins because insurance pays** | Accidents and claims dominate fleet risk cost. Video settles claims and changes behaviour. The insurer turns that into a discount [S12], [S21] | **Inverts.** No CV telematics pricing programme was found; IRDAI lists five obstacles [S76]. Without an insurer in the loop, the small owner bears the full device cost for a benefit he can't price |
| 4 | **Margin goes to whoever controls the money flow** | Payments scale with spend, not seats. Corpay earns about $1.07 B operating income on $2.14 B [S19]. TriumphPay sits inside freight settlement [S23] | **Shifts.** Fuel interchange is thin (an inference, not a sourced figure). The controllable flow is the used-CV loan: Shriram's AUM is ₹2.6 tn with CV at 45% [S55]; used-vehicle loans grow at a 15% CAGR vs 11% for new [S59] |
| 5 | **Mixed fleets keep aftermarket alive** | OEM data is free at install but covers only new vehicles of one brand. The EU Data Act forces OEMs to share user data, which weakens lock-in [S31] | Stronger in India. Small owners buy used. OEM-connected trucks are ~5% of the fleet (0.67 M of ~12.5 M) [S36], [S49], [S50]. Third-party access to OEM fuel data is unverified |
| 6 | **Public digital rails cut the cost of a per-truck ledger** | The government builds the rails once, so the marginal data cost per truck is near zero | India-specific. FASTag carries >98% of NH toll value [S43]; e-way bills reached 140.6 M in Mar 2026 [S52]; ULIP exposes 129 APIs [S51]; AA consent is at 28.9 cr fulfilled [S60]. In the US this data sits in private dongles |
| 7 | **Depot-charged, fixed-route light EVs go first; energy becomes a module** | Lower energy cost per mile and demand charges make charge scheduling worth paying for [S32], [S33] | Same direction, lighter vehicles. L5 e-3W penetration is >31% in FY26 [S71]; e-goods carriers sold 14,803 in FY25, +167% [S70]. Finance is the bottleneck: "banks are concerned about resale value" [S73] |

---

## 6. Hype, with the mechanism of failure

| # | Claim | Why it won't survive (especially in India) |
|---|---|---|
| 1 | **"AI agents will run the fleet"** | The leader hasn't priced its agent and will "first understand usage patterns" [S3]. Fleet operators' concern about data integration rose from 38.1% to 71.0% in a year [S34]. Agents need clean inputs. India's inputs are gamed (AIS-140 [S48]) and coarse (CAN fuel steps [S75]). An agent acting on a bad flag hits a driver's pay, so autonomy has to be gated by stream agreement, not shipped as a default |
| 2 | **Driverless trucks as a 5-year planning input** | Aurora's 2026 fleet is a few trucks on fixed Texas lanes [S24]. It depends on hub-to-hub interstates, dry weather and permissive state law. Indian highways have mixed traffic and no AV framework (an inference). TuSimple and Embark show how fast capital leaves pre-revenue autonomy [S27], [S28] |
| 3 | **OEM data marketplaces as a standalone business** | Buyers want outcomes, not raw feeds [S16], [S17]. In India, AIS-140 data goes to government servers, not to a market (memo claim, unsourced) |
| 4 | **A fleet fuel card as the main revenue line** | Even Motive got to only 4% of revenue [S5]. In India, payments are commoditised by UPI and fuel retail margins are thin (inference, no sourced figure) |
| 5 | **Rapid heavy-truck electrification in India** | PM E-DRIVE funds 5,643 e-trucks with ₹500 crore [S35]. That is a pilot, not a transition, against ~12.5 M trucks [S36] |
| 6 | **Satellite (GNSS) tolling replacing FASTag soon** | NHAI said on 18 Apr 2025 that there is no nationwide satellite tolling [S45]. It runs ANPR-FASTag free-flow pilots instead (Daulatpura, Jun 2026) [S46]. FASTag remains the toll stream to build on |

---

## 7. India: structure and the inversions

### 7.1 Market shape and cost

- ~12.5 M trucks and ~3.5 M operators; 75% of operators own fewer than 5 trucks (RedSeer, in the Zinka prospectus) [S36]. MoRTH's last Year Book figure is 14.29 M registered goods vehicles (2020) [S37].
- Road carries "nearly 70%" of domestic freight [S38].
- **Fuel is the biggest line.** It is ~55% of operating cost (IISD/IRADe, 2012) [S39] or 45–55% (IFTRT, via Fleetx) [S41]. A 2025 per-km split for heavy trucks: fuel ₹10.5–12, tolls ₹3.5–5 and driver plus helper ₹2.5–3, out of ₹18.5–22.8 [S40].

### 7.2 Leakage evidence (soft)

Say it plainly: **the leakage number is soft.**
- The only recurring figure is "about 8 percent of all fuel filled", from MotorIndia, quoted by a vendor blog [S41]. We couldn't trace the MotorIndia original.
- "10 and 20 percent" of fuel spend comes from an opinion column [S42]. 24–37% is vendor marketing that includes inefficiency (cited in the memo, no separate source).
- No academic, rating-agency or small-fleet study was found.
- Illustration only: 8% of ₹12/km over 10,000 km a month [A: utilisation] is ~₹9,600 per truck per month. That is material, if the 8% holds.

### 7.3 Digital rails

| Rail | Status | Source |
|---|---|---|
| FASTag | >98% of NH toll user fees; 5.9 cr active of 11.86 cr issued | [S43], [S44] |
| AIS-140 (VLTD) | CMVR 125H: public-service vehicles and national-permit goods carriers registered from 1 Jan 2019. A Fleetx blog claims a 31 Mar 2026 deadline for pre-2025 CVs. Enforcement is gamed | [S47], [S29], [S48] |
| E-way bill / ULIP | 140.6 M bills (Mar 2026), 139.08 M (Aug 2026). ULIP: 44 systems, 129 APIs, >1,800 fields | [S52], [S51] |
| Account Aggregator | 28.9 cr consents fulfilled to Jul 2025; ₹1.67 lakh cr disbursed via AA in FY25. OCEN ~70,000 loans, >₹1,600 cr in 2025 | [S60], [S61], [S62] |
| WhatsApp | 500 M+ users in India. Utility message ₹0.145 outside the 24-hour service window from 1 Jan 2026; free inside it | [S53], [S54] |

### 7.4 Credit

- Shriram Finance: AUM ₹2.6 tn, CV 45.05%, CV Stage 3 4.79%; about a quarter of organised used-CV finance [S55].
- Cholamandalam: Stage 3 3.35% (Sep 2025) [S56]. Mahindra Finance: Stage 3 3.7% (Mar 2025) [S57]. Tata Motors Finance merged into Tata Capital [S58].
- NBFC vehicle-loan AUM is heading to ₹11 tn by FY27. Used-vehicle loans grew at a 15% CAGR over FY20–25, vs 11% for new [S59].
- BlackBuck's NBFC says real-time data "enables faster underwriting" [S64], but it kept the data in-house. Its lending revenue was ₹5.34 cr in FY25 [S98]. No lender paying a third party for telematics data was found.
- RBI's Digital Lending Directions of 8 May 2025 govern referral and lending-service partners [S63].

### 7.5 Insurance

IRDAI allowed pay-as-you-drive and pay-how-you-drive add-ons in Jul 2022 [S65]. A Jun 2024 master circular reportedly makes PAYD a mandatory first-offer option [S66]. Yet IRDAI itself lists five obstacles [S76], the market was USD 151.2 M in 2024 [S67], and the products found are private-car. **No commercial-vehicle telematics pricing programme was found.**

### 7.6 DPDP

Penalties go up to ₹250 cr. The Rules were notified on 13 Nov 2025. Consent-manager registration starts after 12 months, most obligations after 18 months [S68]. Account Aggregators may become "white-label" consent managers [S69]. Owner-consented sharing of a ledger with a lender fits this model. Driver data (location, disputes) is personal data and needs its own consent.

### 7.7 EV fleets

FY25: 609,762 e-3W passenger units, 14,803 e-goods carriers (+167%) and 3,570 e-buses (−3%) [S70]. L5 e-3W penetration is above 31% in FY26 [S71]. NITI/RMI put the EV finance opportunity at ₹3.7 lakh cr by 2030 [S72]; another source cites a gap above ₹10 lakh cr [S73].

### 7.8 The five inversions

| # | Inversion | Mechanism |
|---|---|---|
| 1 | **Rails before product** | The US got fleet data through private ELD dongles. India's state built FASTag, e-way bill, ULIP and AA first [S43], [S51], [S52], [S61]. A per-truck ledger can be assembled from public exhaust plus existing boxes, with no proprietary hardware |
| 2 | **Used-asset credit is the core, not the tail** | Most operators are tiny [S36] and buy used. Used-CV loans outgrow new [S59]. Western fleet software monetises new-truck OEM data. India's monetisable moment is the second-hand loan, where no OEM data exists |
| 3 | **Consent is a regulated API** | AA and DPDP's consent-manager role [S68], [S69] make "share my ledger with a lender" a standard, auditable act, not a bespoke data deal |
| 4 | **Distribution is WhatsApp, not an app** | 500 M+ users [S53] and ₹0.145 per utility message [S54]. No install, no new habit. LOBB and RoaDo already run transport operations on it [S108] |
| 5 | **Enforcement gaps are the opening** | AIS-140 is gamed [S48]. Satellite tolling was shelved [S45]. Top-down mandates stall, so a voluntary data layer that pays the operator back can win where they don't |

---

## 8. Competitors and pricing

| Player | Segment | Job | Monetisation | Price | AI angle |
|---|---|---|---|---|---|
| BlackBuck (Zinka) | Small operators; 963k, 27.5% of India's [S96] | Toll and fuel payments, GPS, loads, used-truck loans | Payments plus telematics were 94.53% of FY24 revenue [S96]; Q4 FY26 core revenue ₹525.46 cr [S97] | GPS plus 1-year plan ₹2,690–3,540 [S99] | Little public claim |
| WheelsEye | Small/mid owners | GPS, FASTag, fuel card | Software subscriptions ₹152.7 cr, ~62% of revenue (FY25) [S74] | ₹2,799–3,850 with 1 year [S87], [S88] | None public |
| Fleetx | Mid-market and enterprise | Fuel AI, toll, trips, video, TMS | SaaS; FY25 revenue ₹79.7 cr, loss ₹34.4 cr [S82]; Series C ₹113 cr [S83] | ₹300–600/vehicle/month entry [S85] | "Agentic TMS", AI truck routes [S86] |
| LocoNav → Sensorise | SMB; 2W/3W OEM | GPS, video, scorecards | Device plus subscription; FY25 ₹43.2 cr [S92]; India ops sold Oct 2025 [S93] | ₹2,184–4,539 [S91] | Eagle.ai anomaly detection [S93] |
| Intangles | OEMs, large fleets | Predictive maintenance | FY25 ₹75.1 cr, loss ₹70.9 cr [S94] | Not public | "95% accuracy, a month in advance" (memo claim) |
| TransportBook / TransportKhata | 1–20 truck owners | Trip khata, bilty, P&L | Freemium | ₹4,999/yr; ₹8k–25k/yr [S107] | None public |
| RoaDo / LOBB / Vahak | Transporters, brokers | Loads, WhatsApp ops | SaaS, marketplace | Vahak free | RoaDo AI agents run reverse auctions [S108] |
| Porter | Intra-city LCV | Load matching | Commission; FY25 ₹4,306 cr, profit ₹55.3 cr [S103] | Commission | n/a |
| Samsara / Motive (global) | US mid-market and enterprise | Platform, safety, spend | Subscription; Motive adds card [S5] | Not found | Safety coach agent [S3] |
| Verizon Connect (global) | US SMB to enterprise | Tracking | Subscription | ~$25/vehicle/month [S10] | n/a |

### The three gaps for the 1–20 truck operator

1. **No service after the sale.** A WheelsEye Play Store review says tracking "worked properly during the trial period, but after payment, all tracking stopped" [S89]. A Voxya complaint says the firm asked a customer "to recharge for the next year before agreeing to fix the device" [S90]. *Caveat:* these are two anecdotes against a 4.6-star app with 40k reviews, not a measured rate.
2. **Hardware-first distribution excludes the long tail.** "80% of the Indian market is small truck owners (1-5 truck fleet), and they don't understand vehicle telematics" [S105]. RoaDo says asking owners of one or two trucks to install and maintain a GPS device "is simply not practical" [S106]. AIS-140 is bought for compliance, not value.
3. **Nobody closes the loop to rupees.** GPS vendors sell location and FASTag. Khata apps hold the trip books with no telemetry [S107]. Fuel reconciliation needs an ₹8,000–12,500 sensor [S104] plus monthly software, which small owners don't buy. "Which trip lost money and why" has no owner.

### Willingness-to-pay anchors

| What | Price | Source |
|---|---|---|
| Basic GPS, device plus 1 year | ₹2,184–3,850 | [S91], [S99], [S87], [S88] |
| GPS renewal from year 2 | ₹1,000–2,500/yr (≈₹100–200/month) | Memo summary; no single quote |
| AIS-140 hardware | ₹2,800–5,500 | [S84] |
| Fuel sensor | ₹8,000–12,500 hardware; ₹400–750/month software (snippet) | [S104] |
| Mid-market SaaS | ₹300–600/vehicle/month | [S85] |
| Munshi software | ₹4,999/yr to ₹8k–25k/yr | [S107] |

**Implication:** a small owner already pays roughly ₹150–300 per truck per month across GPS and khata (memo estimate). A ₹299 Munshi tier [A] sits inside that spend only if it needs no new hardware.

---

## 9. Bytebeam and SuprFleet: what is public

- **Product:** the GitHub org describes a "pluggable and customizable platform for connected devices": rumqtt, uplink (OTA, commands, offline buffering) and device SDKs. None of its 37 repos is named SuprFleet or SuprNova [S77].
- **Funding:** a $3 M seed in May 2022 from Together, Accel and STRIVE [S78]; trackers show $3.25 M in total [S81]. A 2025 round appeared in one snippet with no primary source. Treat it as unverified.
- **Customers named on the site:** Matter, River, Royal Enfield, Simple, Lectrix, Exponent, Zypp Electric, Lohum, Ecozen, Kalyani and others [S79]. These are EV 2W OEMs, batteries and chargers. No truck or CV OEM is named.
- **Positioning:** the careers page says "building the control plane for connected fleets at scale" [S80]. The brief says "building an AI-native platform for Indian commercial fleets" [S110].
- **SuprFleet and SuprNova have no public footprint.** No page, app listing or press mention was found. The brief's "~1 million vehicles" [S110] can't be checked publicly. If it is accurate, it is probably mostly OEM-connected scooters.

### Why trucks?

1. **The brief points there.** "Indian commercial fleets", with cargo/commercial listed first [S110].
2. **Money density.** A heavy truck burns ₹10.5–12 of diesel per km [S40]. A leak on that line is worth thousands of rupees per truck per month (see §7.2), which an owner will act on.
3. **The credit hook is large and under-informed.** Used-CV lending is big and growing [S55], [S59], and lenders carry 3.35–4.79% Stage 3 [S55]–[S57] without operating data.
4. **The long tail is unserved.** 75% of operators run fewer than 5 trucks [S36]; incumbents sell hardware and renewals.
5. **The streams exist without new hardware.** AIS-140 boxes, FASTag and e-way bills are already in place [S43], [S47], [S52].

**The risk against it:** Bytebeam has no public truck customers. Distribution into trucks is unproven. This is the largest open risk in the bet.

### EV phase-2 logic

Bytebeam's real base is EV 2W/3W OEMs and Zypp [S79]. L5 e-3W is above 31% penetration [S71], and e-goods carriers grew 167% [S70]. The binding constraint on EV fleet growth is finance, and "banks are concerned about resale value" [S73]. The same verified ledger, with battery health added, becomes a resale and finance record. Bytebeam already handles battery-adjacent telemetry for customers like Lohum (an inference from the customer list). We put EV second because the phase-1 job is diesel leakage, which EVs don't have. The EV ledger is built on earnings and battery health instead, and the buyer is a concentrated fleet operator, not a long tail.

---

## 10. Hypotheses H1–H7

All seven are **untested by field calls**. Verdicts use bet-spec wording.

| # | Hypothesis | Evidence FOR | Evidence AGAINST | Verdict |
|---|---|---|---|---|
| H1 | Leakage is material for small fleets | Fuel is 45–55% of cost [S39], [S41]; ~8% of diesel filled [S41]; 10–20% in an opinion column [S42] | No primary or small-fleet study; the 8% is a citation of a citation; higher figures are vendor marketing | Supported, but the number is soft (~8% oft-cited; vendor 10–37%) |
| H2 | Owners act on a daily WhatsApp brief | 500 M+ WhatsApp users [S53]; transport ops already run on WhatsApp [S108]; TransportBook claims 10 lakh+ transporters [S107] | Nothing measures action rates; small owners "don't understand vehicle telematics" [S105] | Untested. No evidence either way, so it's an assumption. The pilot measures it |
| H3 | Small operators' software WTP is low | GPS renewals are only ₹1,000–2,500/yr (memo summary) | WheelsEye earns ₹152.7 cr from subscriptions [S74]; owners pay ₹4,999–25k/yr for khata apps [S107] | Partly contradicted: they pay ₹150–300 per truck per month for GPS plus khata. Paying for bookkeeping is unproven |
| H4 | Lenders value verified per-truck cash flow | CV Stage 3 3.35–4.79% [S55]–[S57]; used loans growing fastest [S59]; BlackBuck's NBFC says data speeds underwriting [S64]; ₹1.67 lakh cr via AA [S61] | No lender found paying a third party for telematics data; BlackBuck kept its data in-house [S64] | The direction is supported. No evidence of a lender paying a third party, so the model is a lending partnership |
| H5 | Factory fuel data is enough without a sensor | OEM telematics is standard on new M&HCVs [S49], [S50] | CAN fuel steps of 10–40 L (generic patent) [S75]; ~0.67 M OEM-connected vs ~12.5 M trucks [S36]; small owners buy used; API access unverified | Weak: CAN steps are 10–40 L. Hence stream fusion and honest confidence |
| H6 | Flags that skip the driver's side drive drivers away | None found in research | None found in research | Untested. Kept as the guardrail metric |
| H7 | Insurers would price on telemetry (India) | IRDAI allowed PAYD/PHYD in 2022 [S65] and reportedly made PAYD a first offer in 2024 [S66] | Five obstacles named by IRDAI [S76]; products are private-car; no CV programme found | Weak now. Phase 3 |

---

## 11. Cost-to-serve inputs

Per truck per month. Only the WhatsApp unit price is sourced. Everything else is an assumption [A] from bet-spec.

| Item | Basis | Cost | Label |
|---|---|---|---|
| WhatsApp utility messages | ~30 messages [A] × ₹0.145 [S54] | ₹4 | Price sourced; volume assumed. Messages inside a 24-hour window the owner opens are free [S54], so this may be lower |
| LLM (Gemini Flash) | ~40 answers | ₹15 | [A], no LLM price researched |
| Ingestion, storage, compute | — | ₹25 | [A] |
| Bill OCR | ~20 bills | ₹4 | [A] |
| Support, amortised | — | ₹30 | [A], probably the most uncertain line |
| **Total** | | **≈ ₹78** | Guardrail: under ₹100 |

At ₹299 (Munshi) that is roughly a 74% gross margin [A]. The Free tier costs about ₹936 per truck per year [A]. It is meant to be funded by lending referrals: 0.5–1.5% of a ₹10 lakh used-truck loan is ₹5,000–15,000, which covers 5–16 years of Free [A; DSA payout ranges are unverified].

---

## 12. Open questions, and what would change our mind

| Question | What would change our mind |
|---|---|
| Is leakage really material for 1–20 truck fleets? | Pilot data showing ₹ recovered per truck per month below the ₹299 Munshi price would kill paid tiers for small fleets |
| Do owners act on a morning brief? | Brief opened on fewer than 60% of mornings [A: bet-spec launch criterion] across 3 pilots means the WhatsApp-first channel is wrong |
| Can flags be right often enough? | A wrong-flag rate at or above 10% (bet-spec guardrail) means we stay at L1 and don't let money move |
| Will a lender partner? | No NBFC signed in phase 2 leaves the Free tier unfunded. Fall back to paid-only, or sell through AIS-140 device vendors |
| Can we read OEM fuel data? | If third-party API access is closed, rely on GPS, FASTag, e-way bill and bill OCR; confidence caps lower |
| What is the SuprNova base made of? | If it holds AIS-140 truck devices, GTM step 1 is strong. If it is all EV 2W, phase-1 distribution starts from zero, and EV may need to move first |
| Does IRDAI CV telematics insurance arrive? | A live CV PAYD product would pull insurance from phase 3 forward and revive the video case |
| Buses | Not researched. A field check on school-bus compliance pain could reopen that row |
| DPDP timing | Consent-manager registration lands around Nov 2026 [S68]. Lender sharing has to be designed for it from day one |
| Field truth | The brief asks for at least one real call. None was made. One owner call and one NBFC call should come before the panel |

---

## 13. Sources

All entries come from search-result snippets. **Status: UNVERIFIED** unless noted. Quotes are verbatim from the snippet, not from the opened page. Where a quote uses wording we avoid in our own prose, that is source wording, kept as found. "n.d." means no date was captured.

1. Samsara FY2026 Form 10-K. SEC, Mar 2026. https://www.sec.gov/Archives/edgar/data/1642896/000162828026018167/iot-20260131.htm — "approximately 85% of its ARR came from Core Customers". UNVERIFIED.
2. Samsara Q4/FY26 results. Business Wire, 5 Mar 2026. https://www.businesswire.com/news/home/20260305580818/en/ — "Samsara ended the year with $1.9 billion of ARR, an increase of 30% year-over-year in constant currency". UNVERIFIED.
3. Samsara Q4 FY26 earnings call highlights. Yahoo Finance, 6 Mar 2026. https://finance.yahoo.com/news/samsara-q4-earnings-call-highlights-085320405.html — "Samsara plans to first understand usage patterns before determining pricing". UNVERIFIED.
4. Motive files registration statement. Motive, 23 Dec 2025. https://gomotive.com/motive-files-registration-statement-for-proposed-initial-public-offering/ — "list its Class A common stock on the New York Stock Exchange under the symbol 'MTVE'". UNVERIFIED.
5. Motive Form S-1. SEC, Dec 2025. https://www.sec.gov/Archives/edgar/data/1646681/000162828025058773/motive-sx1.htm — "Spend Management contributed approximately 2%, 3%, and 4% to Motive's revenue". UNVERIFIED.
6. Motive S-1 analysis. Tom Tunguz, ~Dec 2025/Jan 2026. https://tomtunguz.com/motive-s-1/ — "Motive has $501M ARR with 27% ARR growth". UNVERIFIED.
7. Motive withdraws IPO. Renaissance Capital, Sep 2026. https://www.renaissancecapital.com/IPO-Center/News/121594/fleet-management-software-provider-motive-technologies-withdraws-ipo — "secured more than $1.3 billion in growth financing from General Catalyst". UNVERIFIED.
8. Geotab 5 million subscriptions. Geotab, 2025. https://www.geotab.com/press-release/geotab-5-million-subscriptions-milestone/ — "five million subscriptions producing over 100 billion data points daily". UNVERIFIED.
9. Geotab adds Polestar to OEM network. The EV Report, 2025. https://theevreport.com/geotab-adds-polestar-to-oem-telematics-network-for-global-fleets — "spans more than 80% of leading global vehicle manufacturers by fleet market share". UNVERIFIED.
10. Verizon Connect review. Expert Market, 2025. https://www.expertmarket.com/uk/vehicle-tracking/verizon-connect — "anchor price of approximately $25/vehicle/month". UNVERIFIED.
11. Fleet for GM. Verizon Connect/Telogis marketplace, n.d. https://spotlight.telogis.com/solutions/marketplace/fleet-for-gm/ — "activated over the air ... using the built-in OnStar hardware". UNVERIFIED.
12. The evolution of Lytx. FreightWaves, 2025. https://www.freightwaves.com/news/technololgy-the-evolution-of-lytx — "protecting more than 5.5 million drivers and analyzing more than 311 billion miles". UNVERIFIED.
13. Netradyne raises $90M. SiliconANGLE, 16 Jan 2025. https://siliconangle.com/2025/01/16/netradyne-raises-90m-encourage-safer-driving-ai-dashcams/ — "over 450,000 active subscriptions globally". UNVERIFIED.
14. Ford Pro paid software subscriptions surpass 800k. Ford Authority, Oct 2025. https://fordauthority.com/2025/10/ford-pro-paid-software-subscriptions-surpass-800k-mark/ — "Software and physical services combined grew 10% and now account for 19% of Ford Pro's EBIT". UNVERIFIED.
15. Ford Pro is generating $6.8 billion in EBIT. TIKR, 2026. https://www.tikr.com/blog/ford-pro-is-generating-6-8-billion-in-ebit-the-stock-is-priced-like-the-whole-company-is-losing-money — "Ford Pro generated more than $66 billion of revenue, with EBIT of $6.8 billion". UNVERIFIED.
16. Wejo sought to raise $7m before administration. Prolific North, 2023. https://www.prolificnorth.co.uk/news/wejo-collapsed-data-firm-sought-to-raise-7m-from-shareholders-to-unlock-google-cash-in-final-days-before-administration/ — "net revenue of $8.4 million and a net loss of $159.3 million". UNVERIFIED.
17. Connected car data shaping the automotive industry. Counterpoint Research, 2025. https://counterpointresearch.com/en/insights/connected-car-data-shaping-automotive-industry — "Otonomo merged into Urgent.ly in 2023". UNVERIFIED.
18. WEX FY2025 Form 10-K. SEC, Feb 2026. https://www.sec.gov/Archives/edgar/data/1309108/000130910826000010/wex-20251231.htm — "more than 600,000 fleet customers globally, reported revenue of $345.1 million". UNVERIFIED.
19. Corpay FY2025 Form 10-K. SEC, 2026. https://www.sec.gov/Archives/edgar/data/1175454/000117545426000018/flt-20251231.htm — "Vehicle Payments revenues were $2,138.7 million in 2025, an increase of 6.5%". UNVERIFIED.
20. AI insurer Nirvana raises $100M. FinTech Global, 2 Jan 2026. https://fintech.global/2026/01/02/ai-insurer-nirvana-raises-100m-to-see-value-surge-to-1-5bn/ — "The round values the company at $1.5 billion". UNVERIFIED.
21. Progressive brings UBI to commercial with Smart Haul. Digital Insurance, n.d. https://www.dig-in.com/news/progressive-brings-ubi-to-commercial-with-smart-haul — "discounts range between 3 and 15 percent to carriers that share ELD data". UNVERIFIED.
22. Progressive's mandatory ELD switch. FreightWaves, 2025. https://www.freightwaves.com/news/progressives-mandatory-eld-switch-some-small-trucking-fleets-may-be-required-to-switch-eld-providers — "required to purchase and install Motive telematics devices to proceed". UNVERIFIED.
23. Triumph Financial FY2025 Form 10-K. SEC, 2026. https://www.sec.gov/Archives/edgar/data/1539638/000153963826000007/tfin-20251231.htm — "approximately $51.3 billion in unique brokered freight transactions". UNVERIFIED.
24. Aurora Q2 2026 shareholder letter (8-K). SEC, 29 Jul 2026. https://www.sec.gov/Archives/edgar/data/0001828108/000182810826000075/aurora26q2shareholderlet.htm — "fully allocated to exit the year with 200 driverless trucks in operation". UNVERIFIED.
25. Aurora 2030 vision. Business Wire, 23 Sep 2026. https://secure.businesswire.com/news/home/20260923278327/en/ — "Scale to 30000 Driverless Trucks". UNVERIFIED.
26. Kodiak AI Form 424B3. SEC, 2026. https://www.sec.gov/Archives/edgar/data/0001853138/000162828026041930/kodiakaiinc-424b3.htm — "Atlas has taken delivery of eight Kodiak-powered driverless trucks, as part of an initial 100 truck order". UNVERIFIED.
27. Self-driving truck company closes US operations. IoT World Today, 2023. https://iotworldtoday.com/transportation-logistics/self-driving-truck-company-closes-us-operations — "reduce its US workforce by approximately 150 employees, or 75%". UNVERIFIED.
28. Embark Trucks shuts down. Robotics 24/7, 2023. https://www.robotics247.com/article/embark_trucks_shuts_down_amidst_uncertainty_in_autonomous_trucking_market/embark — "the capital markets have turned their backs on pre-revenue companies". UNVERIFIED.
29. AIS-140 guide. Fleetx blog, May 2026. https://blog.fleetx.io/blog-ais140-guide/ — "Commercial vehicles registered before January 2025 have to comply by March 31, 2026". UNVERIFIED (conflicts with [S47]).
30. OEM data vs aftermarket telematics in 2026. GPS Insight, 2026. https://www.gpsinsight.com/blog/oem-data-vs-aftermarket-telematics-whats-changing-in-2026/ — "82.7% of all vehicles manufactured in 2024 have embedded telematics". UNVERIFIED.
31. EU Data Act at Volvo Group. Volvo, 2025. https://www.volvogroup.com/en/tools/data-act.html — "From September 12, 2025, Regulation (EU) 2023/2854 (the 'Data Act') enables users ... to request access to the data". UNVERIFIED.
32. Geotab Sustainability Overview and EV Charge Monitoring. Geotab, 26 Feb 2025. https://www.geotab.com/press-release/geotab-sustainability-center — "manage charging queues efficiently, and make informed dispatch decisions". UNVERIFIED.
33. Fleet Electrification Guide 2026. Joint Charging, 2026. https://jointcharging.com/?p=4302 — "Depot charging with DC fast chargers (150–400 kW) remains the dominant model in 2026". UNVERIFIED.
34. AI adoption surges in fleets, but weak data infrastructure limits returns. Trucknews.com (Fleet Advantage survey), 2026. https://www.trucknews.com/technology/ai-adoption-surges-in-fleets-but-weak-data-infrastructure-limits-returns-fleet-advantage/1003214994/ — "Concerns about data integration rose from 38.1% in 2025 to 71.0% in 2026". UNVERIFIED.
35. Government launches e-truck incentive under PM E-DRIVE. Energetica India, Jul 2025. https://www.energetica-india.net/news/government-launches-inr-96-lakh-incentive-scheme-for-e-trucks-under-pm-e-drive — "support 5,643 e-trucks under the scheme with a total fund allocation of ₹500 crore". UNVERIFIED.
36. Zinka Logistics Solutions Ltd, Prospectus (RedSeer report). Axis Capital, Nov 2024. https://www.axiscapital.co.in/contents/Zinka-Logistics-Solutions-Limited-Prospectus.pdf — "India's trucking industry, comprising approximately 12.5 million trucks and 3.5 million operators... 75% of operators owning fewer than five trucks." UNVERIFIED.
37. MoRTH Road Transport Year Book. Dataful, 2020 data. https://dataful.in/datasets/1129 — "As of 2020, the number of registered goods vehicles in India was 14,288,261." UNVERIFIED.
38. Fast Tracking Freight in India. NITI Aayog/RMI, Jun 2021. https://www.niti.gov.in/sites/default/files/2021-06/FreightReportNationalLevel.pdf — "accounts for nearly 70% of domestic freight in India." UNVERIFIED.
39. Impacts of Diesel Price Increases on India's Trucking Industry. IISD/IRADe, 2012. https://irade.org/ffs_india_irade_trucking.pdf — "Fuel costs account for around 55 per cent of total operating costs." UNVERIFIED.
40. Truck cost calculator. FreightFox, 2025. https://www.freightfox.ai/blog/truck-cost-calculator-understand-the-real-cost-of-running-a-truck-in-india — "Fuel: ₹10.5 – ₹12.0/km; Driver & Helper Wages: ₹2.5 – ₹3.0/km; Toll & State Entry Fees: ₹3.5 – ₹5.0/km." UNVERIFIED.
41. Fuel monitoring system India: how much can fleet owners realistically save. Fleetx blog, 2025. https://blog.fleetx.io/fuel-monitoring-system-india-how-much-can-fleet-owners-realistically-save-per-vehicle/ — "originally from MotorIndia, is about 8 percent of all fuel filled in Indian trucks." UNVERIFIED.
42. India's commercial vehicle segment runs on fuel and guesswork. Autocar Professional (opinion), 2025. https://www.autocarpro.in/opinion-column/indias-commercial-vehicle-segment-runs-on-fuel-and-guesswork-134142 — "lose between 10 and 20 percent of their total fuel expenditure to theft and pilferage annually." (Source wording.) UNVERIFIED.
43. FASTag accounts for over 98 percent of toll collection on National Highways. Times Drive, citing MoRTH, 2025. https://www.timesdrive.in/news/fastag-accounts-for-over-98-percent-of-toll-collection-on-national-highways-morth-article-153531512/amp — "More than 98 percent of user fees on National Highways are now collected through the electronic toll collection system." UNVERIFIED.
44. 5.9 cr FASTags active, 11.86 cr issued. Business Standard, Feb 2026. https://www.business-standard.com/industry/news/nitin-gadkari-5-9-cr-fastags-active-india-11-86-cr-issued-so-far-126020401576_1.html — "5.9 crore FASTags active ... 11.86 crore issued." UNVERIFIED.
45. Clarifying the road ahead: no satellite-based tolling. Fox Mandal, Apr 2025. https://foxmandal.in/news/clarifying-the-road-ahead-no-satellite-based-tolling-fastag-continues/ — "press release dated April 18, 2025, clarifying that there is no decision to launch a nationwide satellite-based tolling system from May 1, 2025." UNVERIFIED.
46. India GNSS satellite toll system 2026. Odisha Plus, Jul 2026. https://odisha.plus/2026/07/india-gnss-satellite-toll-system-2026/ — "In June 2026, NHAI launched Rajasthan's first MLFF system at Daulatpura Toll Plaza." UNVERIFIED.
47. CMVR Rule 125H. Tripura Transport Department copy, 2018. https://transport.tripura.gov.in/pdf/CMVR125H.pdf — "all Public Service Vehicles and National Permit Goods Carriers registered on or after January 1, 2019." UNVERIFIED.
48. Plea in Bombay High Court alleges RTOs registering public vehicles without GPS trackers. Bar & Bench, 2025. https://www.barandbench.com/news/plea-in-bombay-high-court-alleges-rtos-registering-public-vehicles-without-gps-trackers-panic-buttons — "RTOs using manipulated or mismatched VLTD data to register vehicles without physical installation." UNVERIFIED.
49. Tata Motors connects 500,000 commercial vehicles with Fleet Edge. Mobility Outlook, 2024. https://mobilityoutlook.com/news/tata-motors-connects-500000-commercial-vehicles-with-fleet-edge — "connecting 5 lakh commercial vehicles with Fleet Edge." UNVERIFIED.
50. Ashok Leyland monitors over 170,000 connected vehicles. NewsBytes, 2025. https://www.newsbytesapp.com/news/auto/ashok-leyland-monitors-over-170000-connected-vehicles-using-ai-systems/tldr — "keeps an eye on over 170,000 connected vehicles." UNVERIFIED.
51. Backgrounder on ULIP. PIB, Aug 2025. https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/aug/doc2025816613701.pdf — "44 government systems, 11 ministries, and 129 APIs covering more than 1,800 data fields." UNVERIFIED.
52. E-way bills surge to all-time high of 140.6 million in March. IANS, Apr 2026. https://ianslive.in/e-way-bills-surge-to-all-time-high-of-1406-million-in-march--20260410172704 — "all-time high of 140.6 million." UNVERIFIED. (The Aug 2026 figure of 139.08 M appears in the memo without a separate source.)
53. Meta doubles down on WhatsApp Business in India. Storyboard18, 2024. https://www.storyboard18.com/how-it-works/meta-doubles-down-on-whatsapp-business-in-india-23713.htm — "its biggest market with over 500 million users." UNVERIFIED.
54. WhatsApp API new pricing. AiSensy, Jan 2026. https://m.aisensy.com/blog/whatsapp-api-new-pricing/ — "Utility messages cost ₹0.145 per message delivered." Meta primary to check: https://developers.facebook.com/docs/whatsapp/pricing. UNVERIFIED.
55. Credit rating rationale, Shriram Finance. India Ratings / CRISIL via IndiaBonds, 2025. https://www.indiabonds.com/credit-rating-rational-document/119933 — "AUM stood at INR2.6 trillion, with commercial vehicle (CV) financing accounting for 45.05%." UNVERIFIED.
56. Cholamandalam Investment reports Q2/H1 growth. FilingReader, 6 Nov 2025. https://filingreader.com/news-wire/mumbai/2025-11-06/cholamandalam-investment-finance-reports-strong-q2-h1-growth — "Stage 3 levels (90+ dues) at 3.35% as of September 25." UNVERIFIED.
57. Mahindra Finance Q4 FY25 results. Mahindra, 2025. https://www.mahindra.com/news-room/press-release/en/financial-results%E2%80%93quarter-4-FY25-standalone-and-consolidated-results — "Stage 3 assets stood at 3.7%." UNVERIFIED.
58. Rating rationale, Tata Capital. CRISIL, 20 Jun 2025. https://www.crisil.com/mnt/winshare/Ratings/RatingList/RatingDocs/TataCapitalLimited_June%2020_%202025_RR_371254.html — "consolidated AUM of ~Rs 2,21,950 crore (merged entity including erstwhile TMFL)." UNVERIFIED.
59. Vehicle loan AUM to touch Rs 11 trillion by FY27. Business Standard / CRISIL Ratings, Dec 2025. https://www.business-standard.com/finance/news/vehicle-loan-aum-to-grow-16-17-annually-touch-rs-11-trillion-by-fy27-crisil-ratings-125121000964_1.html — "Used vehicle loan AUM has clocked a compound annual growth rate of 15 per cent between FY20 and FY25, compared with 11 per cent for new vehicle loans." UNVERIFIED.
60. Strategies to boost AA success rates. Sahamati, Sep 2025. https://sahamati.org.in/wp-content/uploads/2025/10/Pragati-Session-__-Strategies-to-boost-AA-success-rates-__-10th-Sept-2025-__-Website-Update-1.pdf — "28.9 crore consents have been fulfilled cumulatively as of July 31, 2025." UNVERIFIED.
61. Account aggregators facilitating loan disbursement worth Rs 4,000 cr a month. DT Next, 2025. https://www.dtnext.in/amp/story/news/business/account-aggregators-facilitating-loan-disbursement-worth-rs-4000-cr-a-month-report-803942 — "₹1.67 lakh crore was disbursed via AA across 1.89 crore loan accounts in FY25." UNVERIFIED.
62. India's silent credit revolution: OCEN. iSPIRT, 2026. https://pn.ispirt.in/indias-silent-credit-revolution-ocen-surpasses-50000-loans-and-₹1100-crore-in-2025/ — "approximately 70,000 loans, resulting in over ₹1,600 Crore in disbursements." UNVERIFIED.
63. Guidelines on Digital Lending. RBI, 2 Sep 2022 (superseded 8 May 2025). https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12382 — "The original circular has been repealed... Reserve Bank of India (Digital Lending) Directions, 2025 dated May 8, 2025." UNVERIFIED.
64. BlackBuck Finserve infusion. Inc42, 2024. https://inc42.com/?p=506645 — "access to real-time behavioral and transactional data enables faster underwriting and loan disbursals." UNVERIFIED.
65. IRDAI allows innovative add-ons, floater policy for vehicle insurance. Reliance General / Economic Times, 7 Jul 2022. https://reliancegeneral.co.in/insurance/press-release/news-and-coverage/irdai-allows-innovative-add-ons,-floater-policy-for-vehicle-insurance-ceo-mr--rakesh-jain-the-economic-times-7-7-22.aspx — "circular dated 5 July 2022, permitted insurance companies to offer add-on concepts – called 'pay as you drive,' 'pay how you drive'." UNVERIFIED.
66. New IRDA rules for motor insurance. PersonalFN, Jun 2024. https://personalfn.com/dwl/Insurance/new-irda-rules-for-motor-insurance-speedy-claims-mandatory-pay-as-you-drive-and-fair-practices — "required to offer two options as the first choices... a pay-as-you-drive insurance cover." UNVERIFIED.
67. India insurance telematics market. IMARC, n.d. https://www.imarcgroup.com/india-insurance-telematics-market — "reached USD 151.2 Million in 2024." UNVERIFIED.
68. Digital Personal Data Protection Rules, 2025 notified. Mondaq, Nov 2025. https://www.mondaq.com/india/data-protection/1708164/digital-personal-data-protection-rules-2025-notified — "Rule 4 (Consent Manager registration) comes into force after 1 year; and Rules 3, 5–16, 22–23 become effective 18 months after." UNVERIFIED. (The ₹250 cr penalty cap is from the memo, with no separate quote.)
69. FIG Paper No. 40: draft DPDP Rules, implications for financial services. Cyril Amarchand Mangaldas, Jan 2025. https://corporate.cyrilamarchandblogs.com/2025/01/fig-paper-no-40-data-law-series-6-draft-digital-personal-data-protection-rules-2025-key-implications-for-financial-services-sector/ — "account aggregators have an opportunity to enter into a new line of business as 'white-label' consent managers." UNVERIFIED.
70. EV Annual Report Card FY2025. JMK Research, Apr 2025. https://jmkresearch.com/wp-content/uploads/2025/04/EV-Annual-Report-Card-FY2025_JMK-Research.pdf — "E-Bus sales in FY2025 reached 3,570 units"; "e-Goods Carrier recorded sales of 14,803 units." UNVERIFIED.
71. EV sales FY2025-26. EVReporter, 2026. https://evreporter.com/?p=31945 — "electric L5 three-wheelers... more than 31% market penetration in FY2025-26." UNVERIFIED.
72. India EV financing (NITI Aayog/RMI). Mercom, n.d. https://mercomindia.com/india-ev-financing-niti-ayog — "₹3.7 lakh crore (US$50 billion) by 2030." UNVERIFIED.
73. India's EV transition: Rs 10 lakh crore financing gap by 2030. Outlook Business, 2025. https://www.outlookbusiness.com/industry/india-ev-transition-2-23-lakh-crore-10-lakh-crore-financing-gap-2030 — "funding gap of over ₹10,30,000 crore." UNVERIFIED. (The "banks are concerned about resale value" line is attributed to this pair of sources in the memo, without a separate quote.)
74. WheelsEye posts Rs 243 Cr revenue in FY25. Entrackr, 2025. https://entrackr.com/fintrackr/wheelseye-posts-rs-243-cr-revenue-in-fy25-losses-remains-flat-11208516 (also cited as https://entrackr.com/?p=166631) — "revenue from software subscription services rose 20% to Rs 152.7 crore and accounted for nearly 62%." UNVERIFIED.
75. Sub-resolution fuel measurement (patent application 20220298985). Justia Patents, 2022. https://patents.justia.com/patent/20220298985 — "the volume of fuel that can fit between two adjacent sensors varies from ten liters near the bottom to forty liters near the top." UNVERIFIED. Generic design; not a measurement of Indian trucks.
76. India's insurance regulator endorses telematics to lower motor premiums. Insurance Business Asia, n.d. https://www.insurancebusinessmag.com/asia/news/regional-news/indias-insurance-regulator-endorses-telematics-to-lower-motor-premiums-75206.aspx — "IRDAI identified five obstacles to telematics-based insurance gaining mainstream acceptance." UNVERIFIED.
77. bytebeam. GitHub, n.d. https://github.com/bytebeamio — "Pluggable and customizable platform for connected devices". Status: page fetched by the research memo, the only page-level read. Re-check in the verification pass.
78. B2B startup Bytebeam raises funding to simplify IoT applications. Inc42, May 2022. https://inc42.com/buzz/b2b-startup-bytebeam-raises-funding-to-simplify-iot-applications/ — "raised $3 million in Seed funding from Together Fund, Accel and STRIVE VC". UNVERIFIED.
79. Bytebeam homepage. Bytebeam, n.d. https://bytebeam.io — "Matter, River, Inverted, Royal Enfield, Lohum, Bullwork, Lectrix, Exponent, Kalyani, Simple, NaArNi, Ecozen, and Zypp Electric". UNVERIFIED.
80. Bytebeam careers. Bytebeam, n.d. https://jobs.bytebeam.io — "building the control plane for connected fleets at scale". UNVERIFIED.
81. Bytebeam company profile. PitchBook/Tracxn, n.d. https://pitchbook.com/profiles/company/481857-58 — "raised a total of $3.25M over 3 funding rounds… Seed VC - III on September 7, 2022". UNVERIFIED.
82. Fleetx financials. Inc42, n.d. https://inc42.com/company/fleetx/financials/ — "from ₹60.1 Cr in FY24 to ₹79.7 Cr in FY25… net loss of ₹34.4 Cr". UNVERIFIED.
83. Fleetx raises 113 Cr in Series C. Fleetx, May 2025. https://fleetx.ai/fleetx-raises-113-cr-in-series-c — "Series C fundraise of Rs. 113 Cr led by existing investors IndiaMART Intermesh Limited and BEENEXT". UNVERIFIED.
84. AIS 140 GPS device price in India (2026). Fleetx blog, 2026. https://blog.fleetx.ai/blog-ais-140-gps-device-price-in-india-2026/ — "between ₹2,800 and ₹5,500 per vehicle for hardware alone". UNVERIFIED.
85. Fleet management software: the 2026 buyer's playbook. Fleetx blog, 2026. https://blog.fleetx.ai/fleet-management-software-the-2026-buyers-playbook/ — "Entry/small business tier typically costs INR 300 to 600 per vehicle per month". UNVERIFIED.
86. Fleetx launches AI-powered truck routes. ANI, 27 Nov 2025. https://aninews.in/news/business/fleetx-launches-ai-powered-truck-routes-… (URL truncated in the memo) — no snippet quote recorded. UNVERIFIED.
87. WheelsEye GPS tracking device, 1-year subscription. Flipkart, n.d. https://flipkart.com/wheelseye-gps-tracking-device-truck-vehicles-live-1-year-subscription/p/itmde79795440840 — "₹3,850". UNVERIFIED.
88. WheelsEye GPS with free 1-year subscription. Amazon.in, n.d. https://amazon.in/dp/B0CKX1XMXM — "₹2,799, marked down from an MRP of ₹4,999". UNVERIFIED.
89. FASTag, GPS, Fuel (WheelsEye operator app). Google Play, n.d. https://play.google.com/store/apps/details?id=com.wheelseyeoperator — "GPS worked properly during the trial period, but after payment, all tracking stopped". UNVERIFIED. A single user review.
90. Complaint against Wheelseye India Pvt Ltd. Voxya, 26 Jul 2023. https://voxya.com/consumer-complaints/not-sending-technician-to-resolve-device-issue/205623 — "asked him to recharge for the next year before agreeing to fix the device". UNVERIFIED. A single complaint.
91. India's best selling GPS trackers. LocoNav, n.d. https://loconav.com/gps-tracker — "Ride - Wired GPS Tracker: ₹2,184… Move - Wireless GPS Tracker: ₹4,539". UNVERIFIED.
92. LocoNav financials. Inc42, n.d. https://inc42.com/company/loconav/financials/ — "from ₹36.1 Cr in FY24 to ₹43.2 Cr in FY25… net loss of ₹1.5 Cr". UNVERIFIED.
93. Sensorise acquires LocoNav's India operations, unveils Eagle.ai. Autocar Professional, 14 Oct 2025. https://autocarpro.in/news/sensorise-acquires-loconavs-india-operations-… (URL truncated in the memo) — "over 10,000 customers and 150,000 active device subscriptions". UNVERIFIED.
94. Intangles financials. Inc42, n.d. https://inc42.com/company/intangles/financials/ — "from ₹62.5 Cr in FY24 to ₹75.1 Cr in FY25… net loss of ₹70.9 Cr". Series B reported by The Week/PTI, 7 Oct 2025 (no URL captured). UNVERIFIED.
95. Intangles US HQ announcement. Business Wire, 16 Sep 2026 (no URL captured) — "500,000+ vehicles for 41,000+ operators in 18 countries". UNVERIFIED.
96. Zinka Logistics Solutions files DRHP with SEBI. Bigul / BW Businessworld, Jul 2024. https://bigul.co/blog/zinka-logistics-solutions-filed-drhp-with-sebi-… (URL truncated in the memo) — "payments and telematics offerings contributed 94.53% to total revenue from continuing operations in Fiscal 2024"; "963,345 truck operators… 27.52%"; "356,050 average monthly active telematics devices". UNVERIFIED.
97. BlackBuck reports Rs 185 Cr revenue and Rs 66 Cr profit in Q4 FY26. Entrackr, May 2026. https://entrackr.com/fintrackr/blackbuck-reports-rs-185-cr-revenue-… (URL truncated in the memo) — "core revenue (payments and telematics) was INR 525.46 crore… growth businesses contributed INR 126.51 crore, up 266 percent". UNVERIFIED.
98. BlackBuck Ltd: when scale meets cash flow. The Loggical Investor (Substack), n.d. (no URL captured) — "Lending business (vehicle financing) revenue was Rs. 5.34 crore in FY25". UNVERIFIED.
99. BlackBuck Boss App GPS, 1-year plan. IndiaMART and Amazon.in, n.d. https://indiamart.com/proddetail/…26065728448.html (URL truncated in the memo); Amazon.in B0F9Y67B1Z — "₹ 3540/piece"; "₹2,690". UNVERIFIED.
100. Itriangle Infotech financials. Tofler, n.d. https://tofler.in/itriangle-infotech-private-limited/company/U72400KA2009PTC049414 — "₹66.2 crore for the financial year ending on March 31, 2025". UNVERIFIED.
101. Trinity Mobility profile. CB Insights, n.d. https://cbinsights.com/company/trinity-mobility — "annual revenue of $4.59 million… investors including Honeywell". UNVERIFIED.
102. Mahindra Logistics acquires Rivigo's B2B Express business for Rs 225 crore. Autocar Professional, 2022 (no URL captured) — no snippet quote recorded. UNVERIFIED.
103. Porter turns profitable with over Rs 4,000 Cr revenue in FY25. Entrackr, Sep 2025 (no URL captured) — "Rs 4,306.2 crore in FY25… net profit of Rs 55.3 crore". UNVERIFIED.
104. Fuel sensor listings and fuel tracking software. IndiaMART (Algotrack ₹10,500; Melta ₹12,500; GPS fuel sensor ₹8,000) and Watsoo, "Top 10 Fuel Tracking Software in India", n.d. (no URLs captured) — "INR 400 to INR 750 per month". UNVERIFIED.
105. India CV telematics. Automotive World, n.d. https://automotiveworld.com/?p=264732 — "80% of the Indian market is small truck owners (1-5 truck fleet), and they don't understand vehicle telematics". UNVERIFIED.
106. SIM-based tracking without GPS devices explained. RoaDo blog, n.d. https://roado.tech/blog/how-real-time-tracking-without-hardware-works-… (URL truncated in the memo) — "small transporters who own one or two trucks… is simply not practical". UNVERIFIED.
107. TransportBook and TransportKhata. transportbook.in and transportkhata.com, n.d. https://transportbook.in; https://transportkhata.com — "trusted by 10 Lakh+ Transporters"; "Premium plan at ₹4,999 per year"; "₹8,000… ₹15,000… ₹25,000 per year". UNVERIFIED.
108. LOBB WhatsApp Business story; RoaDo transporters page. WhatsApp and RoaDo, n.d. https://whatsapp.com/stories/business/India/lobb; https://roado.tech/in/solutions/transporters — "AI agents handling bid collection and auto-award". UNVERIFIED.
109. Vahak homepage; TruckBhejo profile. vahak.in and YourStory, Jul 2021. https://vahak.in — "20+ lakh transport businesses registered". UNVERIFIED.
110. SuprFleet PM take-home assignment brief. Bytebeam, received 2026. Local PDF (read in full) — "We're now building an AI-native platform for Indian commercial fleets"; "on the order of ~1 million vehicles". Status: primary document, read. Its claims about SuprFleet's base are not independently verified.
