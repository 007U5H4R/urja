// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { ASK_OPEN_EVENT } from "@/lib/ask-events";
import { AskTrigger } from "./AskTrigger";
import { MobileMenu } from "./MobileMenu";
import { BET_HREF, MENU_COPY, MENU_HREFS, MENU_LINKS, NAV_PILLS, PHONE_ROUTES, isBetRoute, isCurrent, isPhoneRoute, menuLinks } from "./nav";
import { TopBar } from "./TopBar";

afterEach(cleanup);
beforeEach(() => {
  pathname = "/";
});

describe("nav destinations (technical-plan §3)", () => {
  // EXE48: The bet joins the nav after Why Urja: five pills, seven menu destinations.
  it("has the five pills and the seven menu destinations", () => {
    expect(NAV_PILLS.map((p) => [p.label, p.href])).toEqual([
      ["Today", "/"],
      ["Trucks", "/#trucks"],
      ["Trips", "/trips"],
      ["Why Urja", "/why"],
      ["The bet", "/bet"],
    ]);
    expect(MENU_LINKS.map((p) => [p.label, p.href])).toEqual([
      ["Morning brief", "/brief"],
      ["Today", "/"],
      ["Trucks", "/#trucks"],
      ["Trips", "/trips"],
      ["Why Urja", "/why"],
      ["The bet", "/bet"],
    ]);
    expect(BET_HREF).toBe("/bet");
    // Each pill its own sprite icon; The bet's isn't the gauge, which reads as the Urja mark.
    expect(NAV_PILLS.map((p) => p.icon)).toEqual(["today", "truck", "route", "book", "rupee"]);
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
    ["/brief?lang=en", "/brief", true],
    ["/brief?lang=en", "/", false],
    // EXE48: the bet pill is current on the bet's pages, the truck lender views among them.
    ["/bet", "/bet", true],
    ["/bet", "/bet/tiers", true],
    ["/bet", "/trucks/rj14-gb-4521", true],
    ["/bet", "/trucks/rj14-gb-4521/", true],
    ["/bet", "/", false],
    ["/bet", "/why", false],
    ["/bet", "/trips/0926-04", false],
    ["/bet", "/betx", false],
    ["/bet", "/trucksx", false],
    ["/bet", "/trucks", false],
    ["/#trucks", "/trucks/rj14-gb-4521", false],
    ["/trips", "/trucks/rj14-gb-4521", false],
    ["/why", "/bet", false],
  ])("isCurrent(%s, %s) is %s", (href, path, expected) => {
    expect(isCurrent(href, path)).toBe(expected);
  });

  it.each([
    ["/bet", true],
    ["/bet/tiers", true],
    ["/trucks/rj14-gc-7710", true],
    ["/", false],
    ["/why", false],
    ["/trips", false],
    ["/trucks", false],
    ["/betting", false],
  ])("isBetRoute(%s) is %s", (path, expected) => {
    expect(isBetRoute(path)).toBe(expected);
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
    expect(pills.map((a) => a.getAttribute("aria-label"))).toEqual(["Today", "Trucks", "Trips", "Why Urja", "The bet"]);
    expect(pills.map((a) => a.getAttribute("aria-current"))).toEqual(["page", null, null, null, null]);
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

  it.each(["/bet", "/bet/tiers", "/trucks/rj14-gb-4521"])("EXE48: marks The bet, and only it, current on %s", (p) => {
    pathname = p;
    renderBar();
    const pills = within(screen.getByRole("navigation", { name: "Main" })).getAllByRole("link");
    expect(pills.map((a) => a.getAttribute("aria-current"))).toEqual([null, null, null, null, "page"]);
    expect(pills[4].getAttribute("href")).toBe("/bet");
    const menu = within(screen.getByRole("navigation", { name: "Main (mobile)", hidden: true })).getAllByRole("link", { hidden: true });
    expect(menu.map((a) => a.getAttribute("aria-current"))).toEqual([null, null, null, null, null, "page", null]);
  });

  it("lists the seven destinations in the mobile menu (EXE48), with the current one marked", () => {
    // The menu as the phone screens carry it (EXE12: no top bar on /brief and /message).
    pathname = "/brief";
    const { container } = render(<MobileMenu />);
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
      "The bet",
      "Ask Urja",
    ]);
    expect(links.map((a) => a.getAttribute("aria-current"))).toEqual(["page", null, null, null, null, null, null]);
    expect(links[6].getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("EXE23: in Hindi the menu's items, its toggle and its list are Hindi, with the same destinations", () => {
    pathname = "/brief";
    const { container } = render(<MobileMenu lang="hi" />);
    const summary = container.querySelector("details.m-menu > summary.iconbtn")!;
    expect(summary.getAttribute("aria-label")).toBe("मेनू");
    const nav = screen.getByRole("navigation", { name: MENU_COPY.hi.nav, hidden: true });
    expect(nav.getAttribute("lang")).toBe("hi");
    const links = within(nav).getAllByRole("link", { hidden: true });
    expect(links.map((a) => a.textContent)).toEqual(["सुबह का हिसाब", "आज", "ट्रक", "ट्रिप", "Urja क्यों", "दाँव", "Urja से पूछें"]);
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/brief", "/", "/#trucks", "/trips", "/why", "/bet", "/?ask"]);
    expect(links[0].getAttribute("aria-current")).toBe("page");
    expect(menuLinks("hi").map((l) => l.href)).toEqual(MENU_LINKS.map((l) => l.href));
    expect(menuLinks("en")).toBe(MENU_LINKS);
    expect(MENU_LINKS.map((l) => l.href)).toEqual([...MENU_HREFS]);
  });

  it("DES-21: on an English phone screen, Morning brief opens the English brief; the shell's menu keeps /brief", () => {
    pathname = "/brief";
    const { container } = render(<MobileMenu lang="en" />);
    const nav = within(container).getByRole("navigation", { name: "Main (mobile)", hidden: true });
    const links = within(nav).getAllByRole("link", { hidden: true });
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/brief?lang=en", "/", "/#trucks", "/trips", "/why", "/bet", "/?ask"]);
    expect(links[0].getAttribute("aria-current")).toBe("page");
    expect(menuLinks("en", { phone: true }).map((l) => l.label)).toEqual(MENU_LINKS.map((l) => l.label));
    cleanup();
    // The site's own (English) menu, and the brief's English-only state screens, keep the default brief.
    render(<MobileMenu />);
    const shell = screen.getByRole("navigation", { name: "Main (mobile)", hidden: true });
    expect(within(shell).getAllByRole("link", { hidden: true })[0].getAttribute("href")).toBe("/brief");
    expect(menuLinks("hi", { phone: true }).map((l) => l.href)).toEqual(MENU_LINKS.map((l) => l.href));
  });

  it("is English, with no lang of its own, unless told otherwise", () => {
    const { container } = render(<MobileMenu />);
    expect(container.querySelector("details.m-menu nav")!.hasAttribute("lang")).toBe(false);
    expect(MENU_COPY.en).toEqual({ toggle: "Menu", nav: "Main (mobile)", ask: "Ask Urja" });
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

describe("TopBar on /why (final/why.html lines 125–137)", () => {
  beforeEach(() => {
    pathname = "/why";
  });

  it("swaps the ask trigger and fleet chip for the Start the demo button", () => {
    const { container } = renderBar();
    const wrap = container.querySelector("header.topbar > .wrap")!;
    expect([...wrap.children].map((el) => `${el.tagName.toLowerCase()}.${el.className}`)).toEqual([
      "a.wordmark",
      "nav.navpills",
      "div.spacer",
      "a.btn btn-line",
      "details.m-menu",
    ]);
    const demo = screen.getByRole("link", { name: "Start the demo" });
    expect(demo.getAttribute("href")).toBe("/demo");
    expect(container.querySelector(".askbar, .fleet")).toBeNull();
  });

  it("marks Why Urja current, in the pills and the menu, and leaves Ask out of the menu", () => {
    renderBar();
    const pills = screen.getByRole("navigation", { name: "Main" });
    expect(within(pills).getByRole("link", { current: "page" }).getAttribute("aria-label")).toBe("Why Urja");
    const nav = screen.getByRole("navigation", { name: "Main (mobile)", hidden: true });
    const links = within(nav).getAllByRole("link", { hidden: true });
    expect(links.map((a) => a.textContent)).toEqual(["Morning brief", "Today", "Trucks", "Trips", "Why Urja", "The bet"]);
    expect(links.map((a) => a.getAttribute("aria-current"))).toEqual([null, null, null, null, "page", null]);
  });

  it("keeps the default bar on every other route", () => {
    for (const p of ["/", "/briefs", "/messages", "/trips/0926-04", "/whyx", "/bet", "/bet/tiers", "/trucks/rj14-gb-4521", "/demo"]) {
      pathname = p;
      const { container, unmount } = renderBar();
      expect(container.querySelector(".askbar")).not.toBeNull();
      expect(container.querySelector(".fleet")).not.toBeNull();
      expect(container.querySelector(".wrap > a.btn")).toBeNull();
      unmount();
    }
  });
});

describe("TopBar on /demo (TASK-33, EXE49)", () => {
  it("is the default bar, and no pill or menu item is current: /demo is not a nav destination", () => {
    pathname = "/demo";
    renderBar();
    const pills = screen.getByRole("navigation", { name: "Main" });
    expect(within(pills).queryByRole("link", { current: "page" })).toBeNull();
    const nav = screen.getByRole("navigation", { name: "Main (mobile)", hidden: true });
    const items = within(nav).getAllByRole("link", { hidden: true });
    expect(items.length).toBeGreaterThanOrEqual(6);
    expect(items.filter((a) => a.hasAttribute("aria-current"))).toEqual([]);
    expect(NAV_PILLS.map((p) => p.href)).not.toContain("/demo");
    expect(MENU_HREFS).not.toContain("/demo");
  });
});

describe("TopBar on the phone screens (EXE12)", () => {
  it("lists /brief and /message as phone screens, and nothing else", () => {
    expect(PHONE_ROUTES).toEqual(["/brief", "/message"]);
    expect(["/brief", "/message", "/brief/", "/message/"].map(isPhoneRoute)).toEqual([true, true, true, true]);
    expect(["/", "/briefs", "/messages", "/trips", "/why", "/brief/x"].map(isPhoneRoute)).toEqual([false, false, false, false, false, false]);
  });

  it("renders no top bar on /brief and /message: the screen carries its own bar and menu", () => {
    for (const p of ["/brief", "/message"]) {
      pathname = p;
      const { container, unmount } = renderBar();
      expect(container.querySelector("header.topbar")).toBeNull();
      expect(container.querySelector("a.skip")).toBeNull();
      unmount();
    }
  });
});

describe("Skip to content (DES-32)", () => {
  it("is the first focusable element, first in the top bar's banner landmark, and points at #main", () => {
    const { container } = renderBar();
    const first = container.querySelector("a[href], button, input, summary")!;
    expect(first.className).toBe("skip");
    expect(first.textContent).toBe("Skip to content");
    expect(first.getAttribute("href")).toBe("#main");
    expect(first.parentElement!.matches("header.topbar")).toBe(true);
    expect(first.nextElementSibling!.matches(".wrap")).toBe(true);
  });

  it("moves focus into #main", () => {
    const { container } = render(
      <>
        <TopBar fleetName="Verma Carriers" truckCount={7} />
        <main id="main">
          <h1>Today</h1>
        </main>
      </>,
    );
    fireEvent.click(container.querySelector("a.skip")!);
    const main = container.querySelector("main")!;
    expect(document.activeElement).toBe(main);
    expect(main.getAttribute("tabindex")).toBe("-1");
    // Focusable only for the skip: the tabindex goes on blur.
    main.blur();
    expect(main.hasAttribute("tabindex")).toBe(false);
  });

  it("falls back to the first <main> on a page that gives it no id", () => {
    const { container } = render(
      <>
        <TopBar fleetName="Verma Carriers" truckCount={7} />
        <main className="essay">
          <h1>Why Urja</h1>
        </main>
      </>,
    );
    const main = container.querySelector("main.essay")!;
    fireEvent.click(container.querySelector("a.skip")!);
    expect(document.activeElement).toBe(main);
  });
});
