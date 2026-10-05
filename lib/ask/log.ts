/**
 * One JSON line per /api/ask request (technical-plan §6.5, §11). The key, the
 * prompt and the question text are never logged: the question appears only as
 * a SHA-256 prefix and a length, the caller's IP only as a hash.
 */
import { createHash } from "node:crypto";
import type { AskMode } from "./contract";

export type AskOutcome =
  | "ok"
  | "timeout"
  /** No HTTP response at all: DNS, TLS or a reset connection. */
  | "network"
  | "http_429"
  | "http_4xx"
  | "http_5xx"
  | "bad_json"
  | "schema"
  | "no_key"
  | "rate_limited"
  | "cap"
  | "guard"
  /** A 400: the body failed AskRequest (not in §6.5's list, which covers answered requests). */
  | "invalid"
  /** A 413: the body was over 8 KB and was not parsed. */
  | "too_large"
  /** EXE31: no call was made: every model to try is benched (a 429's retry hint, or a 404). */
  | "cooldown"
  /** An unexpected error inside the handler, answered with fallback or saved instead of a 500. */
  | "error";

export interface AskLogLine {
  ts: string;
  reqId: string;
  mode: AskMode | null;
  outcome: AskOutcome;
  ms: number;
  model: string | null;
  promptVersion: string;
  qHash: string | null;
  qLen: number;
  lang: string | null;
  cites: string[];
  unsupportedNumbers: number[];
  ipHash: string;
  /** Why the guard sent a model answer to the fallback. */
  guard?: string;
  /** EXE26: the primary's busy answer when the fallback model was asked ("gemini-3.5-flash http_429:429"). */
  firstAttempt?: string;
  /** Stage 9: decisive facts the model answer omitted although its cited records carry them (guard.ts missingSpecifics). */
  missing?: string[];
  /** EXE31: a model answer replayed from the answer cache (no Gemini call). */
  cached?: boolean;
}

/** The first 16 hex of SHA-256(question). */
export function hashQuestion(q: string): string {
  return createHash("sha256").update(q).digest("hex").slice(0, 16);
}

export type LogSink = (line: string) => void;

export const consoleSink: LogSink = (line) => console.log(line);

export function writeAskLog(entry: AskLogLine, sink: LogSink = consoleSink): void {
  sink(JSON.stringify(entry));
}
