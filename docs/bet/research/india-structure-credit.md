<!-- Fable research memo, 2026-10-07. Status: every source UNVERIFIED (search snippets; page fetches were blocked by the environment's network policy). To be verified before use. -->

## Research note: India market structure, credit and insurance

**Method caveat (important).** The session's egress proxy blocked `WebFetch` for every non-GitHub host I tried (MoRTH, PIB, RBI, SEBI, BSE, NPCI, IRDAI, Sahamati, Business Standard, Inc42, Mondaq, Autocar Pro, Fleetx, Wikipedia, archive.org, etc.). I could not open a single cited page. Everything below comes from `WebSearch` result extracts, which quote page text but are not a first-hand read. Treat every "verbatim" line as **"seen in search extract, not page-verified"**, and have someone with open web access spot-check the DRHP, the IRDAI circular and the Sahamati figures before they go in a deck.

### (a) Key facts

| Fact | Number | Src | Date |
|---|---|---|---|
| Trucks / operators in India | ~12.5 mn trucks, ~3.5 mn operators | 1 | Nov 2024 |
| Operators owning <5 trucks | 75% (RedSeer, in Zinka prospectus) | 1 | Nov 2024 |
| Alt. small-operator claim | "eighty per cent of truck operators... own less than five trucks" | 4 | 2012 |
| Registered goods vehicles (last Year Book figure) | 14,288,261 (2020) | 2 | 2020 |
| Road share of domestic freight | "nearly 70%"; 2.2 tn tonne-km | 3 | Jun 2021 |
| Fuel share of operating cost | ~55% (IISD/IRADe); 45–55% (IFTRT via 6) | 4, 6 | 2012 / 2025 |
| Per-km cost split, HDV | fuel ₹10.5–12; tolls ₹3.5–5; driver+helper ₹2.5–3 of ₹18.5–22.8 | 5 | 2025 |
| Fuel leakage estimates | ~8% of diesel filled (MotorIndia, oft-cited); "10 and 20 percent" (industry); 24–37% (vendor, incl. inefficiency) | 6, 7 | 2024–25 |
| FASTag share of NH toll | ">98 percent of user fees" via ETC | 8 | 2025 |
| FASTags active vs issued | 5.9 cr active of 11.86 cr issued | 9 | Feb 2026 |
| GNSS tolling | NHAI 18 Apr 2025: no nationwide satellite tolling; ANPR-FASTag MLFF pilots instead (Choryasi, UER-II, Daulatpura Jun 2026) | 10, 11 | 2025–26 |
| AIS-140 scope | CMVR 125H: public service vehicles and national-permit goods carriers regd. on/after 1 Jan 2019 | 12 | 2018 |
| AIS-140 enforcement | Bombay HC plea: RTOs "using manipulated or mismatched VLTD data to register vehicles without physical installation" | 13 | 2025 |
| OEM connected trucks | Tata Fleet Edge 5 lakh CVs; Ashok Leyland >170,000 connected | 14, 15 | 2024–25 |
| ULIP | 44 systems, 11 ministries, 129 APIs, >1,800 fields; 100 cr API transactions by Mar 2025 | 16 | Aug 2025 |
| E-way bills | record 140.6 mn in Mar 2026; 139.08 mn Aug 2026 | 17 | 2026 |
| WhatsApp India | "over 500 million users" (Meta's biggest market) | 18 | 2024 |
| WA utility message, India | ₹0.145/msg delivered outside service window (from 1 Jan 2026); free inside 24-h window; volume tiers since 1 Jul 2025 | 19 | 2026 |
| Shriram Finance | AUM ₹2.6 tn FYE25; CV 45%; CV GS3 4.79%; ~25% of organised used-CV finance | 20 | FY25 |
| Cholamandalam | AUM ₹2,27,770 cr; Stage 3 3.35% (Sep-25) | 21 | Q3 FY26 |
| Mahindra Finance | AUM ₹1,19,673 cr; GS3 3.7% | 22 | Mar 2025 |
| Tata Motors Finance | AUM ₹36,515 cr (Dec-24); merged into Tata Capital May 2025 (merged AUM ~₹2.22 lakh cr) | 23 | 2025 |
| NBFC vehicle-loan AUM | → ₹11 tn by FY27; used-vehicle loan CAGR 15% vs 11% new (FY20–25) | 24 | Dec 2025 |
| Account Aggregator | 28.9 cr consents (to 31 Jul 2025); 731 FIUs, 179 FIPs, 212 cr accounts; ~₹1.67 lakh cr disbursed via AA in FY25 | 25, 26 | 2025 |
| OCEN | ~70,000 loans, >₹1,600 cr in 2025 | 27 | 2026 |
| RBI digital lending | Guidelines 2 Sep 2022; superseded by Digital Lending Directions 8 May 2025 | 28 | 2025 |
| BlackBuck Finserve | 5,109 loans / ₹252.76 cr (to Jun 2024); 356,050 avg monthly active telematics devices FY24; 7.65 lakh monthly transacting operators Q4 FY25 | 29 | 2024–25 |
| IRDAI telematics add-ons | Circular 5 Jul 2022: PAYD, PHYD, floater (floater only 2W/private car); Jun 2024 master circular makes PAYD a mandatory first-offer option | 30, 31 | 2022 / 2024 |
| India insurance telematics market | USD 151.2 mn (2024) | 32 | 2024 |
| DPDP | Act penalties up to ₹250 cr; Rules notified 13 Nov 2025; consent-manager rule at 12 months, most obligations at 18 months | 33, 34 | 2025 |
| EV fleets FY25 | e-3W passenger 609,762; e-goods carriers 14,803 (+167%); e-bus 3,570 (-3%); L5 e-3W >31% penetration FY26 | 35, 36 | 2025–26 |
| EV finance gap | NITI/RMI: ₹3.7 lakh cr opportunity by 2030; >₹10 lakh cr gap cited; "banks are concerned about resale value" | 37, 38 | 2021–25 |

### (b) What this means for the bet

**H1 Leakage is material for small fleets — supported, but the number is soft.** Fuel is ~50% of cost (4, 5); the only recurring independent-ish figure is MotorIndia's ~8% of diesel filled (6); the 10–20% and 24–37% figures are vendor marketing (6, 7). No academic or rating-agency study found. 8% of a ~₹12/km fuel line on a 10,000 km/month truck is ~₹10k/month, which is material against single-truck margins. UNVERIFIED: no small-fleet-specific (<5 trucks) measurement exists.

**H3 Willingness to pay for software is low — weak (partly contradicted).** BlackBuck gets ~7.65 lakh operators to transact monthly on ₹427 cr revenue (≈₹460/operator/yr) — operators pay, but tiny amounts bundled with FASTag/fuel (29). WheelsEye books ₹152.7 cr subscription revenue, ~62% of its top line (39). Pay-for-GPS exists; pay-for-bookkeeping is unproven.

**H4 Lenders would pay for verified per-truck cash flow — supported in direction, unproven in price.** CV lenders carry 3.3–4.8% Stage 3 (20–22) and are growing used-vehicle books fastest (24). BlackBuck's own NBFC claims "access to real-time behavioral and transactional data enables faster underwriting" (29) — note it kept the data in-house rather than selling it. AA shows ₹1.67 lakh cr/yr of consent-based data lending (26). No evidence of any lender paying a third party for telematics data; no Wheelseye/Fleetx-financier tie-up found.

**H5 CAN/factory data is enough without a sensor — weak.** OEM telematics is now standard on new M&HCVs (14, 15) and Fleet Edge advertises "fuel loss alert". But the fleet is ~12.5 mn trucks against ~0.7 mn OEM-connected, and small operators buy used. Technical sources: CAN fuel level comes from float/ladder sensors with 10–40 L steps and dead-bands (40); capacitive add-ons quote <1% error. Third-party API access to OEM fuel data: UNVERIFIED.

**H7 Insurers price on telemetry — weak.** IRDAI opened PAYD/PHYD in 2022 and forced PAYD as a first offer in 2024 (30, 31), yet IRDAI itself lists five obstacles and the market is "nascent" (41); products found are private-car (ICICI Lombard–Citroën, Zuno). No CV telematics pricing programme found; BlackBuck only resells cover as a corporate agent (29).

### (c) India inversions

1. **Rails before product.** FASTag (>98% of toll), e-way bills (140 mn/month), AIS-140, ULIP's 129 APIs and AA consent all exist as public infrastructure, so a per-truck ledger can be assembled from government exhaust rather than from a proprietary dongle — the opposite of US ELD-led telematics.
2. **Used-asset credit is the core, not the tail.** ~75% of operators run <5 trucks (1), Shriram's largest book is pre-owned CVs (20), and used-vehicle loans outgrow new (24). Western fleet software monetises new-truck OEM data; India's monetisable moment is the second-hand loan, where no OEM data exists.
3. **Consent is a regulated API.** AA and DPDP's consent-manager role (34) make "share my ledger with a lender" a standardised, auditable act rather than a bespoke data deal.
4. **Distribution is WhatsApp at ₹0.145/message** (19) with 500 mn users (18) — no app install required.
5. **Enforcement gaps are the opportunity.** AIS-140 is widely gamed (13); GNSS tolling was pulled over privacy (10). A voluntary, operator-benefiting data layer can succeed where mandates stall.

### (d) Sources (all lines are from search extracts; page not opened — see caveat)

1. Zinka Logistics Solutions Ltd, Prospectus (RedSeer report), Nov 2024 — https://www.axiscapital.co.in/contents/Zinka-Logistics-Solutions-Limited-Prospectus.pdf — "India's trucking industry, comprising approximately 12.5 million trucks and 3.5 million operators... 75% of operators owning fewer than five trucks."
2. MoRTH Road Transport Year Book via Dataful — https://dataful.in/datasets/1129 — "As of 2020, the number of registered goods vehicles in India was 14,288,261."
3. NITI Aayog/RMI, Fast Tracking Freight in India, Jun 2021 — https://www.niti.gov.in/sites/default/files/2021-06/FreightReportNationalLevel.pdf — "accounts for nearly 70% of domestic freight in India."
4. IISD/IRADe, Impacts of Diesel Price Increases on India's Trucking Industry, 2012 — https://irade.org/ffs_india_irade_trucking.pdf — "Fuel costs account for around 55 per cent of total operating costs."
5. FreightFox, Truck cost calculator, 2025 — https://www.freightfox.ai/blog/truck-cost-calculator-understand-the-real-cost-of-running-a-truck-in-india — "Fuel: ₹10.5 – ₹12.0/km; Driver & Helper Wages: ₹2.5 – ₹3.0/km; Toll & State Entry Fees: ₹3.5 – ₹5.0/km."
6. Fleetx blog, Fuel Monitoring System India, 2025 — https://blog.fleetx.io/fuel-monitoring-system-india-how-much-can-fleet-owners-realistically-save-per-vehicle/ — "originally from MotorIndia, is about 8 percent of all fuel filled in Indian trucks."
7. Autocar Professional opinion, "India's CV segment runs on fuel and guesswork", 2025 — https://www.autocarpro.in/opinion-column/indias-commercial-vehicle-segment-runs-on-fuel-and-guesswork-134142 — "lose between 10 and 20 percent of their total fuel expenditure to theft and pilferage annually."
8. Times Drive citing MoRTH, 2025 — https://www.timesdrive.in/news/fastag-accounts-for-over-98-percent-of-toll-collection-on-national-highways-morth-article-153531512/amp — "More than 98 percent of user fees on National Highways are now collected through the electronic toll collection system."
9. Business Standard, Feb 2026 — https://www.business-standard.com/industry/news/nitin-gadkari-5-9-cr-fastags-active-india-11-86-cr-issued-so-far-126020401576_1.html — "5.9 crore FASTags active ... 11.86 crore issued."
10. Fox Mandal, Apr 2025 — https://foxmandal.in/news/clarifying-the-road-ahead-no-satellite-based-tolling-fastag-continues/ — "press release dated April 18, 2025, clarifying that there is no decision to launch a nationwide satellite-based tolling system from May 1, 2025."
11. Odisha Plus, Jul 2026 — https://odisha.plus/2026/07/india-gnss-satellite-toll-system-2026/ — "In June 2026, NHAI launched Rajasthan's first MLFF system at Daulatpura Toll Plaza."
12. CMVR Rule 125H (Tripura Transport copy) — https://transport.tripura.gov.in/pdf/CMVR125H.pdf — "all Public Service Vehicles and National Permit Goods Carriers registered on or after January 1, 2019."
13. Bar & Bench, 2025 — https://www.barandbench.com/news/plea-in-bombay-high-court-alleges-rtos-registering-public-vehicles-without-gps-trackers-panic-buttons — "RTOs using manipulated or mismatched VLTD data to register vehicles without physical installation."
14. Mobility Outlook, 2024 — https://mobilityoutlook.com/news/tata-motors-connects-500000-commercial-vehicles-with-fleet-edge — "connecting 5 lakh commercial vehicles with Fleet Edge."
15. NewsBytes, 2025 — https://www.newsbytesapp.com/news/auto/ashok-leyland-monitors-over-170000-connected-vehicles-using-ai-systems/tldr — "keeps an eye on over 170,000 connected vehicles."
16. PIB backgrounder on ULIP, Aug 2025 — https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/aug/doc2025816613701.pdf — "44 government systems, 11 ministries, and 129 APIs covering more than 1,800 data fields."
17. IANS, Apr 2026 — https://ianslive.in/e-way-bills-surge-to-all-time-high-of-1406-million-in-march--20260410172704 — "all-time high of 140.6 million."
18. Storyboard18, 2024 — https://www.storyboard18.com/how-it-works/meta-doubles-down-on-whatsapp-business-in-india-23713.htm — "its biggest market with over 500 million users."
19. AiSensy, WhatsApp pricing update, Jan 2026 — https://m.aisensy.com/blog/whatsapp-api-new-pricing/ — "Utility messages cost ₹0.145 per message delivered." (Meta primary: https://developers.facebook.com/docs/whatsapp/pricing)
20. India Ratings / CRISIL rationale on Shriram Finance, 2025 — https://www.indiabonds.com/credit-rating-rational-document/119933 — "AUM stood at INR2.6 trillion, with commercial vehicle (CV) financing accounting for 45.05%."
21. FilingReader, Chola Q2/H1 FY26, Nov 2025 — https://filingreader.com/news-wire/mumbai/2025-11-06/cholamandalam-investment-finance-reports-strong-q2-h1-growth — "Stage 3 levels (90+ dues) at 3.35% as of September 25."
22. Mahindra Finance Q4 FY25 press release — https://www.mahindra.com/news-room/press-release/en/financial-results%E2%80%93quarter-4-FY25-standalone-and-consolidated-results — "Stage 3 assets stood at 3.7%."
23. CRISIL rating rationale, Tata Capital, Jun 2025 — https://www.crisil.com/mnt/winshare/Ratings/RatingList/RatingDocs/TataCapitalLimited_June%2020_%202025_RR_371254.html — "consolidated AUM of ~Rs 2,21,950 crore (merged entity including erstwhile TMFL)."
24. Business Standard / CRISIL Ratings, Dec 2025 — https://www.business-standard.com/finance/news/vehicle-loan-aum-to-grow-16-17-annually-touch-rs-11-trillion-by-fy27-crisil-ratings-125121000964_1.html — "Used vehicle loan AUM has clocked a compound annual growth rate of 15 per cent between FY20 and FY25, compared with 11 per cent for new vehicle loans."
25. Sahamati, AA adoption update, Sep 2025 — https://sahamati.org.in/wp-content/uploads/2025/10/Pragati-Session-__-Strategies-to-boost-AA-success-rates-__-10th-Sept-2025-__-Website-Update-1.pdf — "28.9 crore consents have been fulfilled cumulatively as of July 31, 2025."
26. DT Next / Sahamati report, 2025 — https://www.dtnext.in/amp/story/news/business/account-aggregators-facilitating-loan-disbursement-worth-rs-4000-cr-a-month-report-803942 — "₹1.67 lakh crore was disbursed via AA across 1.89 crore loan accounts in FY25."
27. iSPIRT, OCEN 2025 — https://pn.ispirt.in/indias-silent-credit-revolution-ocen-surpasses-50000-loans-and-₹1100-crore-in-2025/ — "approximately 70,000 loans, resulting in over ₹1,600 Crore in disbursements."
28. RBI, Guidelines on Digital Lending, 2 Sep 2022 — https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12382 — "The original circular has been repealed... Reserve Bank of India (Digital Lending) Directions, 2025 dated May 8, 2025."
29. Inc42, BlackBuck Finserve infusion, 2024 — https://inc42.com/?p=506645 — "access to real-time behavioral and transactional data enables faster underwriting and loan disbursals."
30. Reliance General / ET, 7 Jul 2022 — https://reliancegeneral.co.in/insurance/press-release/news-and-coverage/irdai-allows-innovative-add-ons,-floater-policy-for-vehicle-insurance-ceo-mr--rakesh-jain-the-economic-times-7-7-22.aspx — "circular dated 5 July 2022, permitted insurance companies to offer add-on concepts – called 'pay as you drive,' 'pay how you drive'."
31. PersonalFN on IRDAI master circular, Jun 2024 — https://personalfn.com/dwl/Insurance/new-irda-rules-for-motor-insurance-speedy-claims-mandatory-pay-as-you-drive-and-fair-practices — "required to offer two options as the first choices... a pay-as-you-drive insurance cover."
32. IMARC, India insurance telematics market — https://www.imarcgroup.com/india-insurance-telematics-market — "reached USD 151.2 Million in 2024."
33. Mondaq, DPDP Rules notified, Nov 2025 — https://www.mondaq.com/india/data-protection/1708164/digital-personal-data-protection-rules-2025-notified — "Rule 4 (Consent Manager registration) comes into force after 1 year; and Rules 3, 5–16, 22–23 become effective 18 months after."
34. Cyril Amarchand Mangaldas, FIG Paper 40, Jan 2025 — https://corporate.cyrilamarchandblogs.com/2025/01/fig-paper-no-40-data-law-series-6-draft-digital-personal-data-protection-rules-2025-key-implications-for-financial-services-sector/ — "account aggregators have an opportunity to enter into a new line of business as 'white-label' consent managers."
35. JMK Research, EV Annual Report Card FY2025 — https://jmkresearch.com/wp-content/uploads/2025/04/EV-Annual-Report-Card-FY2025_JMK-Research.pdf — "E-Bus sales in FY2025 reached 3,570 units"; "e-Goods Carrier recorded sales of 14,803 units."
36. EVReporter, FY2025-26 — https://evreporter.com/?p=31945 — "electric L5 three-wheelers... more than 31% market penetration in FY2025-26."
37. Mercom citing NITI Aayog/RMI — https://mercomindia.com/india-ev-financing-niti-ayog — "₹3.7 lakh crore (US$50 billion) by 2030."
38. Outlook Business, 2025 — https://www.outlookbusiness.com/industry/india-ev-transition-2-23-lakh-crore-10-lakh-crore-financing-gap-2030 — "funding gap of over ₹10,30,000 crore."
39. Entrackr, WheelsEye financials — https://entrackr.com/?p=166631 — "revenue from software subscription services rose 20% to Rs 152.7 crore and accounted for nearly 62%."
40. Justia patent, Sub-resolution fuel measurement — https://patents.justia.com/patent/20220298985 — "the volume of fuel that can fit between two adjacent sensors varies from ten liters near the bottom to forty liters near the top."
41. Insurance Business Asia — https://www.insurancebusinessmag.com/asia/news/regional-news/indias-insurance-regulator-endorses-telematics-to-lower-motor-premiums-75206.aspx — "IRDAI identified five obstacles to telematics-based insurance gaining mainstream acceptance."

**Gaps / UNVERIFIED:** no small-fleet-specific leakage study; no third-party lender paying for telematics data; no CV telematics insurance programme; OEM fuel-data API access terms; post-2020 MoRTH goods-vehicle count; exact DRHP wording on "<5 trucks" (needs a first-hand read of source 1).