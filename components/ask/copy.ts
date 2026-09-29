import type { Lang } from "@/lib/data/types";

/**
 * Ask Urja's interface copy (technical-plan §6.6; final/index.html drawer,
 * final/states.html fallback), in English and Hindi. EXE23: on a Hindi screen
 * (/brief and /message with lang=hi) every label of the drawer is Hindi; on
 * every other route it is English. The answers themselves come from /api/ask.
 * Every Hindi string is listed in docs/exec/hindi-review.md ("Ask drawer").
 */
export interface AskCopy {
  title: string;
  close: string;
  inputLabel: string;
  placeholder: string;
  submit: string;
  suggestedLabel: string;
  answering: string;
  /** Saved mode: the banner's first clause, since there is no number to show. */
  savedBanner: string;
  fallbackBanner: string;
  error: string;
  retry: string;
  /** 429: `n` seconds until the next question is accepted. */
  retryAfter: (n: number) => string;
  citesLabel: string;
  /** A cite chip's label: the trip id, with the word "trip" in the screen's language. */
  citeChip: (tripId: string) => string;
  /** The provenance line's scope part ('From 212 trips across 24 trucks, 1–27 Sep'). */
  from: (scope: string) => string;
  noModel: string;
  answeredIn: (s: string) => string;
  canBeWrong: string;
}

export const ASK_COPY: Record<Lang, AskCopy> = {
  en: {
    title: "Ask Urja",
    close: "Close Ask Urja",
    inputLabel: "Your question",
    placeholder: "Ask in Hindi or English…",
    submit: "Ask",
    suggestedLabel: "Suggested questions",
    answering: "Asking Gemini…",
    savedBanner: "Urja’s AI couldn’t answer right now.",
    fallbackBanner: "Urja’s AI couldn’t answer right now, so here is the number straight from your data.",
    error: "Urja couldn’t reach its server, so this question has no answer yet. Nothing is lost: your question is still in the box below.",
    retry: "Try again",
    retryAfter: (n) => `You’ve asked a lot in the last minute. Ask again in ${n} s.`,
    citesLabel: "Trips this answer used",
    citeChip: (tripId) => `Trip ${tripId}`,
    from: (scope) => `From ${scope}`,
    noModel: "straight from your data, no AI",
    answeredIn: (s) => `answered in ${s} s`,
    canBeWrong: "Urja can be wrong, so open the trips before acting.",
  },
  hi: {
    title: "Urja से पूछें",
    close: "Urja से पूछें बंद करें",
    inputLabel: "आपका सवाल",
    placeholder: "हिंदी या अंग्रेज़ी में पूछें…",
    submit: "पूछें",
    suggestedLabel: "सुझाए गए सवाल",
    answering: "Gemini से पूछ रहे हैं…",
    savedBanner: "Urja का AI अभी जवाब नहीं दे पाया।",
    fallbackBanner: "Urja का AI अभी जवाब नहीं दे पाया, इसलिए यह आँकड़ा सीधे आपके डेटा से है।",
    error: "Urja अपने सर्वर तक नहीं पहुँच पाया, इसलिए इस सवाल का जवाब अभी नहीं है। कुछ खोया नहीं है: आपका सवाल नीचे बॉक्स में ही है।",
    retry: "फिर से कोशिश करें",
    retryAfter: (n) => `आपने पिछले एक मिनट में बहुत सवाल पूछे हैं। ${n} सेकंड बाद फिर पूछें।`,
    citesLabel: "इस जवाब में इस्तेमाल हुई ट्रिप",
    citeChip: (tripId) => `ट्रिप ${tripId}`,
    from: (scope) => `${scope} के डेटा से`,
    noModel: "AI के बिना, सीधा हिसाब",
    answeredIn: (s) => `${s} सेकंड में जवाब`,
    canBeWrong: "Urja ग़लत हो सकता है, इसलिए कार्रवाई से पहले ट्रिप खोलें।",
  },
};

export interface AskChip {
  text: string;
  lang: Lang;
}

/**
 * The three idle chips (Design.md §14 Hick: 3 suggested questions). A chip sends
 * its own text, so on a Hindi screen all three ask in Hindi and the answer comes
 * back in Hindi; each Hindi chip asks what the English one at its place asks.
 */
export const ASK_CHIPS: Record<Lang, readonly AskChip[]> = {
  en: [
    { text: "Which truck earns least per km, and why?", lang: "en" },
    { text: "How much diesel went unaccounted last week?", lang: "en" },
    { text: "Show every flag on the Behror stretch", lang: "en" },
  ],
  hi: [
    { text: "कौन-सा ट्रक प्रति किलोमीटर सबसे कम कमाता है, और क्यों?", lang: "hi" },
    { text: "पिछले हफ़्ते कितने डीज़ल का हिसाब नहीं मिला?", lang: "hi" },
    { text: "बहरोड़ वाले हिस्से के सारे फ़्लैग दिखाएँ", lang: "hi" },
  ],
};
