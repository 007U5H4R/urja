/**
 * The source registry for the bet pages (TASK-21; docs/bet/bet-spec.md). Every claim on /bet,
 * /bet/tiers and /trucks/[plate] either cites ids from here or is labelled an assumption with
 * its basis (`Claim`).
 *
 * Status (EXE41): every entry is "unverified". The research memos in docs/bet/research/ found
 * these pages through search snippets only (page fetches were blocked), so no line has been read
 * on the page itself. The verification pass opens each URL, records `accessed` and a verbatim
 * `quote`, and only then sets "verified"; a source that fails is dropped and its claims become
 * assumptions. The memo reference after each entry (G = global-landscape, C =
 * india-competitors-bytebeam, S = india-structure-credit) points at the snippet.
 *
 * Titles are the publishers' own where the memo gives them, otherwise descriptive, and always
 * pass the TC-014 wording guard: a title with an accusing word is paraphrased as "leakage".
 */

export type SourceStatus = "unverified" | "verified";

export interface Source {
  /** Kebab-case, stable: content cites it in `sourceIds`. */
  id: string;
  title: string;
  publisher: string;
  /** As the source dates itself ("Nov 2024", "2025", "undated"). */
  date: string;
  url: string;
  status: SourceStatus;
  /** ISO date (YYYY-MM-DD) the page was opened; set by the verification pass. */
  accessed?: string;
  /** The verbatim line checked on the page; set by the verification pass. */
  quote?: string;
}

/** A claim on a bet page: cited to sources, or an assumption we chose, with its basis. */
export type Claim = { text: string; sourceIds: string[] } | { text: string; assumption: true; basis: string };

export type CitedClaim = Extract<Claim, { sourceIds: string[] }>;

export function isCited(claim: Claim): claim is CitedClaim {
  return "sourceIds" in claim;
}

