"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Lang } from "@/lib/data/types";

/** `?lang=` → the page language: English only when asked for (Hindi first). */
export const langOf = (params: { get(name: string): string | null } | null): Lang =>
  params?.get("lang") === "en" ? "en" : "hi";

/**
 * The phone screens' language (TSK-06.2), read from `?lang=`: the server
 * renders it on first paint (no script needed), and switching writes the URL
 * with history.replaceState, which Next's router picks up without a server
 * round trip. Other params (`only=`) and the hash are kept; Hindi, the
 * default, leaves `lang` out. While a phone screen is mounted, <html lang>
 * and the title follow too; unmounting restores the shell's "en".
 */
export function useLang(copy: Record<Lang, { title: string }>): [Lang, (l: Lang) => void] {
  const lang = langOf(useSearchParams());

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = copy[lang].title;
  }, [lang, copy]);

  useEffect(
    () => () => {
      document.documentElement.lang = "en";
    },
    [],
  );

  const setLang = useCallback((l: Lang) => {
    const url = new URL(window.location.href);
    if (l === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    // `null` state, as Next documents: passing history.state (which carries Next's own
    // marker) makes the router treat the call as internal and skip syncing useSearchParams.
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  return [lang, setLang];
}
