/**
 * The model's answer shape (technical-plan §6.3): the Gemini `responseSchema`
 * sent with every call, and the zod schema that validates what comes back.
 * Gemini's schema dialect is an OpenAPI subset (uppercase type names).
 */
import { z } from "zod";

export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    answer: { type: "STRING" },
    lang: { type: "STRING", enum: ["hi", "en", "hinglish"] },
    cited_trips: { type: "ARRAY", items: { type: "STRING" } },
    cited_trucks: { type: "ARRAY", items: { type: "STRING" } },
    out_of_scope: { type: "BOOLEAN" },
  },
  required: ["answer", "lang", "cited_trips", "cited_trucks", "out_of_scope"],
  propertyOrdering: ["answer", "lang", "cited_trips", "cited_trucks", "out_of_scope"],
} as const;

export const ModelAnswer = z.object({
  answer: z.string().trim().min(1).max(4000),
  lang: z.enum(["hi", "en", "hinglish"]),
  cited_trips: z.array(z.string()).max(50),
  cited_trucks: z.array(z.string()).max(50),
  out_of_scope: z.boolean(),
});
export type ModelAnswer = z.infer<typeof ModelAnswer>;