export const SOURCES: readonly Source[] = [
  // ── Market structure ──
  {
    id: "zinka-prospectus", // S1: ~12.5 M trucks, ~3.5 M operators, 75% own fewer than 5 trucks (RedSeer)
    title: "Zinka Logistics Solutions Limited, prospectus (with the RedSeer industry report)",
    publisher: "Zinka Logistics Solutions, via Axis Capital",
    date: "Nov 2024",
    url: "https://www.axiscapital.co.in/contents/Zinka-Logistics-Solutions-Limited-Prospectus.pdf",
    status: "unverified",
  },
  {
    id: "fuel-cost-share", // S4: fuel is ~55% of operating cost
    title: "Impacts of diesel price increases on India's trucking industry",
    publisher: "IISD and IRADe",
    date: "2012",
    url: "https://irade.org/ffs_india_irade_trucking.pdf",
    status: "unverified",
  },
  {
    id: "fuel-leakage-8pct", // S6: ~8% of diesel filled (MotorIndia, oft-cited); 45–55% fuel share (IFTRT)
    title: "Fuel monitoring system in India: how much can fleet owners realistically save per vehicle?",
    publisher: "Fleetx blog",
    date: "2025",
    url: "https://blog.fleetx.io/fuel-monitoring-system-india-how-much-can-fleet-owners-realistically-save-per-vehicle/",
    status: "unverified",
  },

  // ── Rails that already exist ──
  {
    id: "fastag-98", // S8: >98% of NH user fees via electronic toll collection
    title: "FASTag accounts for over 98 percent of toll collection on national highways",
    publisher: "Times Drive, citing MoRTH",
    date: "2025",
    url: "https://www.timesdrive.in/news/fastag-accounts-for-over-98-percent-of-toll-collection-on-national-highways-morth-article-153531512/amp",
    status: "unverified",
  },
  {
    id: "eway-bills", // S17: record 140.6 M e-way bills in Mar 2026
    title: "E-way bills surge to an all-time high of 140.6 million in March",
    publisher: "IANS",
    date: "Apr 2026",
    url: "https://ianslive.in/e-way-bills-surge-to-all-time-high-of-1406-million-in-march--20260410172704",
    status: "unverified",
  },
  {
    id: "ais140-rule-125h", // S12: tracking devices on national-permit goods carriers registered from 1 Jan 2019
    title: "Central Motor Vehicles Rules, Rule 125H: vehicle location tracking devices",
    publisher: "Transport Department, Government of Tripura",
    date: "2018",
    url: "https://transport.tripura.gov.in/pdf/CMVR125H.pdf",
    status: "unverified",
  },
  {
    id: "ais140-deadline", // G29: commercial vehicles registered before Jan 2025 comply by 31 Mar 2026
    title: "AIS-140 guide",
    publisher: "Fleetx blog",
    date: "May 2026",
    url: "https://blog.fleetx.io/blog-ais140-guide/",
    status: "unverified",
  },
  {
    id: "tata-fleet-edge", // S14: 5 lakh CVs connected on Fleet Edge
    title: "Tata Motors connects 5,00,000 commercial vehicles with Fleet Edge",
    publisher: "Mobility Outlook",
    date: "2024",
    url: "https://mobilityoutlook.com/news/tata-motors-connects-500000-commercial-vehicles-with-fleet-edge",
    status: "unverified",
  },
  {
    id: "can-fuel-steps", // S40: factory float sensors read in 10–40 L steps
    title: "Sub-resolution fuel measurement (US patent application 20220298985)",
    publisher: "Justia Patents",
    date: "2022",
    url: "https://patents.justia.com/patent/20220298985",
    status: "unverified",
  },
  {
    id: "whatsapp-users", // S18: over 500 M WhatsApp users in India
    title: "Meta doubles down on WhatsApp Business in India",
    publisher: "Storyboard18",
    date: "2024",
    url: "https://www.storyboard18.com/how-it-works/meta-doubles-down-on-whatsapp-business-in-india-23713.htm",
    status: "unverified",
  },
  {
    id: "whatsapp-pricing", // S19: a utility message costs ₹0.145 outside the service window
    title: "WhatsApp API new pricing update",
    publisher: "AiSensy",
    date: "Jan 2026",
    url: "https://m.aisensy.com/blog/whatsapp-api-new-pricing/",
    status: "unverified",
  },

  // ── Credit and consent ──
  {
    id: "aa-fy25", // S26: ₹1.67 lakh cr disbursed via Account Aggregator in FY25
    title: "Account aggregators facilitating loan disbursement worth Rs 4,000 cr a month: report",
    publisher: "DT Next",
    date: "2025",
    url: "https://www.dtnext.in/amp/story/news/business/account-aggregators-facilitating-loan-disbursement-worth-rs-4000-cr-a-month-report-803942",
    status: "unverified",
  },
  {
    id: "rbi-digital-lending", // S28: the 2022 guidelines, superseded by the Digital Lending Directions of 8 May 2025
    title: "Guidelines on Digital Lending, superseded by the Reserve Bank of India (Digital Lending) Directions, 2025",
    publisher: "Reserve Bank of India",
    date: "8 May 2025",
    url: "https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12382",
    status: "unverified",
  },
  {
    id: "aa-consents-sahamati", // S25: 28.9 cr AA consents fulfilled cumulatively to 31 Jul 2025
    title: "Strategies to boost AA success rates",
    publisher: "Sahamati",
    date: "Sep 2025",
    url: "https://sahamati.org.in/wp-content/uploads/2025/10/Pragati-Session-__-Strategies-to-boost-AA-success-rates-__-10th-Sept-2025-__-Website-Update-1.pdf",
    status: "unverified",
  },
  {
    id: "dpdp-rules-2025", // S33: DPDP Rules notified; consent-manager registration after 1 year, most rules after 18 months
    title: "Digital Personal Data Protection Rules, 2025 notified",
    publisher: "Mondaq",
    date: "Nov 2025",
    url: "https://www.mondaq.com/india/data-protection/1708164/digital-personal-data-protection-rules-2025-notified",
    status: "unverified",
  },
  {
    id: "aa-consent-manager", // S34: under the draft DPDP Rules, account aggregators may become "white-label" consent managers
    title: "FIG Paper No. 40: draft DPDP Rules, implications for financial services",
    publisher: "Cyril Amarchand Mangaldas",
    date: "Jan 2025",
    url: "https://corporate.cyrilamarchandblogs.com/2025/01/fig-paper-no-40-data-law-series-6-draft-digital-personal-data-protection-rules-2025-key-implications-for-financial-services-sector/",
    status: "unverified",
  },
  {
    id: "shriram-rating", // S20: CV 45% of AUM; CV GS3 4.79%
    title: "Credit rating rationale: Shriram Finance",
    publisher: "India Ratings, via IndiaBonds",
    date: "2025",
    url: "https://www.indiabonds.com/credit-rating-rational-document/119933",
    status: "unverified",
  },
  {
    id: "chola-q2fy26", // S21: Stage 3 at 3.35% (Sep 2025)
    title: "Cholamandalam Investment and Finance reports strong Q2 and H1 growth",
    publisher: "FilingReader",
    date: "Nov 2025",
    url: "https://filingreader.com/news-wire/mumbai/2025-11-06/cholamandalam-investment-finance-reports-strong-q2-h1-growth",
    status: "unverified",
  },
  {
    id: "mahindra-finance-q4fy25", // S22: Stage 3 at 3.7%
    title: "Mahindra Finance: financial results, quarter 4 FY25",
    publisher: "Mahindra",
    date: "2025",
    url: "https://www.mahindra.com/news-room/press-release/en/financial-results%E2%80%93quarter-4-FY25-standalone-and-consolidated-results",
    status: "unverified",
  },
  {
    id: "used-cv-cagr", // S24: used-vehicle loan AUM CAGR 15% vs 11% new, FY20–25
    title: "Vehicle loan AUM to grow 16-17% annually, touch Rs 11 trillion by FY27: Crisil Ratings",
    publisher: "Business Standard",
    date: "Dec 2025",
    url: "https://www.business-standard.com/finance/news/vehicle-loan-aum-to-grow-16-17-annually-touch-rs-11-trillion-by-fy27-crisil-ratings-125121000964_1.html",
    status: "unverified",
  },
  {
    id: "blackbuck-lending", // S29: BlackBuck's NBFC underwrites on its own behavioural and transaction data
    title: "BlackBuck infuses capital into its lending arm, BlackBuck Finserve",
    publisher: "Inc42",
    date: "2024",
    url: "https://inc42.com/?p=506645",
    status: "unverified",
  },

  // ── What owners pay today ──
  {
    id: "gps-loconav", // C16: wired GPS tracker ₹2,184
    title: "India's best selling GPS trackers",
    publisher: "LocoNav",
    date: "undated",
    url: "https://loconav.com/gps-tracker",
    status: "unverified",
  },
  {
    id: "gps-wheelseye", // C12: truck GPS with a 1-year subscription, ₹3,850
    title: "WheelsEye GPS tracking device for trucks, with a 1-year subscription",
    publisher: "Flipkart",
    date: "undated",
    url: "https://www.flipkart.com/wheelseye-gps-tracking-device-truck-vehicles-live-1-year-subscription/p/itmde79795440840",
    status: "unverified",
  },
  {
    id: "fuel-sensor-prices", // C29: sensors ₹8,000–12,500; software ₹400–750 a month (listing URLs to record in the verification pass)
    title: "Fuel-level sensor listings (Algotrack, Melta and generic GPS fuel sensors)",
    publisher: "IndiaMART",
    date: "undated",
    url: "https://www.indiamart.com/",
    status: "unverified",
  },
  {
    id: "transportbook-pricing", // C32: premium plan ₹4,999 a year
    title: "TransportBook: the transport business app and its premium plan",
    publisher: "TransportBook",
    date: "undated",
    url: "https://transportbook.in/",
    status: "unverified",
  },
  {
    id: "fleetx-pricing", // C9: entry tier ₹300–600 per vehicle per month
    title: "Fleet management software: the 2026 buyer's playbook",
    publisher: "Fleetx blog",
    date: "2026",
    url: "https://blog.fleetx.ai/fleet-management-software-the-2026-buyers-playbook/",
    status: "unverified",
  },
  {
    id: "wheelseye-fy25", // C11: software subscriptions ₹152.7 cr, ~62% of FY25 revenue
    title: "WheelsEye posts Rs 243 Cr revenue in FY25; losses remains flat",
    publisher: "Entrackr",
    date: "2025",
    url: "https://entrackr.com/fintrackr/wheelseye-posts-rs-243-cr-revenue-in-fy25-losses-remains-flat-11208516",
    status: "unverified",
  },
  {
    id: "vahak-network", // C34: 20+ lakh transport businesses registered
    title: "Vahak: online transport marketplace",
    publisher: "Vahak",
    date: "undated",
    url: "https://vahak.in/",
    status: "unverified",
  },

  // ── Bytebeam and EV fleets ──
  {
    id: "bytebeam-customers", // C3: Matter, River, Royal Enfield, Simple, Zypp Electric and others
    title: "Bytebeam homepage, customer list",
    publisher: "Bytebeam",
    date: "undated",
    url: "https://bytebeam.io/",
    status: "unverified",
  },
  {
    id: "l5-e3w-penetration", // S36: electric L5 three-wheelers above 31% penetration in FY2025-26
    title: "Electric three-wheeler sales in FY2025-26",
    publisher: "EVReporter",
    date: "2026",
    url: "https://evreporter.com/?p=31945",
    status: "unverified",
  },
  {
    id: "ev-finance-gap", // S38: "banks are concerned about resale value"
    title: "India's EV transition and its financing gap to 2030",
    publisher: "Outlook Business",
    date: "2025",
    url: "https://www.outlookbusiness.com/industry/india-ev-transition-2-23-lakh-crore-10-lakh-crore-financing-gap-2030",
    status: "unverified",
  },

  // ── Global ──
  {
    id: "motive-s1", // G5: Spend Management was ~2%, 3% and 4% of revenue
    title: "Motive Technologies, Form S-1 registration statement",
    publisher: "U.S. Securities and Exchange Commission",
    date: "Dec 2025",
    url: "https://www.sec.gov/Archives/edgar/data/1646681/000162828025058773/motive-sx1.htm",
    status: "unverified",
  },
  {
    id: "corpay-10k", // G19: Vehicle Payments revenue $2,138.7 M in 2025
    title: "Corpay, Inc. annual report on Form 10-K for 2025",
    publisher: "U.S. Securities and Exchange Commission",
    date: "2026",
    url: "https://www.sec.gov/Archives/edgar/data/1175454/000117545426000018/flt-20251231.htm",
    status: "unverified",
  },
  {
    id: "wejo-collapse", // G16: $8.4 M revenue against a $159.3 M loss; administration July 2023
    title: "Wejo sought to raise funds from shareholders in its final days before administration",
    publisher: "Prolific North",
    date: "2023",
    url: "https://www.prolificnorth.co.uk/news/wejo-collapsed-data-firm-sought-to-raise-7m-from-shareholders-to-unlock-google-cash-in-final-days-before-administration/",
    status: "unverified",
  },
  {
    id: "progressive-smart-haul", // G21: 3–15% discounts for carriers that share ELD data
    title: "Progressive brings UBI to commercial with Smart Haul",
    publisher: "Digital Insurance",
    date: "undated",
    url: "https://www.dig-in.com/news/progressive-brings-ubi-to-commercial-with-smart-haul",
    status: "unverified",
  },
  {
    id: "samsara-agent-pricing", // G3: Samsara will learn usage patterns before pricing its agents
    title: "Samsara Q4 earnings call highlights",
    publisher: "Yahoo Finance",
    date: "6 Mar 2026",
    url: "https://finance.yahoo.com/news/samsara-q4-earnings-call-highlights-085320405.html",
    status: "unverified",
  },
  {
    id: "aurora-q2-2026", // G24: 5 driverless trucks mid-2026, aiming for 200 by year end
    title: "Aurora Innovation, Q2 2026 shareholder letter (Form 8-K)",
    publisher: "U.S. Securities and Exchange Commission",
    date: "29 Jul 2026",
    url: "https://www.sec.gov/Archives/edgar/data/0001828108/000182810826000075/aurora26q2shareholderlet.htm",
    status: "unverified",
  },

  // ── Insurance ──
  {
    id: "irdai-payd-2022", // S30: the 5 Jul 2022 circular allowed pay-as-you-drive and pay-how-you-drive add-ons
    title: "IRDAI allows innovative add-ons, floater policy for vehicle insurance",
    publisher: "Reliance General Insurance, from The Economic Times",
    date: "7 Jul 2022",
    url: "https://reliancegeneral.co.in/insurance/press-release/news-and-coverage/irdai-allows-innovative-add-ons,-floater-policy-for-vehicle-insurance-ceo-mr--rakesh-jain-the-economic-times-7-7-22.aspx",
    status: "unverified",
  },
  {
    id: "irdai-telematics", // S41: IRDAI lists five obstacles; telematics insurance is nascent
    title: "India's insurance regulator endorses telematics to lower motor premiums",
    publisher: "Insurance Business Asia",
    date: "undated",
    url: "https://www.insurancebusinessmag.com/asia/news/regional-news/indias-insurance-regulator-endorses-telematics-to-lower-motor-premiums-75206.aspx",
    status: "unverified",
  },
];

const BY_ID: ReadonlyMap<string, Source> = new Map(SOURCES.map((s) => [s.id, s]));

/** The source with this id; throws on an unknown id, so a bad citation fails the build. */
export function sourceById(id: string): Source {
  const s = BY_ID.get(id);
  if (!s) throw new Error(`Unknown source id: ${id}`);
  return s;
}

/** The ids `claims` cite, each once, in order of first citation: a page's numbered source list. */
export function citedSourceIds(claims: readonly Claim[]): string[] {
  const ids = claims.flatMap((c) => (isCited(c) ? c.sourceIds : []));
  return [...new Set(ids)];
}
