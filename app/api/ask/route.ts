/**
 * POST /api/ask: Ask Urja (technical-plan §6). The handler lives in
 * lib/ask/handler.ts; GEMINI_API_KEY is read there from process.env, on the
 * server only. The rate limiter is per server instance (TP6).
 */
import { getAskContext } from "@/lib/ask/context";
import { createAskHandler } from "@/lib/ask/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handle = createAskHandler();

// Warm the context (dataset + JSON, ~0.8 s) when the instance loads, so the
// first question doesn't pay for it. A failure here must never break the
// import: the handler retries on the first request and falls back from there.
try {
  getAskContext();
} catch {
  // Retried per request.
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}
