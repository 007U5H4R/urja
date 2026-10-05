"use client";

import type { MouseEvent } from "react";

/**
 * DES-32: "Skip to content", the first stop on every page with the top bar (inside its banner
 * landmark), visible only when focused (globals.css `.skip`). Every <main> under the top bar has
 * `id="main"`, so before hydration it is a plain fragment link. Once hydrated it moves focus into
 * the page's <main> (`#main`, else the first <main>), making it focusable only for that moment:
 * the tabindex goes again on blur.
 */
export function SkipLink() {
  const skip = (e: MouseEvent<HTMLAnchorElement>) => {
    const main = document.getElementById("main") ?? document.querySelector("main");
    if (!main) return;
    e.preventDefault();
    if (!main.hasAttribute("tabindex")) {
      main.tabIndex = -1;
      main.addEventListener("blur", () => main.removeAttribute("tabindex"), { once: true });
    }
    main.focus();
  };
  return (
    <a className="skip" href="#main" onClick={skip}>
      Skip to content
    </a>
  );
}
