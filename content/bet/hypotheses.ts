/**
 * Hypotheses H1–H7 for /bet (TASK-28; docs/bet/bet-spec.md §5, research report §10). All seven
 * are untested by field calls; each carries the research for and against it, cited no further
 * than each snippet or labelled as an assumption. Claims shared with other bet pages are the
 * same objects, so the wording can't drift. Pure copy: nothing here imports lib/data.
 */
import { IRDAI_OBSTACLES, IRDAI_PAYD } from "./board";
import { BET_TRUCK } from "./copy";
import { claimMatching, type Claim } from "./sources";
import { STREAMS } from "./streams";
import { PRICE_ANCHORS, SPEND_LISTINGS } from "./tiers";
import { LEAKAGE_ZERO_AT_SHARE } from "./trust";

export type HypothesisId = "H1" | "H2" | "H3" | "H4" | "H5" | "H6" | "H7";

/** Every hypothesis carries this label: no owner, driver, munshi or lender was interviewed. */
export const UNTESTED = "Untested: no field calls";

export interface Hypothesis {
  id: HypothesisId;
  statement: string;
  /** A few words for the collapsed row. */
  verdictShort: string;
  /** bet-spec §5's verdict. */
  verdict: string;
  status: typeof UNTESTED;
  for: readonly Claim[];
  against: readonly Claim[];
  /** Where the research found nothing either way. */
  noEvidence?: Claim;
}

const truckClaim = (re: RegExp) => claimMatching(BET_TRUCK.claims as readonly Claim[], re);

export const HYPOTHESES: readonly Hypothesis[] = [
  {
    id: "H1",
    statement: "Leakage is material for small fleets",
    verdictShort: "Supported, number soft",
    verdict: "Supported, but the number is soft (~8% oft-cited; vendor 10–37%).",
    status: UNTESTED,
    for: [
      { text: "Fuel costs account for around 55% of total operating costs (a 2012 study).", sourceIds: ["fuel-cost-share"] },
      LEAKAGE_ZERO_AT_SHARE.benchmark,
    ],
    against: [
      {
        text: "No primary or small-fleet study was found; the 8% is a citation of a citation, and the higher figures come from vendors.",
        assumption: true,
        basis: "The research's own gap (research report §7.2).",
      },
    ],
  },
  {
    id: "H2",
    statement: "Owners act on a daily WhatsApp brief",
    verdictShort: "No evidence either way",
    verdict: "Untested. No evidence either way, so it's an assumption. The pilot measures it.",
    status: UNTESTED,
    for: [{ text: "WhatsApp has more than 500 million users in India.", sourceIds: ["whatsapp-users"] }],
    against: [
      {
        text: "Nothing found measures how often owners act on a message.",
        assumption: true,
        basis: "research report §10, H2. The brief-opened rate is a launch criterion for the pilots.",
      },
    ],
  },
  {
    id: "H3",
    statement: "Small operators' software WTP is low",
    verdictShort: "Partly contradicted",
    // bet-spec §5, with the ₹150–300 named as our estimate (TASK-27's honesty pass).
    verdict: "Partly contradicted: we estimate they pay ₹150–300 per truck per month for GPS plus khata. Paying for bookkeeping is unproven.",
    status: UNTESTED,
    for: [
      {
        text: "GPS renewals run about ₹1,000–2,500 a year.",
        assumption: true,
        basis: "A memo summary with no single quote (research report §8).",
      },
    ],
    against: [
      {
        text: "WheelsEye's software subscription revenue rose 20% to ₹152.7 crore in FY25, nearly 62% of its revenue.",
        sourceIds: ["wheelseye-fy25"],
      },
      SPEND_LISTINGS,
      PRICE_ANCHORS.currentSpend.claim,
    ],
  },
  {
    id: "H4",
    statement: "Lenders value verified per-truck cash flow",
    verdictShort: "Direction supported",
    verdict: "The direction is supported. No evidence of a lender paying a third party, so the model is a lending partnership.",
    status: UNTESTED,
    for: [truckClaim(/^Cholamandalam/), truckClaim(/BlackBuck/)],
    against: [
      {
        text: "No lender was found paying a third party for telematics data, and BlackBuck kept its data in-house.",
        assumption: true,
        basis: "What the research did not find (research report §7.4).",
      },
    ],
  },
  {
    id: "H5",
    statement: "Factory fuel data is enough without a sensor",
    verdictShort: "Weak",
    verdict: "Weak: CAN steps are 10–40 L. Hence stream fusion and honest confidence.",
    status: UNTESTED,
    for: [{ text: "Tata Motors has connected 5 lakh commercial vehicles to Fleet Edge.", sourceIds: ["tata-fleet-edge"] }],
    against: [
      claimMatching(STREAMS["can-fuel"].claims, /patent/),
      {
        text: "Only about 0.67 million trucks are OEM-connected, against about 12.5 million on the road, and small owners buy used.",
        assumption: true,
        basis:
          "Our arithmetic from Tata's 5 lakh and Ashok Leyland's 170,000 connected vehicles (research report §4); third-party access to OEM fuel data is unverified.",
      },
    ],
  },
  {
    id: "H6",
    statement: "Flags that skip the driver's side drive drivers away",
    verdictShort: "No evidence either way",
    verdict: "Untested. Kept as the guardrail metric.",
    status: UNTESTED,
    for: [],
    against: [],
    noEvidence: {
      text: "The research found nothing for or against it.",
      assumption: true,
      basis: "research report §10, H6. The wrong-flag rate guardrail watches it from the first pilot.",
    },
  },
  {
    id: "H7",
    statement: "Insurers would price on telemetry (India)",
    verdictShort: "Weak now",
    verdict: "Weak now. Phase 3.",
    status: UNTESTED,
    for: [IRDAI_PAYD],
    against: [IRDAI_OBSTACLES],
  },
];

export const HYPOTHESES_COPY = {
  lede: "Seven bets inside the bet. No field calls were made, so every one is untested; the research leans for or against.",
  forLabel: "Research for",
  againstLabel: "Research against",
  verdictLabel: "Verdict",
} as const;

/** Every claim the hypotheses render, in order. */
export function hypothesisClaims(): Claim[] {
  return HYPOTHESES.flatMap((h) => [...h.for, ...h.against, ...(h.noEvidence ? [h.noEvidence] : [])]);
}
