"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "@/lib/data/types";

/**
 * The language of the screen on show, read from <html lang> (EXE23). The server
 * sends lang="hi" on the Hindi brief and message, and the phone screens' toggle
 * (useLang) updates it on the client; every other route is "en". A
 * MutationObserver on that one attribute re-renders on a change (no polling),
 * so the drawer, mounted once in the layout, follows the toggle while open.
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  return () => observer.disconnect();
}

const snapshot = (): Lang => (/^hi\b/i.test(document.documentElement.lang) ? "hi" : "en");
const serverSnapshot = (): Lang => "en";

export function usePageLang(): Lang {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
