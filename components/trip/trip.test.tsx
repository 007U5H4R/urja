// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getTripView, type TripView } from "@/lib/data/views/trip";
import { FlagCard } from "./FlagCard";
import { FuelSpeedChart } from "./FuelSpeedChart";
import { Timeline } from "./Timeline";
import { TripHead } from "./TripHead";
import { TripLedger } from "./TripLedger";
import { TripMapSlot } from "./TripMapSlot";
import { TripError, TripSkeleton } from "./TripStates";

// TSK-05.2–05.5: final/trip.html markup, every value from getTripView().

/** The rupee sign, spelled out so no TSX file holds a ₹-digit literal (TC-021 static check). */
const R = "₹";
const norm = (s: string | null | undefined) => (s ?? "").replace(/’/g, "'");
const view = (id: string): TripView => getTripView(id)!;

afterEach(cleanup);

describe("TripHead (0926-04)", () => {
  it("renders the plate, h1, meta and the route-normal line", () => {
    const { container } = render(<TripHead head={view("0926-04").head} />);
    expect(container.querySelector(".triphead .title .plate.lg")!.textContent).toBe("RJ14 GB 4521");
    expect(container.querySelector("h1")!.textContent).toBe("Jaipur → Delhi (Okhla)");
    expect(container.querySelector(".meta")!.textContent).toBe(
      "Sat 26 Sep, 9:05 PM → Sun 27 Sep, 6:40 AM · 286 km on NH48 · 24 t cement · Driver Ramesh Kumar",
    );
    expect(container.querySelector(".big")!.textContent).toBe(`${R}13,240profit`);
    expect(container.querySelector(".vs .delta.loss")!.textContent).toBe(`${R}3,420 below`);
    expect(norm(container.querySelector(".vs")!.textContent)).toBe(`${R}3,420 belowthis route's normal of ${R}16,660`);
  });
});

