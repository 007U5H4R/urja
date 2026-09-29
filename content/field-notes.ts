/**
 * Quotes for Why Urja, chapter 01 (Design.md §25, HANDOFF open items).
 *
 * The four below are illustrative, not from interviews: composites written to
 * show what fleet owners and munshis commonly describe. Each is flagged
 * `illustrative: true`, and while any quote is, the page labels them as such
 * above the cards. Real field notes ("Tell me about the last trip where you
 * lost money") will replace them, flagged `illustrative: false`. A quote is
 * never presented as heard when it wasn't. With an empty list, the page shows
 * the placeholder card and the ASSUMPTION line from final/why.html.
 */
export interface Quote {
  /** The person's words (translated if needed), or the composite's text. */
  text: string;
  /** e.g. "Owner", "Munshi". */
  role: string;
  /** e.g. "18 trucks". */
  fleetSize: string;
  city: string;
  /** True for a composite written to illustrate, not said by a real person. */
  illustrative: boolean;
}

export const quotes: readonly Quote[] = [
  {
    text: "I find out a trip lost money when the diesel bill comes, three weeks later. By then the driver is on another trip and nobody remembers anything.",
    role: "Owner",
    fleetSize: "18 trucks",
    city: "Jaipur",
    illustrative: true,
  },
  {
    text: "Every evening I sit with the fuel slips, the FASTag messages and the drivers’ diaries. Two hours, and I still can’t say which trip the missing litres came from.",
    role: "Munshi",
    fleetSize: "30 trucks",
    city: "Kishangarh",
    illustrative: true,
  },
  {
    text: "I don’t want to fight with my drivers. I just want to know which trip to ask about, so I don’t have to ask about all of them.",
    role: "Owner",
    fleetSize: "9 trucks",
    city: "Ajmer",
    illustrative: true,
  },
  {
    text: "The GPS app tells me where the truck is. It doesn’t tell me whether the trip made money.",
    role: "Owner",
    fleetSize: "24 trucks",
    city: "Bhiwandi",
    illustrative: true,
  },
];
