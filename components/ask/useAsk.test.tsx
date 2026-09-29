// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AskResponse } from "@/lib/ask/contract";
import { useAsk } from "./useAsk";

afterEach(cleanup);

const provenance = { scope: "212 trips across 24 trucks, 1–27 Sep", model: "gemini-3.5-flash", ms: 1800, promptVersion: "ask-v1", datasetHash: "abc" };
const body = (over: Partial<AskResponse> = {}): AskResponse => ({
  mode: "model",
  answer: "RJ14 GB 4521 lost 38 L.",
  lang: "en",
  cites: [{ tripId: "0926-04", label: "RJ14 GB 4521 · Jaipur → Okhla, Delhi" }],
  provenance,
  ...over,
});
const reply = (status: number, json: unknown) =>
  Promise.resolve(new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } }));

describe("useAsk (TSK-12.1)", () => {
  it("starts idle and ignores an empty question", () => {
    const fetchImpl = vi.fn();
    const { result } = renderHook(() => useAsk({ fetchImpl }));
    expect(result.current.state).toEqual({ status: "idle" });
    act(() => result.current.ask("   "));
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe("idle");
  });

  it("goes answering → answer for mode model, posting the trimmed question", async () => {
    const fetchImpl = vi.fn(() => reply(200, body()));
    const { result } = renderHook(() => useAsk({ fetchImpl }));
    act(() => result.current.ask("  Which truck?  ", "en"));
    expect(result.current.state).toEqual({ status: "answering", question: "Which truck?" });
    await waitFor(() => expect(result.current.state.status).toBe("answer"));
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/ask");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ question: "Which truck?", lang: "en" });
    const s = result.current.state;
    expect(s.status === "answer" && s.response.cites[0].tripId).toBe("0926-04");
    expect(s.status === "answer" && s.question).toBe("Which truck?");
  });

  it.each([
    ["fallback", "fallback"],
    ["saved", "saved"],
  ] as const)("maps mode %s to the %s state and keeps the question", async (mode, status) => {
    const fetchImpl = vi.fn(() => reply(200, body({ mode, provenance: { ...provenance, model: null } })));
    const { result } = renderHook(() => useAsk({ fetchImpl }));
    act(() => result.current.ask("q1"));
    await waitFor(() => expect(result.current.state.status).toBe(status));
    expect((result.current.state as { question: string }).question).toBe("q1");
  });

  it("a 429 shows retryAfterS with the fallback answer it carries", async () => {
    const fetchImpl = vi.fn(() => reply(429, body({ mode: "fallback", retryAfterS: 12 })));
    const { result } = renderHook(() => useAsk({ fetchImpl }));
    act(() => result.current.ask("q"));
    await waitFor(() => expect(result.current.state.status).toBe("fallback"));
    expect((result.current.state as { retryAfterS?: number }).retryAfterS).toBe(12);
  });

  it("a 429 without an answer is an error that still carries retryAfterS", async () => {
    const fetchImpl = vi.fn(() => reply(429, { retryAfterS: 30 }));
    const { result } = renderHook(() => useAsk({ fetchImpl }));
    act(() => result.current.ask("q"));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).toEqual({ status: "error", question: "q", retryAfterS: 30 });
  });

  it.each([
    ["a 400", () => reply(400, { error: "invalid_request" })],
    ["a network failure", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["a body that isn't an AskResponse", () => reply(200, { hello: "world" })],
    ["a body that isn't JSON", () => Promise.resolve(new Response("<html>", { status: 200 }))],
  ])("%s becomes the error state, keeping the question", async (_, impl) => {
    const fetchImpl = vi.fn(impl);
    const { result } = renderHook(() => useAsk({ fetchImpl: fetchImpl as unknown as typeof fetch }));
    act(() => result.current.ask("keep me"));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).toEqual({ status: "error", question: "keep me" });
  });

  it("retry resends the kept question", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new TypeError("offline")))
      .mockImplementationOnce(() => reply(200, body()));
    const { result } = renderHook(() => useAsk({ fetchImpl }));
    act(() => result.current.ask("again?", "hi"));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    act(() => result.current.retry());
    expect(result.current.state).toEqual({ status: "answering", question: "again?" });
    await waitFor(() => expect(result.current.state.status).toBe("answer"));
    expect(JSON.parse((fetchImpl.mock.calls[1][1] as RequestInit).body as string)).toEqual({ question: "again?", lang: "hi" });
  });

  it("a new question aborts the one in flight, and only the newer answer lands", async () => {
    const signals: AbortSignal[] = [];
    let resolveFirst: (r: Response) => void = () => {};
    const fetchImpl = vi.fn((_: string, init: RequestInit) => {
      signals.push(init.signal!);
      if (signals.length === 1) return new Promise<Response>((r) => (resolveFirst = r));
      return reply(200, body({ answer: "second" }));
    });
    const { result } = renderHook(() => useAsk({ fetchImpl: fetchImpl as unknown as typeof fetch }));
    act(() => result.current.ask("first"));
    act(() => result.current.ask("second"));
    expect(signals[0].aborted).toBe(true);
    await waitFor(() => expect(result.current.state.status).toBe("answer"));
    await act(async () => resolveFirst(new Response(JSON.stringify(body({ answer: "first" })), { status: 200 })));
    const s = result.current.state;
    expect(s.status === "answer" && s.response.answer).toBe("second");
  });

  it("unmount aborts the request in flight", () => {
    let signal: AbortSignal | undefined;
    const fetchImpl = vi.fn((_: string, init: RequestInit) => {
      signal = init.signal!;
      return new Promise<Response>(() => {});
    });
    const { result, unmount } = renderHook(() => useAsk({ fetchImpl: fetchImpl as unknown as typeof fetch }));
    act(() => result.current.ask("q"));
    unmount();
    expect(signal!.aborted).toBe(true);
  });

  it("a request that hangs past the timeout becomes an error", async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn(
        (_: string, init: RequestInit) =>
          new Promise<Response>((_, reject) => init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
      );
      const { result } = renderHook(() => useAsk({ fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 1000 }));
      act(() => result.current.ask("slow"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1001);
      });
      expect(result.current.state).toEqual({ status: "error", question: "slow" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("a timeout that fires while the body is being read becomes an error, not a stuck 'answering'", async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn((_: string, init: RequestInit) =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
        } as unknown as Response),
      );
      const { result } = renderHook(() => useAsk({ fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 1000 }));
      act(() => result.current.ask("slow body"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1001);
      });
      expect(result.current.state).toEqual({ status: "error", question: "slow body" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("reset aborts and returns to idle", () => {
    let signal: AbortSignal | undefined;
    const fetchImpl = vi.fn((_: string, init: RequestInit) => {
      signal = init.signal!;
      return new Promise<Response>(() => {});
    });
    const { result } = renderHook(() => useAsk({ fetchImpl: fetchImpl as unknown as typeof fetch }));
    act(() => result.current.ask("q"));
    act(() => result.current.reset());
    expect(signal!.aborted).toBe(true);
    expect(result.current.state).toEqual({ status: "idle" });
  });
});
