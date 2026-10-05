"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { openAsk } from "@/lib/ask-events";
import type { Lang } from "@/lib/data/types";
import { MENU_COPY, isCurrent, isWhyRoute, menuLinks } from "./nav";

/**
 * The ≤760px menu: a native disclosure (final/index.html lines 27–28).
 * While open it closes on Escape (anywhere), on a pointerdown outside it,
 * when a destination is chosen, and when the route changes.
 * On /why there is no Ask item, as in final/why.html line 136.
 * `lang` is set only by the phone screens (EXE23): Hindi items on a Hindi
 * screen, with `lang` on the list; the shell's menu is English. On an English
 * phone screen, Morning brief opens the English brief (DES-21).
 */
export function MobileMenu({ onAskOpen = openAsk, lang }: { onAskOpen?: () => void; lang?: Lang }) {
  const copy = MENU_COPY[lang ?? "en"];
  const pathname = usePathname() ?? "/";
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => {
    if (ref.current) ref.current.open = false;
  };
  const focusToggle = () => ref.current?.querySelector("summary")?.focus();

  // A new route closes the menu.
  useEffect(() => {
    close();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      focusToggle();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const onAsk = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    close();
    focusToggle();
    onAskOpen();
  };

  return (
    <details
      className="m-menu"
      ref={ref}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="iconbtn" aria-label={copy.toggle} lang={lang}>
        <Icon name="menu" />
      </summary>
      <nav aria-label={copy.nav} lang={lang}>
        {menuLinks(lang ?? "en", { phone: lang !== undefined }).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            prefetch={false}
            aria-current={isCurrent(l.href, pathname) ? "page" : undefined}
            onClick={close}
          >
            {l.label}
          </Link>
        ))}
        {isWhyRoute(pathname) ? null : (
          <Link href="/?ask" prefetch={false} aria-haspopup="dialog" onClick={onAsk}>
            {copy.ask}
          </Link>
        )}
      </nav>
    </details>
  );
}
