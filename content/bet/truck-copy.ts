/**
 * Static UI copy for the truck lender view, /trucks/[plate] (TASK-26; bet-spec §8). Headings,
 * labels and the consent step's words only: every figure, note and claim on the page comes from
 * lib/bet/views/truck.ts. BET_TRUCK in ./copy.ts holds the page's eyebrow, h1, thesis and market
 * claims. English only (EXE39). No amounts here.
 */
export const TRUCK_COPY = {
  /** The eyebrow reads "Truck · <driver>, driver since <year>". */
  driverSince: "driver since",

  figures: {
    h2: "September from the ledger",
    profit: "Profit",
    perKm: "Per km",
    km: "Distance",
    unaccounted: "Unaccounted",
    recovered: "Recovered",
    rank: "Rank by profit per km",
    rankOf: "of",
  },

  trust: {
    h2: "Trust score",
    lede: "Five weighted factors from the verified ledger, each scored 0 to 1. The points add up to the score.",
    meterLabel: "Trust score",
    outOf: "of 100",
    tableLabel: "Trust score breakdown",
    cols: { factor: "Factor", weight: "Weight", measured: "Measured", score: "Score", points: "Points" },
    basisLabel: "Weights",
    assumptionsLabel: "Where the leakage and stability scores reach zero",
  },

  ledger: {
    h2: "Daily ledger",
    lede: "Profit per day, from the trips that ended that day. A day with no trip ending shows only a faint sliver.",
    chartRegion: "Daily ledger chart",
    legend: { profit: "Profit day", loss: "Loss day", flag: "Flag raised", verified: "Verified day", unverified: "Not verified" },
    summary: {
      intro: "Daily profit",
      flagsOn: "Flags raised on",
      noFlags: "No flags raised",
      lossOn: "Loss on",
      bestDay: "Best day",
      verified: "verified",
    },
    tableCaption: "Daily ledger, day by day",
    cols: { day: "Day", trips: "Trips ended", profit: "Profit", flags: "Flags", verified: "Verified" },
    yes: "Verified",
    no: "Not verified",
    completeness: "GPS completeness",
    resolution: "Flag resolution",
    flagged: "Flagged",
    recovered: "recovered",
  },

  verified: {
    h2: "Verified days",
    lede: "A lender reads history, not a forecast. Months not yet recorded stay empty.",
    monthsLabel: "Months on the way to the target",
    recorded: "Recorded",
    days: "verified days",
    surplus: "verified surplus",
    definitionLabel: "What counts as verified",
  },

  loan: {
    h2: "Loan readiness",
    tag: "Illustrative",
    lede: "Illustrative: not a forecast or an offer. SuprFleet does not lend; a lending partner would underwrite.",
    linesLabel: "From the verified days",
    assumptionsLabel: "What these lines assume",
    consentLabel: "Consent and partnership",
    contextLabel: "The rails a consent step would use",
    marketLabel: "Why a lender would care",
    share: {
      button: "Share with a lending partner",
      stepHead: "First, the owner's consent",
      steps: [
        "The owner sees exactly what a lending partner would get: this truck's verified days, trust score, daily ledger and flags.",
        "The owner approves or declines. Nothing leaves Urja without that approval, and the owner can withdraw it later.",
        "Only then would the record go to the lending partner the owner chose.",
      ],
      sent: "Nothing was sent to a lending partner.",
    },
  },

  flags: {
    h2: "Flags in September",
    lede: "Each flag links to its trip's evidence. The status says where it stands.",
    listLabel: "September flags",
    flagged: "Flagged",
    recovered: "Recovered",
    open: "Open trip",
    empty: "No flags in September.",
  },
} as const;
