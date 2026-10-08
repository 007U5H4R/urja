// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BET_TABS } from "@/content/bet/tabs";
import { BetTabs } from "./BetTabs";

// TASK-32 (EXE49): the tab bar every bet page carries under its head.

afterEach(cleanup);

describe("BetTabs", () => {
  it("is a navigation named The bet, with the seven tabs as links in order", () => {
    render(<BetTabs path="/bet" />);
    const nav = screen.getByRole("navigation", { name: "The bet" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual(BET_TABS.map((t) => [t.label, t.href]));
  });

  it.each([
    ["/bet", "Overview"],
    ["/bet/market", "Where we play"],
    ["/bet/product", "Product"],
    ["/bet/tiers", "Tiers"],
    ["/trucks/rj14-gb-4521", "Lender view"],
    ["/trucks/rj14-gc-7710", "Lender view"],
    ["/bet/plan", "Plan"],
    ["/bet/artifacts", "Artifacts"],
  ])("on %s, marks %s and only it as the current page", (path, label) => {
    render(<BetTabs path={path} />);
    const current = screen.getByRole("navigation", { name: "The bet" }).querySelectorAll('[aria-current="page"]');
    expect([...current].map((a) => a.textContent)).toEqual([label]);
  });

  it("marks no tab current outside the bet", () => {
    render(<BetTabs path="/why" />);
    expect(screen.getByRole("navigation", { name: "The bet" }).querySelectorAll("[aria-current]")).toHaveLength(0);
  });
});
