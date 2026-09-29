"use client";

import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { ASK_OPEN_EVENT } from "@/lib/ask-events";
import type { Bilingual } from "@/lib/data/types";
import type { AskSheetProps } from "./AskSheet";
import { useAsk, type UseAskOptions } from "./useAsk";

export type SheetComponent = ComponentType<AskSheetProps>;

// The drawer (Radix Dialog, ~20 KB gzip) stays out of every route's first-load JS
// (technical-plan §1: Today ≤ 200 KB): its chunk is fetched when the browser is idle,
// or on the first open. A failed fetch is forgotten, so the next open retries.
let sheetChunk: Promise<SheetComponent> | null = null;
export function loadAskSheet(): Promise<SheetComponent> {
  sheetChunk ??= import("./AskSheet")
    .then((m) => m.AskSheet)
    .catch((err: unknown) => {
      sheetChunk = null;
      throw err;
    });
  return sheetChunk;
}

/** A drawer that throws while rendering renders nothing; the page stays, and a new `resetKey` (the next open) retries. */
class SheetBoundary extends Component<
  { resetKey: number; onError: () => void; children: ReactNode },
  { failed: boolean; key: number }
> {
  state = { failed: false, key: this.props.resetKey };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  static getDerivedStateFromProps(props: { resetKey: number }, state: { failed: boolean; key: number }) {
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null;
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Ask Urja, mounted once in app/layout.tsx. It owns the one `useAsk` state and
 * the drawer, and opens it from: ⌘K / Ctrl+K, ASK_OPEN_EVENT (the top-bar
 * AskTrigger and the menu's "Ask Urja"), `/?ask` on Today, and the brief's dock
 * (through `useAskOpener`, which also sends the dock's question).
 */
export type AskOpener = (question?: string, lang?: "hi" | "en") => void;

const AskContext = createContext<AskOpener | null>(null);

/** The provider's opener, or null outside it (the dock then falls back to openAsk()). */
export function useAskOpener(): AskOpener | null {
  return useContext(AskContext);
}

export interface AskProviderProps extends UseAskOptions {
  children?: ReactNode;
  /** '212 trips across 24 trucks, 1–27 Sep' in English and Hindi, computed on the server (components/ask/askScope.ts). */
  scope: Bilingual;
  saved: { hi: string; en: string };
  /** Loads the drawer; injected in tests. */
  loadSheet?: () => Promise<SheetComponent>;
}

const isVisible = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && el.isConnected && el !== document.body && el.getClientRects().length > 0;

export function AskProvider({ children, scope, saved, loadSheet = loadAskSheet, ...options }: AskProviderProps) {
  const ask = useAsk(options);
  const send = ask.ask;
  const [open, setOpen] = useState(false);
  const [Sheet, setSheet] = useState<SheetComponent | null>(null);
  const [attempt, setAttempt] = useState(0);
  const opener = useRef<Element | null>(null);

  const ensureSheet = useCallback(() => {
    if (Sheet) return;
    loadSheet()
      .then((C) => setSheet(() => C))
      .catch(() => setOpen(false));
  }, [Sheet, loadSheet]);

  const openSheet = useCallback<AskOpener>(
    (question, lang) => {
      // Remember the trigger for focus return; a second open while open keeps the first one.
      if (!open) opener.current = document.activeElement;
      ensureSheet();
      setAttempt((n) => n + 1);
      setOpen(true);
      if (question?.trim()) send(question, lang);
    },
    [open, send, ensureSheet],
  );

  // Focus goes back to what opened the sheet, else to the visible Ask trigger (⌘K from the page body).
  const returnFocus = useCallback((): HTMLElement | null => {
    if (isVisible(opener.current)) return opener.current;
    for (const sel of ["#askBtn", ".m-menu summary"]) {
      const el = document.querySelector(sel);
      if (isVisible(el)) return el;
    }
    return null;
  }, []);

  useEffect(() => {
    const onEvent = () => openSheet();
    const onKey = (e: KeyboardEvent) => {
      // `code` keeps the shortcut on non-Latin layouts (a Hindi keyboard's K key); never mid-composition.
      const isK = e.key?.toLowerCase() === "k" || e.code === "KeyK";
      if (e.isComposing || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || !isK) return;
      e.preventDefault();
      const input = open ? document.getElementById("askIn") : null;
      if (input) input.focus();
      else openSheet();
    };
    window.addEventListener(ASK_OPEN_EVENT, onEvent);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(ASK_OPEN_EVENT, onEvent);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, openSheet]);

  // `/?ask` on Today (§3.2; the menu link's no-JS href) opens the sheet once, then drops the param.
  useEffect(() => {
    if (window.location.pathname !== "/") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("ask")) return;
    const t = setTimeout(() => {
      params.delete("ask");
      const qs = params.toString();
      window.history.replaceState(null, "", `/${qs ? `?${qs}` : ""}${window.location.hash}`);
      openSheet();
    }, 0);
    return () => clearTimeout(t);
  }, [openSheet]);

  // Warm the drawer's chunk once the page is idle, so the first ⌘K doesn't wait on the network.
  useEffect(() => {
    const warm = () => ensureSheet();
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(warm, 2000);
    return () => clearTimeout(t);
  }, [ensureSheet]);

  const value = useMemo(() => openSheet, [openSheet]);

  return (
    <AskContext.Provider value={value}>
      {children}
      {Sheet && (
        <SheetBoundary resetKey={attempt} onError={() => setOpen(false)}>
          <Sheet open={open} onOpenChange={setOpen} ask={ask} scope={scope} saved={saved} returnFocus={returnFocus} />
        </SheetBoundary>
      )}
    </AskContext.Provider>
  );
}
