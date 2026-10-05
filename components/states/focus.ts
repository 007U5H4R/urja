/**
 * Focus management for state changes (WCAG 2.4.3): when a state card appears, or a
 * recovery button replaces it with the working view, focus moves to the page's h1
 * so it never drops to <body>. tabindex="-1" makes the heading focusable without
 * adding it to the tab order.
 */
const pageHeading = () => document.querySelector<HTMLElement>("main h1");

/** Focuses main's h1 now; false when there is none. */
export function focusPageHeading(): boolean {
  const h = pageHeading();
  if (!h) return false;
  if (!h.hasAttribute("tabindex")) h.tabIndex = -1;
  h.focus();
  return true;
}

/**
 * After a navigation starts: waits (up to `timeoutMs`) for an h1 other than the
 * current one, then focuses it. Resolves either way.
 */
export function focusNextPageHeading(timeoutMs = 3000): Promise<void> {
  const before = pageHeading();
  const until = performance.now() + timeoutMs;
  return new Promise((resolve) => {
    const tick = () => {
      const h = pageHeading();
      if (h && h !== before && h.isConnected) {
        focusPageHeading();
        resolve();
      } else if (performance.now() > until) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}
