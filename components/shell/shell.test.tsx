// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { ASK_OPEN_EVENT } from "@/lib/ask-events";
import { AskTrigger } from "./AskTrigger";
import { MobileMenu } from "./MobileMenu";
import { MENU_LINKS, NAV_PILLS, isCurrent } from "./nav";
import { TopBar } from "./TopBar";

afterEach(cleanup);
beforeEach(() => {
  pathname = "/";
});

describe("nav destinations (technical-plan §3)", () => {
  it("has the four pills and the six menu destinations", () => {
    expect(NAV_PILLS.map((p) => [p.label, p.href])).toEqual([
      ["Today", "/"],
      ["Trucks", "/#trucks"],
      ["Trips", "/trips"],
      ["Why Urja", "/why"],
    ]);
    expect(MENU_LINKS.map((p) => [p.label, p.href])).toEqual([
      ["Morning brief", "/brief"],
      ["Today", "/"],
      ["Trucks", "/#trucks"],
      ["Trips", "/trips"],
      ["Why Urja", "/why"],
    ]);
  });

  it.each([
    ["/", "/", true],
    ["/", "/trips", false],
    ["/#trucks", "/", false],
    ["/trips", "/trips", true],
    ["/trips", "/trips/0926-04", true],
    ["/trips", "/tripsx", false],
    ["/why", "/why", true],
    ["/brief", "/brief", true],
    ["/brief", "/", false],
  ])("isCurrent(%s, %s) is %s", (href, path, expected) => {
    expect(isCurrent(href, path)).toBe(expected);
  });
});

/** Open the disclosure and let its (async) toggle event reach React. */
async function openMenu(details: HTMLDetailsElement) {
  await act(async () => {
    details.open = true;
    await new Promise((r) => setTimeout(r, 0));
  });
}

function renderBar() {
  return render(<TopBar fleetName="Verma Carriers" truckCount={7} />);
}

