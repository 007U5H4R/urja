// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ASK_OPEN_EVENT } from "@/lib/ask-events";
import { renderBrief, renderMessage } from "@/lib/brief/template";
import type { WaveKind } from "@/lib/data/views/trip";
import { Brief } from "./Brief";
import { Chat } from "./Chat";
import { bucketTrace } from "./PreviewCard";

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

describe("the phone screens' own menu (EXE12), in the screen's language (EXE23)", () => {
  const en = ["Morning brief", "Today", "Trucks", "Trips", "Why Urja", "Ask Urja"];
  const hi = ["सुबह का हिसाब", "आज", "ट्रक", "ट्रिप", "Urja क्यों", "Urja से पूछें"];
  const items = (menu: Element) =>
    within(menu.querySelector("nav") as HTMLElement).getAllByRole("link", { hidden: true }).map((a) => a.textContent);
  it.each([
    ["Brief", "/brief", () => render(<Brief copy={brief()} />), ".m-top"],
    ["Chat", "/message", () => render(<Chat copy={message()} host="localhost:3000" />), ".chat-top"],
  ])("%s carries the menu in its own top bar: Hindi on the Hindi screen, English after the toggle", (_, path, mount, bar) => {
    at(path);
    const { container } = mount();
    const menu = container.querySelector(`${bar} details.m-menu`)!;
    expect(menu).not.toBeNull();
    expect(items(menu)).toEqual(hi);
    expect(menu.querySelector("nav")!.getAttribute("lang")).toBe("hi");
    expect(menu.querySelector("summary")!.getAttribute("aria-label")).toBe("मेनू");
    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(items(menu)).toEqual(en);
    expect(menu.querySelector("nav")!.getAttribute("lang")).toBe("en");
    expect(menu.querySelector("summary")!.getAttribute("aria-label")).toBe("Menu");
    fireEvent.click(screen.getByRole("button", { name: "हिं" }));
    expect(items(menu)).toEqual(hi);
  });

  it("is English on first paint with ?lang=en", () => {
    at("/brief?lang=en");
    const { container } = render(<Brief copy={brief()} />);
    expect(items(container.querySelector(".m-top details.m-menu")!)).toEqual(en);
  });
});

describe("bucketTrace (the preview's fuel trace, DES-23)", () => {
  it("keeps a short trace as it is", () => {
    expect(bucketTrace([5, 4, 3], ["move", "flag", "fuel"])).toEqual([
      { litres: 5, kind: "move" },
      { litres: 4, kind: "flag" },
      { litres: 3, kind: "fuel" },
    ]);
  });

  it("buckets a long trace to at most 20 bars: flagged buckets take the minimum, the rest the mean", () => {
    const fuel = Array.from({ length: 59 }, (_, i) => 200 - i);
    const kind = fuel.map((_, i) => (i === 31 ? "flag" : i === 37 ? "fuel" : "move") as WaveKind);
    const bars = bucketTrace(fuel, kind);
    expect(bars).toHaveLength(20);
    // Buckets of 3 readings: 31 falls in bucket 10 (readings 30–32), 37 in bucket 12 (36–38).
    expect(bars[10]).toEqual({ litres: 168, kind: "flag" });
    expect(bars[12]).toEqual({ litres: 163, kind: "fuel" });
    expect(bars[0]).toEqual({ litres: 199, kind: "move" });
    // The last bucket holds the last two readings (57, 58).
    expect(bars[19]).toEqual({ litres: 142.5, kind: "move" });
    expect(bars.filter((b) => b.kind === "flag")).toHaveLength(1);
    expect(bars.filter((b) => b.kind === "fuel")).toHaveLength(1);
  });

  it("marks a bucket flagged when any of its readings is, even beside a refuel", () => {
    const fuel = Array.from({ length: 40 }, () => 100);
    const kind = fuel.map((_, i) => (i === 4 ? "flag" : i === 5 ? "fuel" : "move") as WaveKind);
    fuel[4] = 60;
    const bars = bucketTrace(fuel, kind);
    expect(bars).toHaveLength(20);
    expect(bars[2]).toEqual({ litres: 60, kind: "flag" });
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

  it("draws 0926-04's fuel trace in about 20 bars: the drop in loss red, the refuel lit (DES-23)", () => {
    const c = message();
    const { container } = render(<Chat copy={c} host="localhost:3000" />);
    const trace = c.hi.preview.trace!;
    const bars = bucketTrace(trace.fuel, trace.kind);
    const rects = [...container.querySelectorAll(".pv-art svg rect")];
    // The mockup's density: 20 bars, 5.5 wide in 7.5 slots, not 59 hairlines.
    expect(trace.fuel.length).toBe(59);
    expect(rects).toHaveLength(20);
    expect(rects).toHaveLength(bars.length);
    for (const r of rects) expect(Number(r.getAttribute("width"))).toBeCloseTo(5.5, 1);
    const fills = rects.map((r) => (r as SVGElement).style.fill);
    expect(fills).toEqual(bars.map((b) => ({ flag: "var(--loss)", fuel: "var(--cream)", move: "oklch(0.48 0.008 60)" })[b.kind]));
    expect(fills.filter((f) => f === "var(--loss)").length).toBeGreaterThanOrEqual(1);
    expect(fills.filter((f) => f === "var(--cream)")).toHaveLength(1);
    // The drop reads as a step down: the last flagged bar stands lower than every bar before the drop.
    const heights = rects.map((r) => Number(r.getAttribute("height")));
    const firstFlag = bars.findIndex((b) => b.kind === "flag");
    const lastFlag = bars.findLastIndex((b) => b.kind === "flag");
    expect(heights[lastFlag]).toBeLessThan(Math.min(...heights.slice(0, firstFlag)));
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
