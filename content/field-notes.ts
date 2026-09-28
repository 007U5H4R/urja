/**
 * Field quotes for Why Urja, chapter 01 (Design.md §25, HANDOFF open items).
 * They come from real conversations with fleet owners and munshis ("Tell me
 * about the last trip where you lost money"). None is ever invented: while
 * this list is empty, the page shows the placeholder card and the ASSUMPTION
 * line from final/why.html.
 */
export interface Quote {
  /** The person's words, as said (translated if needed). */
  text: string;
  /** e.g. "Owner", "Munshi". */
  role: string;
  /** e.g. "18 trucks". */
  fleetSize: string;
  city: string;
}

export const quotes: readonly Quote[] = [];
