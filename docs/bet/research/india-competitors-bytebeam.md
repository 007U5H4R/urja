<!-- Fable research memo, 2026-10-07. Status: every source UNVERIFIED (search snippets; page fetches were blocked by the environment's network policy). To be verified before use. -->

## Research memo: India fleet-tech competitors, pricing, Bytebeam

**Method caveat (read first).** This sandbox's egress proxy blocked every news, company, filing, marketplace and app-store host I tried (bytebeam.io and subdomains, Entrackr, Inc42, NSE/BSE PDFs, Flipkart, Amazon, Play Store, Voxya, LocoNav, Fleetx, etc.). Only github.com and WebSearch got through. So, except for source [1] and the local repo file [35], every quoted line below comes from a search-result snippet of the cited page, not from opening it. By your own rule these are **UNVERIFIED-by-fetch**; treat them as leads to open on a normal connection before citing in the deck.

### (a) Competitor table

| Player | Segment | Core job | Monetization | Price point | AI angle | Src |
|---|---|---|---|---|---|---|
| **BlackBuck (Zinka)** | Small truck operators, pan-India (963k operators, 27.5% of India's, FY24) | Tolling/fuel payments, GPS, loads, used-truck loans | Payments + telematics = 94.5% of revenue (FY24); FY26 revenue ₹652 Cr, PAT ₹160 Cr | GPS + 1-yr plan ₹2,690–₹3,540 | Little public AI claim | 21, 22, 24 |
| **WheelsEye** | Small/mid truck owners | GPS + FASTag + fuel card | Software subscription ₹152.7 Cr (62% of ₹243.4 Cr FY25); bundled GPS ₹62 Cr; loss ₹47 Cr | Truck GPS + 1-yr ₹3,850 (Flipkart); ₹2,799 (Amazon) | None public | 11, 12, 13 |
| **Fleetx** | Mid-market/enterprise (cement, FMCG, steel); "2,000+ customers" | Fuel AI, FASTag/toll, trip, video telematics, TMS | SaaS; FY25 revenue ₹79.7 Cr, loss ₹34.4 Cr; Series C ₹113 Cr (May 2025) | Own blog: "INR 300 to 600 per vehicle per month" entry tier | "AI-native", "Agentic TMS", AI truck routes (Nov 2025) | 6, 7, 9, 10 |
| **LocoNav → Sensorise** | SMB fleets, 2W/3W OEM telematics | GPS, video, scorecards | Annual device+sub; FY25 ₹43.2 Cr, loss ₹1.5 Cr; India ops sold to Sensorise Oct 2025 | ₹2,184–₹4,539/yr all-in | Eagle.ai (anomaly detection) | 16, 17, 18 |
| **Intangles** | OEMs, large fleets, buses/mining; global | Predictive maintenance via digital twin | FY25 ₹75.1 Cr, loss ₹70.9 Cr; $30M Series B (Oct 2025) | Not public | Core product: "95% accuracy, a month in advance" | 19, 20 |
| **iTriangle** | Device OEM (AIS-140 Bharat 101) | Hardware to resellers/OEMs | FY25 revenue ₹66.2 Cr (from ₹26.9 Cr) | Not public | None | 25 |
| **Trinity Mobility** | Smart city / govt dispatch | Platform for cities, buses | ~$4.6M revenue FY23 | n/a | n/a | 26 |
| **Rivigo** | FTL relay trucking | Asset-heavy | Express biz sold to Mahindra ₹225 Cr (2022); no 2025–26 news found | n/a | n/a | 27 |
| **Porter** | Intra-city LCV marketplace | Load matching | FY25 revenue ₹4,306 Cr, first profit ₹55 Cr | Commission | n/a | 28 |
| **TransportBook / TransportKhata** | 1–20 truck owners, munshi work | Trip khata, bilty, P&L, Vahan info | Freemium | ₹4,999/yr premium; TransportKhata ₹8k–25k/yr | None public | 32 |
| **Vahak / LOBB / RoaDo** | Transporters, brokers | Loads, WhatsApp ops, LR/e-invoice | Marketplace / SaaS | Vahak free | RoaDo: AI agents run WhatsApp reverse auctions; LOBB ML matching | 33, 34 |

### (b) Bytebeam / SuprFleet facts

- GitHub org (fetched): "Pluggable and customizable platform for connected devices"; repos are rumqtt, uplink (OTA, commands, offline buffering), ESP/Arduino/Android/Flutter SDKs. Nothing named SuprFleet or SuprNova in 37 repos. [1]
- Funding: $3M seed May 2022 (Together, Accel, STRIVE, AdvantEdge); trackers show total $3.25M, last round 7 Sep 2022. A 2025 round ($9M/$2.7M) appeared in one snippet but no primary announcement surfaced — **UNVERIFIED**. [2, 5]
- Customers on site (snippet): Matter, River, Royal Enfield, Simple, Lectrix, Exponent, Zypp Electric, Lohum, Ecozen, Kalyani, myTVS — i.e., EV 2W OEMs, batteries, chargers. No truck/CV OEM named. [3]
- Positioning: careers page says "building the control plane for connected fleets at scale". The JD line in your repo, "building an AI-native platform for Indian commercial fleets", is the only trace of a commercial-fleet product. [4, 35]
- **Could not find:** any public page, app-store listing or press mention of "SuprFleet" or "SuprNova"; any "1M vehicles" claim; a vehicle-mix split. **Answer to your question:** every public signal says the base is EV 2W (and some 3W/energy) OEM telemetry, not trucks. The ~1M figure is unverifiable publicly and, if true, is almost certainly OEM-connected scooters, not owner-operated trucks.

### (c) Three gaps for the 1–20 truck operator

1. **Service after the sale.** WheelsEye's operator app (4.6★, 40k reviews) still carries reviews that "GPS worked properly during the trial period, but after payment, all tracking stopped"; a Voxya complaint says the firm "asked him to recharge for the next year before agreeing to fix the device". Incumbents monetize renewals, not uptime. [14, 15]
2. **Hardware-first distribution excludes the long tail.** 68% of India's fleet is <5 trucks; "80% of the Indian market is small truck owners… they don't understand vehicle telematics and put it in their vehicles because the larger transporters mandate them." RoaDo: asking "small transporters who own one or two trucks… to install and maintain a GPS device… is simply not practical." AIS-140 is bought for compliance, not value. [30, 31]
3. **Nobody closes the loop to rupees.** Enterprise tools (Fleetx, Intangles) sell dashboards at ₹300–600+/vehicle/month; BlackBuck/WheelsEye sell GPS + FASTag but the trip hisab lives in TransportBook-class khata apps (₹4,999/yr) with no telemetry. Fuel reconciliation needs an ₹8k–12.5k sensor plus ₹400–950/month software, which small owners don't buy. The "which trip lost money and why" job is unowned. [8, 9, 29, 32]

### (d) Pricing anchors (WTP)

- Basic GPS, device + 1 yr all-in: **₹2,200–₹3,900** (LocoNav ₹2,184; BlackBuck ₹2,690–3,540; WheelsEye ₹2,799–3,850). Renewal from year 2: **₹1,000–₹2,500/yr** (~₹100–200/month). [8, 12, 13, 16, 24]
- AIS-140 hardware ₹2,800–5,500; recurring ₹1,200–5,000/yr. [8]
- Fuel sensor add-on: ₹8,000–₹12,500 hardware; ₹400–₹950/month software. [29]
- Mid-market SaaS: ₹300–600/vehicle/month entry (Fleetx's own figure). [9]
- Munshi software: ₹4,999/yr (TransportBook premium) to ₹8k–25k/yr (TransportKhata). [32]
- Implication: a small owner already pays ~₹150–300/truck/month across GPS + khata; a ₹250–500/truck/month "AI munshi" that replaces both sits inside existing spend only if it needs no new hardware.

### (e) Sources (all snippet-only unless marked FETCHED)

1. bytebeam · GitHub, github.com/bytebeamio — FETCHED. "Pluggable and customizable platform for connected devices"
2. "B2B Startup Bytebeam Raises Funding To Simplify IoT Applications", Inc42, May 2022, inc42.com/buzz/b2b-startup-bytebeam-raises-funding-to-simplify-iot-applications/ — "raised $3 million in Seed funding from Together Fund, Accel and STRIVE VC"
3. Bytebeam homepage, bytebeam.io — "Matter, River, Inverted, Royal Enfield, Lohum, Bullwork, Lectrix, Exponent, Kalyani, Simple, NaArNi, Ecozen, and Zypp Electric"
4. Bytebeam Careers, jobs.bytebeam.io — "building the control plane for connected fleets at scale"
5. Bytebeam profile, PitchBook/Tracxn, pitchbook.com/profiles/company/481857-58 — "raised a total of $3.25M over 3 funding rounds… Seed VC - III on September 7, 2022"
6. Fleetx Financials, Inc42, inc42.com/company/fleetx/financials/ — "from ₹60.1 Cr in FY24 to ₹79.7 Cr in FY25… net loss of ₹34.4 Cr"
7. "Fleetx raises 113 Cr in Series C", Fleetx, May 2025, fleetx.ai/fleetx-raises-113-cr-in-series-c — "Series C fundraise of Rs. 113 Cr led by existing investors IndiaMART Intermesh Limited and BEENEXT"
8. "AIS 140 GPS Device Price in India (2026)", Fleetx blog, blog.fleetx.ai/blog-ais-140-gps-device-price-in-india-2026/ — "between ₹2,800 and ₹5,500 per vehicle for hardware alone"
9. "Fleet Management Software: The 2026 Buyer's Playbook", Fleetx blog, blog.fleetx.ai/fleet-management-software-the-2026-buyers-playbook/ — "Entry/small business tier typically costs INR 300 to 600 per vehicle per month"
10. "Fleetx Launches AI-Powered Truck Routes", ANI, 27 Nov 2025, aninews.in/news/business/fleetx-launches-ai-powered-truck-routes-…
11. "WheelsEye posts Rs 243 Cr revenue in FY25; losses remains flat", Entrackr, 2025, entrackr.com/fintrackr/wheelseye-posts-rs-243-cr-revenue-in-fy25-losses-remains-flat-11208516 — "software subscription services rose 20% to Rs 152.7 crore and accounted for nearly 62%"
12. WheelsEye truck GPS, 1-yr subscription, Flipkart, flipkart.com/wheelseye-gps-tracking-device-truck-vehicles-live-1-year-subscription/p/itmde79795440840 — "₹3,850"
13. Wheelseye GPS with free 1-yr subscription, Amazon.in, amazon.in/dp/B0CKX1XMXM — "₹2,799, marked down from an MRP of ₹4,999"
14. "FASTag,GPS,Fuel", Google Play, play.google.com/store/apps/details?id=com.wheelseyeoperator — "GPS worked properly during the trial period, but after payment, all tracking stopped"
15. Complaint vs Wheelseye India Pvt Ltd, Voxya, 26 Jul 2023, voxya.com/consumer-complaints/not-sending-technician-to-resolve-device-issue/205623 — "asked him to recharge for the next year before agreeing to fix the device"
16. "India's Best Selling GPS Trackers", LocoNav, loconav.com/gps-tracker — "Ride - Wired GPS Tracker: ₹2,184… Move - Wireless GPS Tracker: ₹4,539"
17. LocoNav Financials, Inc42, inc42.com/company/loconav/financials/ — "from ₹36.1 Cr in FY24 to ₹43.2 Cr in FY25… net loss of ₹1.5 Cr"
18. "Sensorise Acquires LocoNav's India Operations, Unveils Eagle.ai", Autocar Professional, 14 Oct 2025, autocarpro.in/news/sensorise-acquires-loconavs-india-operations-… — "over 10,000 customers and 150,000 active device subscriptions"
19. Intangles Financials, Inc42, inc42.com/company/intangles/financials/ — "from ₹62.5 Cr in FY24 to ₹75.1 Cr in FY25… net loss of ₹70.9 Cr"; Series B: The Week/PTI, 7 Oct 2025
20. Intangles US HQ release, Business Wire, 16 Sep 2026 — "500,000+ vehicles for 41,000+ operators in 18 countries"
21. Zinka Logistics DRHP summary, Bigul / BW Businessworld, Jul 2024, bigul.co/blog/zinka-logistics-solutions-filed-drhp-with-sebi-… — "payments and telematics offerings contributed 94.53% to total revenue from continuing operations in Fiscal 2024"; "963,345 truck operators… 27.52%"; "356,050 average monthly active telematics devices"
22. "BlackBuck reports Rs 185 Cr revenue and Rs 66 Cr profit in Q4 FY26", Entrackr, May 2026, entrackr.com/fintrackr/blackbuck-reports-rs-185-cr-revenue-… — "core revenue (payments and telematics) was INR 525.46 crore… growth businesses contributed INR 126.51 crore, up 266 percent"
23. "BlackBuck Ltd: When Scale Meets Cash Flow", The Loggical Investor (Substack) — "Lending business (vehicle financing) revenue was Rs. 5.34 crore in FY25"
24. BlackBuck Boss App GPS, 1-yr plan, IndiaMART, indiamart.com/proddetail/…26065728448.html — "₹ 3540/piece"; Amazon.in B0F9Y67B1Z — "₹2,690"
25. Itriangle Infotech Financials, Tofler, tofler.in/itriangle-infotech-private-limited/company/U72400KA2009PTC049414 — "₹66.2 crore for the financial year ending on March 31, 2025"
26. Trinity Mobility, CB Insights, cbinsights.com/company/trinity-mobility — "annual revenue of $4.59 million… investors including Honeywell"
27. "Mahindra Logistics acquires Rivigo's B2B Express business for Rs 225 crore", Autocar Professional, 2022
28. "Porter turns profitable with over Rs 4,000 Cr revenue in FY25", Entrackr, Sep 2025 — "Rs 4,306.2 crore in FY25… net profit of Rs 55.3 crore"
29. Fuel sensor listings, IndiaMART (Algotrack ₹10,500; Melta ₹12,500; GPS fuel sensor ₹8,000); "Top 10 Fuel Tracking Software in India", Watsoo — "INR 400 to INR 750 per month"
30. Automotive World (India CV telematics), automotiveworld.com/?p=264732 — "80% of the Indian market is small truck owners (1-5 truck fleet), and they don't understand vehicle telematics"
31. "SIM-Based Tracking Without GPS Devices Explained", RoaDo blog, roado.tech/blog/how-real-time-tracking-without-hardware-works-… — "small transporters who own one or two trucks… is simply not practical"
32. TransportBook, transportbook.in — "trusted by 10 Lakh+ Transporters"; "Premium plan at ₹4,999 per year"; TransportKhata, transportkhata.com — "₹8,000… ₹15,000… ₹25,000 per year"
33. LOBB, WhatsApp Business stories, whatsapp.com/stories/business/India/lobb; RoaDo transporters page, roado.tech/in/solutions/transporters — "AI agents handling bid collection and auto-award"
34. Vahak, vahak.in — "20+ lakh transport businesses registered"; TruckBhejo, YourStory, Jul 2021
35. /home/user/urja/Discovery-PRD.md (local, read) — JD quote "building an AI-native platform for Indian commercial fleets"

**Still open:** exact BlackBuck ₹-split by payments vs telematics vs loads (only the 94.5% combined and ₹5.34 Cr lending figures surfaced; the FY26 annual report PDF on NSE, filed 25 Aug 2026, should have it); Herald Goa "Salcete truckers" GPS-rate story (found only by title); any Bytebeam vehicle count.