describe("FlagCard + DriverSide (0926-04, R1)", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let xhrSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn();
    xhrSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("XMLHttpRequest", xhrSpy);
    vi.stubGlobal("navigator", { ...navigator, sendBeacon: fetchSpy });
  });
  afterEach(() => vi.unstubAllGlobals());

  const v = view("0926-04");

  it("renders the mockup's flag card", () => {
    const { container } = render(<FlagCard card={v.card} driver={v.driver} />);
    const card = container.querySelector("article.panel.flagcard[aria-labelledby='flag-h']")!;
    expect(card.querySelector(".rule .chip.warn")!.textContent).toBe("Stationary fuel drop");
    expect(card.querySelector(".rule .conf")!.getAttribute("data-level")).toBe("3");
    expect(card.querySelector(".rule .conf")!.textContent).toBe("High confidence");
    expect(card.querySelector("h2#flag-h")!.textContent).toBe("38 L diesel unaccounted");
    expect(card.querySelector(".amt .lit-loss")!.textContent).toBe(`${R}3,420`);
    expect(card.querySelector(".amt .muted")!.textContent).toBe(`at ${R}90 / L`);
    const list = card.querySelector("ul.evidence")!;
    const labelId = list.getAttribute("aria-labelledby")!;
    expect(card.querySelector(`#${labelId}`)!.textContent).toBe("What the truck recorded");
    const items = [...card.querySelectorAll(".evidence li")];
    expect(items.map((li) => [li.querySelector("span")!.textContent, li.querySelector(".src")!.textContent, li.querySelector("use")!.getAttribute("href")])).toEqual([
      ["Fuel fell 168 → 130 L in 26 minutes", "Fuel sensor", "#i-drop"],
      ["Parked with ignition off, 2:08–2:44 AM", "GPS · ignition", "#i-clock"],
      ["1.6 km off NH48; nearest pump is 3.1 km away", "Geofence", "#i-pin"],
      ["Same stretch flagged 4 more times this month", "Fleet history", "#i-route"],
    ]);
    expect(card.querySelector(".why")!.textContent).toBe(
      "Why high: the fuel sensor stayed within ±2 L for the rest of the trip, so a 38 L drop is about 19× its normal noise.",
    );
    expect(card.querySelector(".drv .avatar")!.textContent).toBe("RK");
    expect(card.querySelector(".drv b")!.textContent).toBe("Ramesh Kumar");
    expect(card.querySelector(".drv small")!.textContent).toBe("Driver · with Sharma Roadlines since 2019");
    expect(norm(card.querySelector(".block .chip")!.textContent)).toBe("Ramesh hasn't been asked yet");
    expect(card.querySelector(".fine")!.textContent).toContain("“Fuel dropped 38 L near Behror at 2:14 AM on 27 Sep. Can you tell us what happened?”");
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("'Ask Ramesh on WhatsApp' changes local state, shows the honest note and sends nothing", () => {
    render(<FlagCard card={v.card} driver={v.driver} />);
    fireEvent.click(screen.getByRole("button", { name: "Ask Ramesh on WhatsApp" }));
    expect(screen.getByText("Asked · waiting for Ramesh").className).toBe("chip wait");
    expect(screen.getByRole("status").textContent).toBe(
      "Asked · waiting for Ramesh. Prototype: no message was sent. In Urja this goes to Ramesh on WhatsApp.",
    );
    expect(screen.getByRole("button", { name: "Ask Ramesh on WhatsApp" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Mark as explained" }));
    expect(screen.getByText("Explained · you decide")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "Explained · you decide. Prototype: no message was sent. In Urja this goes to Ramesh on WhatsApp.",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
  });

  it.each(["Call Ramesh", "Message Ramesh"])("the %s icon shows the same note", (name) => {
    render(<FlagCard card={v.card} driver={v.driver} />);
    fireEvent.click(screen.getByRole("button", { name }));
    expect(norm(screen.getByRole("status").textContent)).toBe(
      "Ramesh hasn't been asked yet. Prototype: no message was sent. In Urja this goes to Ramesh on WhatsApp.",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("FlagCard variants", () => {
  it("R2 (0927-02): Likely, and Vikram's reply", () => {
    const v = view("0927-02");
    const { container } = render(<FlagCard card={v.card} driver={v.driver} />);
    expect(container.querySelector(".rule .chip")!.textContent).toBe("Refuel mismatch");
    expect(container.querySelector(".rule .conf")!.textContent).toBe("Likely");
    expect(container.querySelector(".block .chip.wait")!.textContent).toBe("Vikram explained · review");
    expect(container.textContent).toContain("Vikram says: “The nozzle stopped early; I told the attendant.”");
  });

  it("R3 (0926-11): Check, and the load caveat", () => {
    const v = view("0926-11");
    const { container } = render(<FlagCard card={v.card} driver={v.driver} />);
    expect(container.querySelector(".rule .conf")!.getAttribute("data-level")).toBe("1");
    expect(container.querySelector("h2")!.textContent).toBe("Used 39 L more diesel than usual");
    expect(container.textContent).toContain("Spread across the trip, no single stop");
    expect(container.textContent).toContain("Load 26 t (usual 22 t)");
  });

  it("a resolved flag (0901-04, R4) has no actions", () => {
    const v = view("0901-04");
    render(<FlagCard card={v.card} driver={v.driver} />);
    expect(screen.queryByRole("button", { name: /on WhatsApp/ })).toBeNull();
    expect(screen.getByText(`Confirmed · ${R}1,480 recovered`)).toBeTruthy();
  });

  it("a clean trip (0927-09): Every check passed", () => {
    const v = view("0927-09");
    const { container } = render(<FlagCard card={v.card} driver={v.driver} />);
    expect(container.querySelector("h2")!.textContent).toBe("Every check passed");
    expect(container.querySelectorAll(".evidence li")).toHaveLength(5);
    expect(container.querySelector(".rule .chip.ok")).toBeTruthy();
  });

  it("a trip still on the road says so", () => {
    const v = view("0928-05");
    const { container } = render(<FlagCard card={v.card} driver={v.driver} />);
    expect(container.querySelector("h2")!.textContent).toBe("Still on the road");
  });
});

describe("FuelSpeedChart", () => {
  it("R1 (0926-04): two labelled charts (desktop and phone), legend and note", () => {
    const v = view("0926-04");
    const { container } = render(<FuelSpeedChart chart={v.chart} />);
    const desk = container.querySelector(".wave-desk")!;
    const mob = container.querySelector(".wave-mob")!;
    expect(desk.getAttribute("role")).toBe("img");
    expect(desk.getAttribute("aria-label")).toBe(v.chart.label);
    expect(mob.getAttribute("role")).toBe("img");
    expect(mob.getAttribute("aria-label")).toBe(v.chart.phoneLabel);
    expect(container.querySelector(".sec-head .count")!.textContent).toBe("CAN fuel sensor + GPS · every 5 min");
    expect([...container.querySelectorAll(".legend > span")].map((s) => s.textContent)).toEqual(["Fuel", "The drop", "Refuel", "Without the drop"]);
    expect(container.querySelector(".note")!.textContent).toBe("Top: litres in the tank. Below the line: speed. The drop happened while the truck wasn’t moving.");
    const texts = [...desk.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(expect.arrayContaining(["−38 L in 26 min", "parked, ignition off", "+138 L refuel · bill 140 L ✓", "dhaba stop · steady ✓", "9 PM", "6:40 AM"]));
    expect(desk.querySelector("polyline")).toBeTruthy();
  });

  /** The drawn bars above the axis: one per sample, filled by kind. */
  const fuelBars = (svg: Element, n: number) => [...svg.querySelectorAll(":scope > rect")].filter((r) => r.getAttribute("fill")?.startsWith("url(")).slice(0, 2 * n);

  it("R2 variant (0927-02): the refuel window shaded, the bill's dashed line, the loss note", () => {
    const c = view("0927-02").chart;
    const { container } = render(<FuelSpeedChart chart={c} />);
    const svg = container.querySelector(".wave-desk svg")!;
    expect(svg.querySelectorAll("rect[style*='loss-bg']")).toHaveLength(1);
    expect(svg.querySelectorAll("polyline")).toHaveLength(1);
    expect(svg.querySelector("polyline")!.getAttribute("points")!.split(" ")).toHaveLength(c.desk.expected!.length);
    const note = [...svg.querySelectorAll("text")].find((t) => t.textContent === "bill 250 L · tank +200 L")!;
    expect(note.getAttribute("style")).toContain("var(--loss)");
    expect(fuelBars(svg, c.desk.fuel.length).some((r) => r.getAttribute("fill")!.startsWith("url(#hot"))).toBe(true);
    expect([...container.querySelectorAll(".legend > span")].map((s) => s.textContent)).toEqual(["Fuel", "Refuel", "What the bill says"]);
    expect(container.querySelector(".wave-mob")!.getAttribute("aria-label")).toBe(
      "Fuel and speed chart: at 4:50 PM the tank rose 200 litres at Kishangarh, but the bill says 250.",
    );
  });

  it("R3 variant (0926-11): no window, the normal-use dashed line, the loss note", () => {
    const c = view("0926-11").chart;
    const { container } = render(<FuelSpeedChart chart={c} />);
    const svg = container.querySelector(".wave-desk svg")!;
    expect(svg.querySelectorAll("rect[style*='loss-bg']")).toHaveLength(0);
    expect(svg.querySelector("polyline")!.getAttribute("points")!.split(" ")).toHaveLength(c.desk.fuel.length);
    expect(fuelBars(svg, c.desk.fuel.length).some((r) => r.getAttribute("fill")!.startsWith("url(#loss"))).toBe(false);
    expect(container.textContent).toContain("used 364 L · normal 325 L");
    expect(container.querySelector(".wave-desk")!.getAttribute("aria-label")).toContain("The tank ended at 106 litres; at this truck’s normal use it would have ended at 145.");
    expect(container.querySelector(".wave-mob")!.getAttribute("aria-label")).toBe(
      "Fuel and speed chart: this trip used 364 litres against this truck’s normal 325, spread across the trip.",
    );
  });

  it("R5 (0831-02): a claims vs FASTag table instead of the note", () => {
    const { container } = render(<FuelSpeedChart chart={view("0831-02").chart} />);
    expect(container.querySelector("p.note")).toBeNull();
    const table = container.querySelector("table.tbl")!;
    expect(table.querySelectorAll("tbody tr")).toHaveLength(7);
    expect([...table.querySelectorAll("tfoot tr")].map((r) => r.textContent)).toEqual([
      `FASTag total${R}7,400`,
      `Claimed by the driver${R}8,620`,
      `Doesn’t add up${R}1,220`,
    ]);
  });
});

describe("Timeline and TripLedger (0926-04)", () => {
  const v = view("0926-04");

  it("renders 10 events, two of them flagged", () => {
    const { container } = render(<Timeline events={v.timeline} />);
    const items = [...container.querySelectorAll("ol.timeline > li")];
    expect(items).toHaveLength(10);
    expect(items.filter((li) => li.classList.contains("flag"))).toHaveLength(2);
    expect(items[4].querySelector(".v.loss")!.textContent).toBe("−38 L");
    expect(items[6].querySelector(".e")!.textContent).toBe("Refuelled, HP pump NeemranaBill 140 L · tank rose 138 L, matches");
    expect(items[6].querySelector(".dot.ok")).toBeTruthy();
    expect(items[2].querySelector(".v")!.textContent).toBe(`${R}705`);
  });

  it("renders the ledger rows, the lit profit and the route chart", () => {
    const { container } = render(<TripLedger ledger={v.ledger} normal={v.routeNormal} />);
    const rows = [...container.querySelectorAll(".ledgerp .row")];
    expect(rows.map((r) => [r.className, r.textContent])).toEqual([
      ["row", `Freight · 24 t cement${R}28,000`],
      ["row", `Diesel used · 118 L × ${R}90−${R}10,620`],
      ["row indent loss", `of which unaccounted · 38 L−${R}3,420`],
      ["row", `Tolls · FASTag, 3 plazas−${R}2,140`],
      ["row", `Driver allowance−${R}1,200`],
      ["row", `Loading & other−${R}800`],
      ["row total", `Profit${R}13,240`],
    ]);
    expect(rows[6].querySelector(".lit")!.textContent).toBe(`${R}13,240`);
    const chart = container.querySelector(".routechart .chart")!;
    expect(chart.getAttribute("role")).toBe("img");
    expect(chart.querySelectorAll("svg > rect")).toHaveLength(14);
    expect(container.querySelector(".routechart p")!.textContent).toBe(`This route, last 14 trips- - normal ${R}16,660`);
  });

  it("says there's no route history instead of a chart (EXE9)", () => {
    const n = view("0829-01");
    const { container } = render(<TripLedger ledger={n.ledger} normal={n.routeNormal} />);
    expect(container.querySelector(".routechart .chart")).toBeNull();
    expect(norm(container.querySelector(".routechart")!.textContent)).toBe("No earlier clean trip on this route yet, so there's no normal to compare.");
  });
});

describe("TripMapSlot", () => {
  it("keeps the map box for TKT-10, with the legend and the rail", () => {
    const v = view("0926-04");
    const { container } = render(<TripMapSlot map={v.map} rail={v.rail} />);
    expect(container.querySelector("article.mapcard .map#tripMap")!.children).toHaveLength(0);
    expect(container.querySelector(".rb-head b")!.textContent).toBe("Night of 26–27 Sep");
    expect(container.querySelector(".rail .knob b")!.textContent).toBe("2:14 AM · −38 L");
    expect([...container.querySelectorAll(".rail-ends span")].map((s) => s.textContent)).toEqual(["9:05 PM · Jaipur", "6:40 AM · Okhla"]);
    expect(container.querySelector("canvas")).toBeNull();
  });
});

describe("Trip states (Design.md §18)", () => {
  it("loading is a skeleton only, with no progress figures", () => {
    const { container } = render(<TripSkeleton />);
    expect(container.querySelector("main")!.hasAttribute("aria-busy")).toBe(false);
    expect(container.querySelector("[data-skeleton='trip']")!.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector("h1")).toBeNull();
    expect(container.textContent).toBe("Loading this trip");
    expect(container.querySelector("[data-skeleton='flag']")).toBeTruthy();
  });

  it("error says 'Couldn't load this trip' with a retry", () => {
    const retry = vi.fn();
    const { container } = render(<TripError onRetry={retry} />);
    expect(norm(container.querySelector("h1")!.textContent)).toBe("Couldn't load this trip");
    expect(container.textContent).toContain("Nothing is lost");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
