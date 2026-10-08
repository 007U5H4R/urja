"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Scrolls `box` so its current tab (`[aria-current="page"]`) sits in the middle. Instant, never smooth. */
export function centreCurrent(box: HTMLElement): void {
  const a = box.querySelector<HTMLElement>('[aria-current="page"]');
  if (!a) return;
  box.scrollLeft = a.offsetLeft - (box.clientWidth - a.offsetWidth) / 2;
}

/** Whether the row is scrolled to its end, so the edge fade can go. */
function markEnd(box: HTMLElement): void {
  box.toggleAttribute("data-at-end", box.scrollLeft + box.clientWidth >= box.scrollWidth - 1);
}

/**
 * TASK-32 fix round 1: the tab bar's scroll box. On mount it centres the current tab, so on a
 * phone it is never off-screen; it marks when the row is scrolled to its end, so the CSS edge
 * fade (the cue that the row scrolls) can drop. The tabs themselves stay server-rendered links.
 */
export function TabsScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    centreCurrent(box);
    markEnd(box);
    const onScroll = () => markEnd(box);
    box.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      box.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div ref={ref} className="bet-tabs-scroll">
      {children}
    </div>
  );
}
