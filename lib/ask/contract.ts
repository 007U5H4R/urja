/**
 * The /api/ask contract (technical-plan §6.1). The route validates requests
 * with `AskRequest`; every response body, whatever path produced it, matches
 * `AskResponse`. `answer` is plain text: the UI renders it as text, never HTML.
 */
import { z } from "zod";

export const AskRequest = z.object({
  question: z.string().trim().min(1).max(500),
  lang: z.enum(["hi", "en"]).optional(),
});
export type AskRequest = z.infer<typeof AskRequest>;

export const AskMode = z.enum(["model", "fallback", "saved"]);
export type AskMode = z.infer<typeof AskMode>;

export const AskLang = z.enum(["hi", "en", "hinglish"]);
export type AskLang = z.infer<typeof AskLang>;

export const AskCite = z.object({
  /** A trip id that exists in the dataset ('MMDD-NN'). */
  tripId: z.string(),
  label: z.string(),
});
export type AskCite = z.infer<typeof AskCite>;

export const AskProvenance = z.object({
  scope: z.string(),
  model: z.string().nullable(),
  ms: z.number().int().nonnegative(),
  promptVersion: z.string(),
  datasetHash: z.string(),
});
export type AskProvenance = z.infer<typeof AskProvenance>;

export const AskResponse = z.object({
  mode: AskMode,
  answer: z.string(),
  lang: AskLang,
  cites: z.array(AskCite),
  caveat: z.string().optional(),
  provenance: AskProvenance,
  retryAfterS: z.number().int().positive().optional(),
});
export type AskResponse = z.infer<typeof AskResponse>;