describe("TopBar (TKT-03 AC2)", () => {
  it("ports the mockup structure: wordmark, ask trigger, pills, spacer, fleet chip, menu", () => {
    const { container } = renderBar();
    const wrap = container.querySelector("header.topbar > .wrap")!;
    expect([...wrap.children].map((el) => `${el.tagName.toLowerCase()}.${el.className}`)).toEqual([
      "a.wordmark",
      "button.askbar",
      "nav.navpills",
      "div.spacer",
      "span.fleet",
      "details.m-menu",
    ]);
    const wordmark = screen.getByRole("link", { name: "Urja, Today" });
    expect(wordmark.getAttribute("href")).toBe("/");
    expect(wordmark.querySelector(".mark use")!.getAttribute("href")).toBe("#i-mark");
  });

  it("takes the fleet chip from props", () => {
    const { container } = renderBar();
    expect(container.querySelector(".fleet .name")!.textContent).toBe("Verma Carriers · 7 trucks");
    const avatar = container.querySelector(".fleet .avatar")!;
    expect(avatar.textContent).toBe("VC");
    expect(avatar.getAttribute("aria-hidden")).toBe("true");
  });

  it("marks Today as the current pill on /", () => {
    renderBar();
    const nav = screen.getByRole("navigation", { name: "Main" });
    const pills = within(nav).getAllByRole("link");
    expect(pills.map((a) => a.getAttribute("aria-label"))).toEqual(["Today", "Trucks", "Trips", "Why Urja"]);
    expect(pills.map((a) => a.getAttribute("aria-current"))).toEqual(["page", null, null, null]);
    for (const a of pills) {
      expect(a.className).toBe("pill");
      expect(a.querySelector("svg.i use")).not.toBeNull();
      expect(a.querySelector("span.lbl")!.textContent).toBe(a.getAttribute("aria-label"));
    }
  });

  it("marks Trips as current on a trip page", () => {
    pathname = "/trips/0926-04";
    renderBar();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { current: "page" }).getAttribute("aria-label")).toBe("Trips");
  });

  it("lists the six destinations in the mobile menu, with the current one marked", () => {
    pathname = "/brief";
    const { container } = renderBar();
    const summary = container.querySelector("details.m-menu > summary.iconbtn")!;
    expect(summary.getAttribute("aria-label")).toBe("Menu");
    const nav = screen.getByRole("navigation", { name: "Main (mobile)", hidden: true });
    const links = within(nav).getAllByRole("link", { hidden: true });
    expect(links.map((a) => a.textContent)).toEqual([
      "Morning brief",
      "Today",
      "Trucks",
      "Trips",
      "Why Urja",
      "Ask Urja",
    ]);
    expect(links.map((a) => a.getAttribute("aria-current"))).toEqual(["page", null, null, null, null, null]);
    expect(links[5].getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("closes the menu after a destination is chosen", () => {
    const { container } = renderBar();
    const details = container.querySelector("details.m-menu") as HTMLDetailsElement;
    details.open = true;
    // jsdom can't navigate; stop the link's default after React has seen the click.
    const stop = (e: Event) => e.preventDefault();
    window.addEventListener("click", stop);
    fireEvent.click(within(details).getByText("Trips"));
    window.removeEventListener("click", stop);
    expect(details.open).toBe(false);
  });

  it("closes the menu on Escape pressed anywhere, and returns focus to the toggle", async () => {
    const { container } = renderBar();
    const details = container.querySelector("details.m-menu") as HTMLDetailsElement;
    await openMenu(details);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(details.querySelector("summary"));
  });

  it("closes the menu on a pointerdown outside it, not inside it", async () => {
    const { container } = renderBar();
    const details = container.querySelector("details.m-menu") as HTMLDetailsElement;
    await openMenu(details);
    fireEvent.pointerDown(within(details).getByText("Trips"));
    expect(details.open).toBe(true);
    fireEvent.pointerDown(document.body);
    expect(details.open).toBe(false);
  });

  it("closes the menu when the route changes", async () => {
    const { container, rerender } = renderBar();
    const details = container.querySelector("details.m-menu") as HTMLDetailsElement;
    await openMenu(details);
    pathname = "/why";
    rerender(<TopBar fleetName="Verma Carriers" truckCount={7} />);
    expect(details.open).toBe(false);
  });

  it("opens Ask from the menu's Ask Urja item, with focus back on the toggle first", async () => {
    let focusedAtOpen: Element | null = null;
    const onAskOpen = vi.fn(() => {
      focusedAtOpen = document.activeElement;
    });
    const { container } = render(<MobileMenu onAskOpen={onAskOpen} />);
    const details = container.querySelector("details.m-menu") as HTMLDetailsElement;
    await openMenu(details);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    within(details).getByText("Ask Urja").dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(onAskOpen).toHaveBeenCalledTimes(1);
    expect(details.open).toBe(false);
    expect(focusedAtOpen).toBe(details.querySelector("summary"));
  });

  it("the menu's Ask Urja item fires the Ask event by default", async () => {
    const heard = vi.fn();
    window.addEventListener(ASK_OPEN_EVENT, heard);
    const { container } = renderBar();
    const details = container.querySelector("details.m-menu") as HTMLDetailsElement;
    await openMenu(details);
    fireEvent.click(within(details).getByText("Ask Urja"));
    expect(heard).toHaveBeenCalledTimes(1);
    window.removeEventListener(ASK_OPEN_EVENT, heard);
  });
});

describe("AskTrigger", () => {
  it("is the search-field button that announces a dialog", () => {
    const { container } = render(<AskTrigger />);
    const btn = screen.getByRole("button", { name: /ask about any truck, trip or driver/i });
    expect(btn.className).toBe("askbar");
    expect(btn.getAttribute("type")).toBe("button");
    expect(btn.getAttribute("aria-haspopup")).toBe("dialog");
    expect(btn.querySelector("svg.i use")!.getAttribute("href")).toBe("#i-search");
    expect(container.querySelector(".askbar .ph")!.textContent).toBe("Ask about any truck, trip or driver…");
    expect(container.querySelector(".askbar .kbd")!.textContent).toBe("⌘K");
  });

  it("calls onOpen when given one", () => {
    const onOpen = vi.fn();
    render(<AskTrigger onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("dispatches urja:ask-open on window by default", () => {
    const heard = vi.fn();
    window.addEventListener(ASK_OPEN_EVENT, heard);
    render(<AskTrigger />);
    fireEvent.click(screen.getByRole("button"));
    expect(heard).toHaveBeenCalledTimes(1);
    window.removeEventListener(ASK_OPEN_EVENT, heard);
  });
});
