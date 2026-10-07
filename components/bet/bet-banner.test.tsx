// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BET_BANNER, BetBanner } from "./BetBanner";

// TASK-29 (EXE37): the slim text banner that points /why and the trip pages at the bet.

afterEach(cleanup);

const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

describe("BetBanner", () => {
  it("is one line of text with a single link to /bet", () => {
    const { container } = render(<BetBanner />);
    const banner = container.querySelector("p.bet-banner")!;
    expect(banner).not.toBeNull();
    expect(container.children).toHaveLength(1);
    expect(norm(banner.textContent)).toBe("New The SuprFleet bet: from Munshi to credit. See the bet");
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("/bet");
    expect(screen.getByRole("link", { name: BET_BANNER.cta })).toBe(links[0]);
  });

  it("carries no image, so it can never be the page's LCP element", () => {
    const { container } = render(<BetBanner />);
    expect(container.querySelector("img, picture, video, canvas")).toBeNull();
    // The only SVG is the decorative arrow icon, hidden from assistive tech.
    for (const svg of container.querySelectorAll("svg")) expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("labels what is new in words, not colour alone", () => {
    const { container } = render(<BetBanner />);
    expect(container.querySelector(".bet-banner-tag")!.textContent).toBe(BET_BANNER.tag);
    expect(BET_BANNER).toEqual({ tag: "New", text: "The SuprFleet bet: from Munshi to credit.", cta: "See the bet", href: "/bet" });
  });

  it("types no arrow glyph, which would load an extra font face on /why (e2e/perf.spec.ts)", () => {
    const { container } = render(<BetBanner />);
    expect(container.textContent).not.toMatch(/[\u2190\u2192]/);
  });
});
