// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ASK_OPEN_EVENT } from "@/lib/ask-events";
import { renderBrief, renderMessage } from "@/lib/brief/template";
import { Brief } from "./Brief";
import { Chat } from "./Chat";

// TKT-06 (TSK-06.2, TSK-06.3): final/brief.html and final/message.html, copy from lib/brief.

// Next's router re-renders useSearchParams() after history.replaceState; the mock does the same.
vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  const subscribe = (cb: () => void) => {
    window.addEventListener("test:url", cb);
    return () => window.removeEventListener("test:url", cb);
  };
  return {
    usePathname: () => window.location.pathname,
    useSearchParams: () => new URLSearchParams(useSyncExternalStore(subscribe, () => window.location.search)),
  };
});
const nativeReplaceState = window.history.replaceState.bind(window.history);
const replaceState = vi.fn((...args: Parameters<History["replaceState"]>) => {
  nativeReplaceState(...args);
  window.dispatchEvent(new Event("test:url"));
});
window.history.replaceState = replaceState;
/** Puts the page at `url` (as the server would have rendered it). */
const at = (url: string) => window.history.replaceState(null, "", url);
const url = () => `${window.location.pathname}${window.location.search}`;

const DAY = "2026-09-27";
const brief = (onlyHigh = false) => ({ hi: renderBrief(DAY, "hi", { onlyHigh }), en: renderBrief(DAY, "en", { onlyHigh }) });
const message = () => ({ hi: renderMessage(DAY, "hi"), en: renderMessage(DAY, "en") });
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

beforeEach(() => {
  at("/brief");
  replaceState.mockClear();
});
afterEach(cleanup);

