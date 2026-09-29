/**
 * Ask Urja's interface copy (technical-plan §6.6; final/index.html drawer,
 * final/states.html fallback). The answers themselves come from /api/ask.
 */
export const ASK_COPY = {
  title: "Ask Urja",
  close: "Close Ask Urja",
  inputLabel: "Your question",
  placeholder: "Ask in Hindi or English…",
  submit: "Ask",
  suggestedLabel: "Suggested questions",
  answering: "Asking Gemini…",
  /** Saved mode: the banner's first clause, since there is no number to show. */
  savedBanner: "Urja’s AI couldn’t answer right now.",
  fallbackBanner: "Urja’s AI couldn’t answer right now, so here is the number straight from your data.",
  error: "Urja couldn’t reach its server, so this question has no answer yet. Nothing is lost: your question is still in the box below.",
  retry: "Try again",
  /** 429: `n` seconds until the next question is accepted. */
  retryAfter: (n: number) => `You’ve asked a lot in the last minute. Ask again in ${n} s.`,
  citesLabel: "Trips this answer used",
  citeChip: (tripId: string) => `Trip ${tripId}`,
  noModel: "straight from your data, no AI",
  answeredIn: (s: string) => `answered in ${s} s`,
  canBeWrong: "Urja can be wrong, so open the trips before acting.",
} as const;

/** The three idle chips (Design.md §14 Hick: 3 suggested questions). */
export const ASK_CHIPS: readonly { text: string; lang: "en" | "hi" }[] = [
  { text: "Which truck earns least per km, and why?", lang: "en" },
  { text: "पिछले हफ़्ते कितना डीज़ल गायब हुआ?", lang: "hi" },
  { text: "Show every flag on the Behror stretch", lang: "en" },
];
