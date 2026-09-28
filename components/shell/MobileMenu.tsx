"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { openAsk } from "@/lib/ask-events";
import { MENU_LINKS, isCurrent } from "./nav";

/**
 * The ≤760px menu: a native disclosure (final/index.html lines 27–28).
 * While open it closes on Escape (anywhere), on a pointerdown outside it,
 * when a destination is chosen, and when the route changes.
 */
export function MobileMenu({ onAskOpen = openAsk }: { onAskOpen?: () => void }) {
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
      <summary className="iconbtn" aria-label="Menu">
        <Icon name="menu" />
      </summary>
      <nav aria-label="Main (mobile)">
        {MENU_LINKS.map((l) => (
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
        <Link href="/?ask" prefetch={false} aria-haspopup="dialog" onClick={onAsk}>
          Ask Urja
        </Link>
      </nav>
    </details>
  );
}