describe("Brief", () => {
  it("renders Hindi by default under <main lang='hi'>, with the mockup's structure", () => {
    const { container } = render(<Brief copy={brief()} />);
    const main = container.querySelector("main.m")!;
    expect(main.getAttribute("lang")).toBe("hi");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("सुबह का हिसाब");
    expect(main.querySelector(".greet")!.textContent).toBe("सुप्रभात, शर्मा जी");
    expect(main.querySelector(".earned .big")!.textContent).toBe("₹1,86,400");
    expect(main.querySelector(".earned .leak .lit-loss")!.textContent).toBe("₹11,430");
    expect(main.querySelector(".m-sec h2")!.textContent).toBe("इन 3 ट्रिप को देखें");
    expect(norm(main.querySelector(".m .clean")!.textContent)).toBe(
      "बाकी 14 ट्रिप का हिसाब ठीक है — डीज़ल, टोल और किलोमीटर सब मेल खाते हैं।",
    );
    expect(main.querySelector(".m .clean b")!.textContent).toBe("14 ट्रिप");
  });

  it("links each item to its trip, in eye order, with plate, amount, confidence and the driver's side", () => {
    const { container } = render(<Brief copy={brief()} />);
    const items = [...container.querySelectorAll("a.panel.item")];
    expect(items.map((a) => a.getAttribute("href"))).toEqual(["/trips/0926-04", "/trips/0927-02", "/trips/0926-11"]);
    expect(items[0].classList.contains("first")).toBe(true);
    expect(items.map((a) => a.querySelector(".plate")!.textContent)).toEqual(["RJ14 GB 4521", "RJ14 GA 1182", "RJ14 GC 3309"]);
    expect(items.map((a) => a.querySelector(".amt.loss")!.textContent)).toEqual(["₹3,420", "₹4,500", "₹3,510"]);
    expect(items.map((a) => a.querySelector(".conf")!.getAttribute("data-level"))).toEqual(["3", "2", "1"]);
    expect(items.map((a) => norm(a.querySelector(".conf")!.textContent))).toEqual(["पक्का", "शायद", "जाँचें"]);
    expect([...items[1].querySelectorAll(".foot > span")].map((e) => norm(e.textContent))).toEqual(["शायद", "विक्रम ने जवाब दिया", "देखें"]);
  });

  it("draws the 14-day profit bars with yesterday hot, and the weekly bricks", () => {
    const { container } = (at("/brief?lang=en"), render(<Brief copy={brief()} />));
    const days = container.querySelector(".earned .chart")!;
    expect(days.getAttribute("role")).toBe("img");
    expect(days.getAttribute("aria-label")).toBe("Profit over the last 14 days; yesterday was one of the highest");
    const bars = days.querySelectorAll("rect[fill^='url(#dim'], rect[fill^='url(#hot']");
    expect(bars).toHaveLength(14);
    expect(bars[13].getAttribute("fill")).toMatch(/^url\(#hot/);
    const month = screen.getByRole("region", { name: "September so far" });
    expect([...month.querySelectorAll(".v")].map((v) => v.textContent)).toEqual(["₹58,240", "₹21,600"]);
    expect(month.querySelector(".v.lit")!.textContent).toBe("₹21,600");
    expect(within(month).getByRole("img", { name: "Flagged and recovered, week by week" })).toBeTruthy();
    expect(month.querySelector(".cap")!.textContent).toBe("Each block ≈ ₹1,000 · lit = recovered");
  });

  it("switches copy, lang, title, aria-labels and the URL with the toggle", () => {
    at("/brief?only=high");
    const { container } = render(<Brief copy={brief(true)} />);
    const toggle = screen.getByRole("group", { name: "Language / भाषा" });
    const [hiBtn, enBtn] = within(toggle).getAllByRole("button");
    expect(hiBtn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(enBtn);
    expect(enBtn.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("main")!.getAttribute("lang")).toBe("en");
    expect(container.querySelector(".dock")!.getAttribute("lang")).toBe("en");
    expect(document.title).toBe("Morning brief · Urja");
    expect(container.querySelector(".greet")!.textContent).toBe("Good morning, Sharma ji");
    expect(screen.getByRole("region", { name: "September so far" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Ask Urja" }).getAttribute("placeholder")).toBe("Ask anything, in Hindi or English…");
    expect(url()).toBe("/brief?only=high&lang=en");
    expect(document.documentElement.lang).toBe("en");
    fireEvent.click(hiBtn);
    expect(document.title).toBe("सुबह का हिसाब · Urja");
    expect(screen.getByRole("region", { name: "सितंबर अब तक" })).toBeTruthy();
    expect(url()).toBe("/brief?only=high");
    expect(document.documentElement.lang).toBe("hi");
  });

  it("reads the language from ?lang=, sets <html lang> while mounted and restores 'en' after", () => {
    at("/brief?lang=en");
    const { container } = render(<Brief copy={brief()} />);
    expect(container.querySelector("main")!.getAttribute("lang")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    cleanup();
    at("/brief");
    render(<Brief copy={brief()} />);
    expect(document.documentElement.lang).toBe("hi");
    cleanup();
    expect(document.documentElement.lang).toBe("en");
  });

  it("scopes aria-live to the two figures, not the whole card", () => {
    const { container } = render(<Brief copy={brief()} />);
    expect(container.querySelector("section.earned")!.hasAttribute("aria-live")).toBe(false);
    expect([...container.querySelectorAll("[aria-live]")].map((e) => e.textContent)).toEqual(["₹1,86,400", "₹11,430"]);
  });

  it("says everything adds up, with no amount, on a day with nothing unaccounted", () => {
    at("/brief?lang=en");
    const copy = { hi: renderBrief("2026-09-24", "hi"), en: renderBrief("2026-09-24", "en") };
    const { container } = render(<Brief copy={copy} />);
    expect(container.querySelector(".leak")!.textContent).toBe("Everything adds up");
    expect(container.querySelector(".leak .lit-loss")).toBeNull();
  });

  it("with ?only=high shows only the High item and a way back to all of them", () => {
    const { container } = (at("/brief?only=high&lang=en"), render(<Brief copy={brief(true)} />));
    expect(container.querySelectorAll("a.panel.item")).toHaveLength(1);
    expect(container.querySelector(".m-sec h2")!.textContent).toBe("Look at this trip");
    expect(screen.getByRole("link", { name: "Show all 3" }).getAttribute("href")).toBe("/brief?lang=en");
  });

  it("the Ask dock slot opens Ask", () => {
    const opened = vi.fn();
    window.addEventListener(ASK_OPEN_EVENT, opened);
    render(<Brief copy={brief()} />);
    fireEvent.click(screen.getByRole("button", { name: "पूछें" }));
    expect(opened).toHaveBeenCalledTimes(1);
    window.removeEventListener(ASK_OPEN_EVENT, opened);
  });
});

describe("the phone screens' own menu (EXE12)", () => {
  const destinations = ["Morning brief", "Today", "Trucks", "Trips", "Why Urja", "Ask Urja"];
  it.each([
    ["Brief", () => render(<Brief copy={brief()} />), ".m-top"],
    ["Chat", () => render(<Chat copy={message()} host="localhost:3000" />), ".chat-top"],
  ])("%s carries the menu in its own top bar, reaching every destination and Ask", (_, mount, bar) => {
    const { container } = mount();
    const menu = container.querySelector(`${bar} details.m-menu`)!;
    expect(menu).not.toBeNull();
    const nav = within(menu as HTMLElement).getByRole("navigation", { name: "Main (mobile)", hidden: true });
    expect(within(nav).getAllByRole("link", { hidden: true }).map((a) => a.textContent)).toEqual(destinations);
    expect(menu.closest("[lang]")!.getAttribute("lang")).toBe("en");
  });
});

describe("Chat (the 7 AM message)", () => {
  it("shows the real host in the preview card, never urja.app", () => {
    const { container } = render(<Chat copy={message()} host="urja.vercel.app" />);
    const pv = container.querySelector("a.pv")!;
    expect(pv.getAttribute("href")).toBe("/brief");
    expect(pv.getAttribute("aria-label")).toBe("पूरा हिसाब देखें");
    expect(pv.querySelector(".pv-meta b")!.textContent).toBe("आज का हिसाब · Sharma Roadlines");
    expect(pv.querySelector(".pv-meta")!.lastChild!.textContent).toBe("urja.vercel.app");
    expect(container.textContent).not.toContain("urja.app ");
    expect(container.innerHTML).not.toMatch(/urja\.app(?!\w)/);
  });

  it("draws 0926-04's 10-min fuel trace: the drop in loss red, the refuel lit", () => {
    const c = message();
    const { container } = render(<Chat copy={c} host="localhost:3000" />);
    const rects = [...container.querySelectorAll(".pv-art svg rect")];
    expect(rects).toHaveLength(c.hi.preview.trace!.fuel.length);
    const fills = rects.map((r) => (r as SVGElement).style.fill);
    const kinds = c.hi.preview.trace!.kind;
    expect(fills.filter((f) => f === "var(--loss)")).toHaveLength(kinds.filter((k) => k === "flag").length);
    expect(fills.filter((f) => f === "var(--cream)")).toHaveLength(kinds.filter((k) => k === "fuel").length);
  });

  it("links the quick replies per §5.5 and the brief action, in the current language", () => {
    at("/message");
    render(<Chat copy={message()} host="localhost:3000" />);
    expect(screen.getByRole("link", { name: "रमेश से पूछो" }).getAttribute("href")).toBe("/trips/0926-04#driver");
    expect(screen.getByRole("link", { name: "सिर्फ़ पक्के वाले" }).getAttribute("href")).toBe("/brief?only=high");
    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByRole("link", { name: "Ask Ramesh" }).getAttribute("href")).toBe("/trips/0926-04#driver");
    expect(screen.getByRole("link", { name: "Only high ones" }).getAttribute("href")).toBe("/brief?only=high&lang=en");
    expect(document.title).toBe("7 AM message · Urja");
    expect(url()).toBe("/message?lang=en");
    const items = [...document.querySelectorAll(".bubble ol li")].map((li) => norm(li.textContent));
    expect(items[0]).toBe("RJ14 GB 4521 — 38 L diesel down while parked near Behror, 2:14 AM. ₹3,420 · High");
    expect(document.querySelector("main.chat")!.getAttribute("lang")).toBe("en");
  });
});
