"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AskResponse } from "@/lib/ask/contract";

/**
 * The Ask state machine (TSK-12.1, technical-plan §6.1/§6.6):
 * idle → answering → answer | fallback | saved | error.
 * The question is kept on every non-idle state so "Try again" can resend it.
 * A new question, `reset()` and unmount abort the request in flight.
 */
export type AskStatus = "idle" | "answering" | "answer" | "fallback" | "saved" | "error";

export type AskState =
  | { status: "idle" }
  | { status: "answering"; question: string }
  | { status: "answer" | "fallback" | "saved"; question: string; response: AskResponse; retryAfterS?: number }
  | { status: "error"; question: string; retryAfterS?: number };

export interface UseAskOptions {
  /** Injected in tests; the global fetch otherwise. */
  fetchImpl?: typeof fetch;
  endpoint?: string;
  /** A request that hangs past this becomes the error state (the server itself cuts Gemini at 8 s). */
  timeoutMs?: number;
}

export interface UseAsk {
  state: AskState;
  ask: (question: string, lang?: "hi" | "en") => void;
  retry: () => void;
  reset: () => void;
}

export const ASK_MAX_CHARS = 500;
const DEFAULT_TIMEOUT_MS = 15_000;

const STATUS_BY_MODE: Record<AskResponse["mode"], "answer" | "fallback" | "saved"> = {
  model: "answer",
  fallback: "fallback",
  saved: "saved",
};

/** Just enough shape-checking that a stray body can't crash the render (no zod in the client bundle). */
function isAskResponse(v: unknown): v is AskResponse {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.mode === "string" &&
    r.mode in STATUS_BY_MODE &&
    typeof r.answer === "string" &&
    Array.isArray(r.cites) &&
    !!r.provenance &&
    typeof r.provenance === "object"
  );
}

function positiveInt(v: unknown): number | undefined {
  return typeof v === "number" && Number.isInteger(v) && v > 0 ? v : undefined;
}

export function useAsk({ fetchImpl, endpoint = "/api/ask", timeoutMs = DEFAULT_TIMEOUT_MS }: UseAskOptions = {}): UseAsk {
  const [state, setState] = useState<AskState>({ status: "idle" });
  const inflight = useRef<AbortController | null>(null);
  const last = useRef<{ question: string; lang?: "hi" | "en" } | null>(null);

  const abort = () => {
    inflight.current?.abort();
    inflight.current = null;
  };

  useEffect(() => abort, []);

  const ask = useCallback(
    (raw: string, lang?: "hi" | "en") => {
      const question = raw.trim().slice(0, ASK_MAX_CHARS);
      if (!question) return;
      abort();
      const ctrl = new AbortController();
      inflight.current = ctrl;
      last.current = { question, lang };
      setState({ status: "answering", question });

      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        ctrl.abort();
      }, timeoutMs);

      const doFetch = fetchImpl ?? fetch;
      (async () => {
        try {
          const res = await doFetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(lang ? { question, lang } : { question }),
            signal: ctrl.signal,
          });
          const body: unknown = await res.json().catch(() => null);
          if (ctrl.signal.aborted) {
            // The timeout can fire while the body is still being read.
            if (timedOut) setState({ status: "error", question });
            return;
          }
          const retryAfterS = res.status === 429 ? positiveInt((body as { retryAfterS?: unknown } | null)?.retryAfterS) : undefined;
          if ((res.ok || res.status === 429) && isAskResponse(body)) {
            setState({
              status: STATUS_BY_MODE[body.mode],
              question,
              response: body,
              ...(retryAfterS ? { retryAfterS } : {}),
            });
          } else {
            setState({ status: "error", question, ...(retryAfterS ? { retryAfterS } : {}) });
          }
        } catch {
          // An abort from a newer question or unmount is silent; a timeout is an error.
          if (ctrl.signal.aborted && !timedOut) return;
          setState({ status: "error", question });
        } finally {
          clearTimeout(timer);
          if (inflight.current === ctrl) inflight.current = null;
        }
      })();
    },
    [endpoint, fetchImpl, timeoutMs],
  );

  const retry = useCallback(() => {
    if (last.current) ask(last.current.question, last.current.lang);
  }, [ask]);

  const reset = useCallback(() => {
    abort();
    last.current = null;
    setState({ status: "idle" });
  }, []);

  return { state, ask, retry, reset };
}
