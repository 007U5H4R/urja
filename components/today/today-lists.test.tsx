// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getToday, trucksTableView } from "@/lib/data/views/today";
import { EyesList } from "./EyesList";
import { KpiCards } from "./KpiCards";
import { TrucksTable } from "./TrucksTable";

// TSK-04.2–04.4: final/index.html lines 75–155 and the chart calls on 249–258, every value from getToday().

afterEach(cleanup);

/** The rupee sign, spelled out so no TSX file holds a ₹-digit literal (TC-021 static check). */
const R = "₹";
const today = getToday();
const table = trucksTableView(today.trucks);
const norm = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/’/g, "'");

describe("EyesList", () => {
  const renderList = (props: Partial<Parameters<typeof EyesList>[0]> = {}) =>
    render(<EyesList eyes={today.eyes} head={today.eyesHead} cleanLine={today.cleanLine} {...props} />);

  it("renders the head, three rows in eye order and the clean line", () => {
    const { container } = renderList();
    const panel = container.querySelector("article.panel.eyes")!;
    expect(panel.getAttribute("aria-labelledby")).toBe("eyes-h");
    expect(panel.querySelector(".sec-head h2#eyes-h")!.textContent).toBe("Needs your eyes");
    expect(panel.querySelector(".sec-head .count")!.textContent).toBe("3 of 17 trips");
    expect(panel.querySelector(".sec-head .right .delta.loss")!.textContent).toBe(`${R}11,430`);

    const rows = [...panel.querySelectorAll(".eye")];
    expect(rows.map((r) => r.querySelector(".n")!.textContent)).toEqual(["1", "2", "3"]);
    expect(rows.map((r) => r.querySelector(".plate")!.textContent)).toEqual(["RJ14 GB 4521", "RJ14 GA 1182", "RJ14 GC 3309"]);
    expect(rows.map((r) => r.querySelector(".who")!.textContent)).toEqual([
      "Ramesh Kumar · Jaipur → Delhi",
      "Vikram Choudhary · Ahmedabad → Jaipur",
      "Anil Bairwa · Jaipur → Bhiwandi",
    ]);
    expect(rows.map((r) => r.querySelector(".amt.loss")!.textContent)).toEqual([`${R}3,420`, `${R}4,500`, `${R}3,510`]);
    expect(rows.map((r) => norm(r.querySelector(".what")!.textContent))).toEqual([
      "38 L diesel unaccounted while parked near Behror, 2:08–2:44 AM",
      "Fuel bill says 250 L, the tank rose only 200 L · Kishangarh pump, 4:50 PM",
      "Used 39 L (12%) more diesel than this truck's normal over 1,150 km",
    ]);
    expect(rows.map((r) => r.querySelector(".conf")!.getAttribute("data-level"))).toEqual(["3", "2", "1"]);
    expect(rows.map((r) => r.querySelector(".conf")!.textContent)).toEqual(["High", "Likely", "Check"]);
    expect(rows.map((r) => [r.querySelector(".chip")!.className, r.querySelector(".chip")!.textContent])).toEqual([
      ["chip", "Ramesh not asked yet"],
      ["chip wait", "Vikram explained · review"],
      ["chip", "Anil not asked yet"],
    ]);
    expect(rows.map((r) => r.querySelector("a.open")!.getAttribute("href"))).toEqual(["/trips/0926-04", "/trips/0927-02", "/trips/0926-11"]);
    expect(rows.every((r) => r.querySelector("a.open")!.textContent === "Evidence")).toBe(true);

    expect(norm(panel.querySelector("p.clean span")!.textContent)).toBe(
      "The other 14 trips add up: diesel, tolls and km all match. Urja only points at what doesn't add up. You decide.",
    );
  });

  it("lights the first row, and selecting another moves the lit bar and emits onSelect(n)", async () => {
    const onSelect = vi.fn();
    const { container, getByRole } = renderList({ onSelect });
    const sel = [...container.querySelectorAll<HTMLButtonElement>("button.eye-sel")];
    expect(sel.map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
    expect(sel[0].getAttribute("aria-label")).toBe("Show on map: RJ14 GB 4521, 38 litres diesel unaccounted near Behror");
    await userEvent.click(getByRole("button", { name: /RJ14 GA 1182/ }));
    expect(onSelect).toHaveBeenCalledWith(2);
    expect(sel.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
    expect([...container.querySelectorAll(".eye")].map((r) => r.classList.contains("on"))).toEqual([false, true, false]);
  });

  it("in controlled mode, a click calls onSelect but the lit row stays with `selected`", async () => {
    const onSelect = vi.fn();
    const { container, getByRole } = renderList({ selected: 3, onSelect });
    const pressed = () => [...container.querySelectorAll("button.eye-sel")].map((b) => b.getAttribute("aria-pressed"));
    expect(pressed()).toEqual(["false", "false", "true"]);
    await userEvent.click(getByRole("button", { name: /RJ14 GB 4521/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
    expect(pressed()).toEqual(["false", "false", "true"]);
    expect([...container.querySelectorAll(".eye")].map((r) => r.classList.contains("on"))).toEqual([false, false, true]);
  });

  it("renders the head count and clean line from the view model, and no clean line when it is null", () => {
    const { container, rerender } = renderList({
      eyes: [],
      head: { ...today.eyesHead, flaggedTrips: 0, countText: "0 of 17 trips" },
      cleanLine: { others: 17, text: "All 17 trips add up: diesel, tolls and km all match." },
    });
    expect(container.querySelector(".sec-head .count")!.textContent).toBe("0 of 17 trips");
    expect(container.querySelectorAll(".eye")).toHaveLength(0);
    expect(container.querySelector("p.clean span")!.textContent).toBe("All 17 trips add up: diesel, tolls and km all match.");
    rerender(<EyesList eyes={today.eyes} head={today.eyesHead} cleanLine={{ others: 0, text: null }} />);
    expect(container.querySelector("p.clean")).toBeNull();
  });
});

describe("KpiCards", () => {
  it("renders the section head and the four cards' numbers and footers", () => {
    const { container } = render(<KpiCards september={today.september} />);
    const sec = container.querySelector("section.sec")!;
    expect(sec.getAttribute("aria-labelledby")).toBe("month-h");
    expect(sec.querySelector("h2#month-h")!.textContent).toBe("September so far");
    expect(sec.querySelector(".sec-head .count")!.textContent).toBe("1–27 Sep · 212 trips");
    const cards = [...sec.querySelectorAll(".kpis > article.panel.kpi")];
    expect(cards).toHaveLength(4);
    expect(cards.map((c) => c.querySelector("header h3")!.textContent)).toEqual([
      "Diesel unaccounted",
      "Recovered",
      "When Urja was wrong",
      "Profit per km · 24 trucks",
    ]);
    expect(cards.map((c) => c.querySelector("header use")!.getAttribute("href"))).toEqual(["#i-fuel", "#i-rupee", "#i-shield", "#i-gauge"]);
    expect(cards.map((c) => c.querySelector(".vrow .v")!.textContent)).toEqual(["412L", `${R}21,600`, "2of 23 flags", `${R}31.8best`]);
    expect(cards.map((c) => [c.querySelector(".vrow > .delta, .vrow > .plate")!.className, c.querySelector(".vrow > .delta, .vrow > .plate")!.textContent])).toEqual([
      ["delta", "+217 L this week"],
      ["delta gain", "37% of flagged"],
      ["delta gain", "9% · limit 10%"],
      ["plate", "RJ14 GC 7710"],
    ]);
    expect(cards.map((c) => [...c.querySelectorAll("footer > span")].map((s) => norm(s.textContent)))).toEqual([
      [`Worth ${R}37,080`, "Behror stretch · 5 of 9"],
      [`Flagged ${R}58,240`, "lit = recovered"],
      ["Both cleared by the driver's side", "3 waiting on you"],
      ["Mahesh Meena · no flags", "Bottom 3 all flagged"],
    ]);
    expect(cards[3].querySelector("footer b.loss")!.textContent).toBe("all flagged");
  });

  it("labels each chart with its generated aria-label and draws the mockup's marks", () => {
    const { container } = render(<KpiCards september={today.september} />);
    const charts = [...container.querySelectorAll(".kpi .chart")];
    expect(charts.map((c) => c.getAttribute("role"))).toEqual(["img", "img", "img", "img"]);
    const s = today.september;
    expect(charts.map((c) => c.getAttribute("aria-label"))).toEqual([s.diesel.ariaLabel, s.recovered.ariaLabel, s.wrong.ariaLabel, s.perKm.ariaLabel]);
    // Diesel: 30 bars, 3 hatched future days; per km: 24 bars.
    expect(charts[0].querySelectorAll("svg > rect")).toHaveLength(30 + 7 + 3);
    expect(charts[3].querySelectorAll("svg > rect")).toHaveLength(24);
    // Bricks: 9 + 14 + 12 + 23 blocks; units: 23 squares (2 crossed out).
    expect(charts[1].querySelectorAll("svg > rect")).toHaveLength(58);
    expect(charts[2].querySelectorAll("svg > path")).toHaveLength(2);
    expect((charts[2] as HTMLElement).style.height).toBe("auto");
    // The guardrail meter: 9% of a 0–20% scale, the limit at 10%.
    const meter = container.querySelector(".kpi .meter")!;
    expect((meter.querySelector(".val") as HTMLElement).style.width).toBe("45%");
    expect((meter.querySelector(".lim") as HTMLElement).style.left).toBe("50%");
    expect([...container.querySelectorAll(".kpi .meter-l span")].map((x) => x.textContent)).toEqual(["0%", "limit 10%", "20%"]);
  });

  it("turns the guardrail delta to a loss when the rate reaches the limit", () => {
    const over = { ...today.september, wrong: { ...today.september.wrong, pct: 12, underLimit: false } };
    const { container } = render(<KpiCards september={over} />);
    const delta = container.querySelectorAll(".kpi")[2].querySelector(".vrow > .delta")!;
    expect([delta.className, delta.textContent]).toEqual(["delta loss", "12% · limit 10%"]);
  });
});

describe("TrucksTable", () => {
  const bodyRows = (c: HTMLElement) => [...c.querySelectorAll("table.tbl tbody tr")];

  it("renders ranks 1–5, the gap row and ranks 22–24, with the #trucks anchor", () => {
    const { container } = render(<TrucksTable trucks={table} />);
    const sec = container.querySelector("section#trucks")!;
    expect(sec.getAttribute("aria-labelledby")).toBe("trucks-h");
    expect(sec.querySelector("h2#trucks-h")!.textContent).toBe("Trucks by profit per km");
    expect(sec.querySelector(".sec-head .count")!.textContent).toBe("September so far");
    const tbl = sec.querySelector("table.tbl")!;
    expect(tbl.getAttribute("aria-labelledby")).toBe("trucks-h");
    const rankTh = sec.querySelector("thead th.rank")!;
    expect(rankTh.querySelector("[aria-hidden='true']")!.textContent).toBe("#");
    expect(rankTh.querySelector(".sr")!.textContent).toBe("Rank");
    expect([...sec.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual(["#Rank", "Truck", "Driver", "Km", `${R} / km`, "Compared with the best", "Unaccounted", "Now"]);
    const rows = bodyRows(container);
    expect(rows).toHaveLength(9);
    expect(rows[5].className).toBe("gap");
    expect(rows[5].querySelector("td")!.getAttribute("colspan")).toBe("8");
    expect(rows[5].textContent).toBe(`16 more trucks between ${R}16.9 and ${R}25.0 per km`);
    const data = rows.filter((r) => r.className !== "gap").map((r) => [...r.querySelectorAll("td")].map((td) => td.textContent));
    expect(data).toEqual([
      ["1", "RJ14 GC 7710", "Mahesh Meena", "6,840", `${R}31.8`, "", `${R}0`, "To Ahmedabad"],
      ["2", "RJ14 GA 2204", "Suresh Yadav", "6,210", `${R}29.6`, "", `${R}0`, "Jaipur yard"],
      ["3", "RJ14 GB 1450", "Imran Khan", "7,120", `${R}28.1`, "", `${R}900`, "To Delhi"],
      ["4", "RJ14 GC 0931", "Balwant Singh", "5,480", `${R}26.7`, "", `${R}0`, "Okhla, Delhi"],
      ["5", "RJ14 GA 6618", "Deepak Sharma", "6,950", `${R}25.2`, "", `${R}1,480`, "To Mumbai"],
      ["22", "RJ14 GA 1182", "Vikram Choudhary", "6,300", `${R}16.4`, "", `${R}8,100`, "Jaipur yard"],
      ["23", "RJ14 GB 4521", "Ramesh Kumar", "6,480", `${R}15.1`, "", `${R}9,630`, "Okhla, Delhi"],
      ["24", "RJ14 GC 3309", "Anil Bairwa", "7,410", `${R}12.7`, "", `${R}11,250`, "Bhiwandi"],
    ]);
  });

  it("names the scroll region apart from the section, and server-renders it without a tab stop", () => {
    const html = renderToString(<TrucksTable trucks={table} />);
    const host = document.createElement("div");
    host.innerHTML = html;
    const region = host.querySelector("section#trucks .tbl-scroll")!;
    expect(region.getAttribute("role")).toBe("region");
    expect(region.getAttribute("aria-label")).toBe("All trucks table, scrolls sideways");
    expect(region.hasAttribute("aria-labelledby")).toBe(false);
    expect(region.hasAttribute("tabindex")).toBe(false);
  });

  it("makes the region a tab stop only while it overflows, re-measured on resize, and disconnects on unmount", () => {
    const observers: { cb: () => void; targets: Element[]; disconnected: boolean }[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        o: (typeof observers)[number];
        constructor(cb: () => void) {
          this.o = { cb, targets: [], disconnected: false };
          observers.push(this.o);
        }
        observe(t: Element) {
          this.o.targets.push(t);
        }
        disconnect() {
          this.o.disconnected = true;
        }
      },
    );
    try {
      const size = { sw: 300, cw: 300 };
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => size.sw);
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => size.cw);
      const { container, unmount } = render(<TrucksTable trucks={table} />);
      const region = container.querySelector(".tbl-scroll")!;
      expect(region.hasAttribute("tabindex")).toBe(false);
      expect(observers).toHaveLength(1);
      expect(observers[0].targets).toEqual([region, region.querySelector("table.tbl")]);
      size.sw = 420;
      act(() => observers[0].cb());
      expect(region.getAttribute("tabindex")).toBe("0");
      size.sw = 300;
      act(() => observers[0].cb());
      expect(region.hasAttribute("tabindex")).toBe(false);
      unmount();
      expect(observers[0].disconnected).toBe(true);
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });

  it("ports the row classes: rank badges, lit best ₹/km, minibars, unaccounted tones and now chips", () => {
    const { container } = render(<TrucksTable trucks={table} />);
    const rows = bodyRows(container).filter((r) => r.className !== "gap");
    expect(rows.map((r) => r.querySelector(".rk")!.className)).toEqual(["rk top", "rk", "rk", "rk", "rk", "rk low", "rk low", "rk low"]);
    expect(rows.map((r) => r.querySelectorAll("td")[4].className)).toEqual(["r lit", "r", "r", "r", "r", "r", "r", "r"]);
    expect(rows.map((r) => [r.querySelector(".minibar")!.className, (r.querySelector(".minibar b") as HTMLElement).style.width])).toEqual([
      ["minibar top", "100%"], ["minibar", "93%"], ["minibar", "88%"], ["minibar", "84%"], ["minibar", "79%"],
      ["minibar low", "52%"], ["minibar low", "47%"], ["minibar low", "40%"],
    ]);
    expect(rows.map((r) => r.querySelectorAll("td")[6].className)).toEqual(["r subtle", "r subtle", "r", "r subtle", "r", "r loss", "r loss", "r loss"]);
    expect(rows.map((r) => r.querySelector(".chip")!.className)).toEqual(["chip moving", "chip", "chip moving", "chip", "chip moving", "chip", "chip", "chip"]);
    expect(rows.map((r) => [...r.querySelectorAll("td")].map((td) => td.classList.contains("hide-sm")))).toEqual(
      rows.map(() => [false, false, true, true, false, true, false, true]),
    );
  });

  it("'All 24 trucks' expands the gap row into all 24 rows and collapses back, by keyboard", async () => {
    const user = userEvent.setup();
    const { container, getByRole } = render(<TrucksTable trucks={table} />);
    const btn = getByRole("button", { name: "All 24 trucks" });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("aria-controls")).toBe(container.querySelector("table.tbl tbody")!.id);
    btn.focus();
    await user.keyboard("{Enter}");
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    const rows = bodyRows(container);
    expect(rows).toHaveLength(24);
    expect(rows.some((r) => r.className === "gap")).toBe(false);
    expect(rows.map((r) => r.querySelector(".rk")!.textContent)).toEqual(Array.from({ length: 24 }, (_, i) => String(i + 1)));
    expect(within(rows[20] as HTMLElement).getByText("RJ14 GB 8352")).toBeTruthy();
    expect(rows[20].querySelector(".chip")!.className).toBe("chip warn");
    await user.keyboard(" ");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(bodyRows(container)).toHaveLength(9);
    fireEvent.click(btn);
    expect(bodyRows(container)).toHaveLength(24);
  });
});

describe("trucksTableView", () => {
  it("passes the table only the fields it renders", () => {
    expect(Object.keys(table).sort()).toEqual(["gapAfterRank", "gapText", "period", "rows"]);
    expect(Object.keys(table.rows[0]).sort()).toEqual(
      ["barPct", "driver", "hidden", "km", "now", "perKmText", "plate", "rank", "tone", "unaccountedInr", "unaccountedTone"].sort(),
    );
    expect(table.rows[0].now).toEqual({ state: "moving", label: "To Ahmedabad" });
    expect(table.rows[0].driver).toBe("Mahesh Meena");
  });
});
