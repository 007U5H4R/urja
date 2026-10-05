// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Bars } from "./Bars";
import { Bricks } from "./Bricks";
import { Meter } from "./Meter";
import { Rail } from "./Rail";
import { Units } from "./Units";
import { Wave } from "./Wave";

// TSK-03.5 / TKT-03 AC3: every chart component draws the same SVG as final/charts.js for the
// mockup's own call sites. The fixture is a verbatim copy of charts.js, run here in jsdom.
// The inputs below (and night0926) are the mockup's sample data, used as test input only.

const root = path.resolve(__dirname, "../..");
const fixture = readFileSync(path.join(root, "tests/fixtures/charts.mockup.js"), "utf8");
const final = (f: string) => readFileSync(path.join(root, ".design/exploration/final", f), "utf8");

type Draw = (host: Element, o: unknown) => void;
interface Mockup {
  bars: Draw;
  bricks: Draw;
  units: Draw;
  rail: Draw;
  wave: Draw;
  night0926: (step: number) => { fuel: number[]; speed: number[]; kind: string[]; step?: number };
}
const mock = new Function(
  `${fixture}\nreturn { bars, bricks, units, rail, wave, night0926 };`,
)() as Mockup;

it("the fixture is a verbatim copy of final/charts.js", () => {
  expect(fixture).toBe(final("charts.js"));
});

/* ---------- normalisation ---------- */

const DEF_IDS = /\b(dimdown|dim|lit|hot|loss|hatch|stripe|glow)[A-Za-z0-9_-]*/;
const normId = (v: string) => v.replace(new RegExp(`^${DEF_IDS.source}$`), "$1");
const normUrl = (v: string) => v.replace(new RegExp(`url\\(#${DEF_IDS.source}\\)`, "g"), "url(#$1)");
const normStyle = (v: string) =>
  v
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const i = d.indexOf(":");
      return `${d.slice(0, i).trim()}:${d.slice(i + 1).trim()}`;
    })
    .join(";");

/** A structural dump of an element tree: tag, every attribute (ids and styles normalised), text. */
function dump(el: Element, depth = 0): string[] {
  const attrs = [...el.attributes]
    .map((a) => {
      const v = a.name === "id" ? normId(a.value) : a.name === "style" ? normStyle(a.value) : normUrl(a.value);
      return `${a.name}="${v}"`;
    })
    .sort();
  const pad = "  ".repeat(depth);
  const out = [`${pad}<${el.localName}${attrs.length ? " " + attrs.join(" ") : ""}>`];
  for (const n of el.childNodes) {
    if (n.nodeType === 1) out.push(...dump(n as Element, depth + 1));
    else if (n.nodeType === 3 && n.textContent?.trim()) out.push(`${pad}  "${n.textContent}"`);
  }
  return out;
}

/** What charts.js writes into its host element. */
function mockupOut(fn: Draw, o: unknown): string[] {
  const host = document.createElement("div");
  fn(host, o);
  return [...host.children].flatMap((c) => dump(c));
}

/** What the component renders inside its role="img" wrapper, server-rendered. */
function reactOut(ui: ReactElement): { wrapper: Element; out: string[] } {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(ui);
  const wrapper = host.firstElementChild!;
  return { wrapper, out: [...wrapper.children].flatMap((c) => dump(c)) };
}

const GEOMETRY = ["rect", "line", "path", "circle", "polyline"];
const count = (out: string[], tag: string) => out.filter((l) => l.trimStart().startsWith(`<${tag} `)).length;

function expectParity(fn: Draw, o: object, ui: ReactElement, label: string, className: string) {
  const want = mockupOut(fn, o);
  const { wrapper, out } = reactOut(ui);
  expect(out).toEqual(want);
  // Sanity: the comparison really covered geometry.
  expect(GEOMETRY.reduce((n, t) => n + count(out, t), 0)).toBeGreaterThan(0);
  expect(wrapper.getAttribute("class")).toBe(className);
  if (label) {
    expect(wrapper.getAttribute("role")).toBe("img");
    expect(wrapper.getAttribute("aria-label")).toBe(label);
  } else {
    // Decorative: the surrounding text carries the meaning, so no role and no label.
    expect(wrapper.hasAttribute("role")).toBe(false);
    expect(wrapper.hasAttribute("aria-label")).toBe(false);
  }
}

/* ---------- final/index.html ---------- */

describe("index.html call sites", () => {
  // index.html lines 250–258
  const cum = [0, 0, 0, 0, 40, 40, 40, 40, 78, 78, 78, 147, 147, 147, 147, 147, 195, 195, 195, 195, 237, 237, 285, 285, 285, 285, 412, 412, 412, 412];
  const steps = [5, 9, 12, 17, 21, 23];
  const perkm = [31.8, 29.6, 28.1, 26.7, 25.2, 25.0, 24.3, 23.8, 23.1, 22.6, 22.0, 21.4, 20.9, 20.3, 19.8, 19.2, 18.7, 18.1, 17.6, 17.2, 16.9, 16.4, 15.1, 12.7];

  it("bars #c-diesel (bracket, stripes, lit, hot and hatched future days, labels)", () => {
    const o = {
      values: cum.map((v) => v || 3), max: 440, stripes: true, bracket: { from: 20, to: 26 },
      kind: (i: number) => (i === 26 ? "hot" : i > 26 ? "hatch" : steps.includes(i + 1) ? "lit" : "dim") as "hot",
      labels: cum.map((_, i) => ([0, 7, 14, 21, 29].includes(i) ? i + 1 : null)),
    };
    expectParity(mock.bars, o, <Bars {...o} label="diesel" />, "diesel", "chart");
    // The array form of `kind` draws the same chart.
    const kinds = o.values.map((_, i) => o.kind(i));
    expect(reactOut(<Bars {...o} kind={kinds} label="d" />).out).toEqual(mockupOut(mock.bars, o));
  });

  it("bricks #c-caught", () => {
    const o = { cols: [{ n: 9, lit: 6 }, { n: 14, lit: 8 }, { n: 12, lit: 5 }, { n: 23, lit: 2 }], labels: ["1–7", "8–14", "15–21", "22–27"] };
    expectParity(mock.bricks, o, <Bricks {...o} label="caught" />, "caught", "chart");
  });

  it("units #c-wrong (lit, hatch, wrong)", () => {
    const o = { groups: [{ n: 18, kind: "lit" as const }, { n: 3, kind: "hatch" as const }, { n: 2, kind: "wrong" as const }], perRow: 12, h: 34 };
    const { wrapper } = reactOut(<Units {...o} label="wrong" style={{ height: "auto" }} />);
    expect(wrapper.getAttribute("style")).toBe("height:auto");
    expectParity(mock.units, o, <Units {...o} label="wrong" />, "wrong", "chart");
    expect(count(mockupOut(mock.units, o), "path")).toBe(2);
  });

  it("bars #c-perkm (hot best, loss worst, sparse labels)", () => {
    const o = {
      values: perkm, max: 34,
      kind: (i: number) => (i === 0 ? "hot" : i > 20 ? "loss" : "dim") as "hot",
      labels: perkm.map((_, i) => (i === 0 ? "best" : i === 23 ? "worst" : null)),
    };
    expectParity(mock.bars, o, <Bars {...o} label="perkm" />, "perkm", "chart");
  });

  it("meter under #c-wrong matches index.html lines 124–125", () => {
    const lines = final("index.html").split("\n");
    const want = lines.slice(123, 125).map((l) => l.trim()).join("");
    const got = renderToStaticMarkup(<Meter value={9} limit={10} max={20} labels={["0%", "limit 10%", "20%"]} />);
    const norm = (h: string) => {
      const d = document.createElement("div");
      d.innerHTML = h;
      return [...d.children].flatMap((c) => dump(c));
    };
    expect(norm(got)).toEqual(norm(want));
  });

  const FL_RAILS = [
    { total: 575, step: 5, segs: [{ from: 96, to: 144, s: "stop" }, { from: 304, to: 308, s: "stop" }, { from: 309, to: 335, s: "flag" }, { from: 336, to: 338, s: "stop" }, { from: 361, to: 365, s: "stop" }, { from: 366, to: 372, s: "fuel" }], knob: { t: 309, label: "2:14 AM · −38 L" } },
    { total: 910, step: 10, segs: [{ from: 240, to: 290, s: "stop" }, { from: 560, to: 600, s: "stop" }, { from: 775, to: 790, s: "flag" }], knob: { t: 780, label: "4:50 PM · bill ≠ tank" } },
    { total: 1660, step: 20, segs: [{ from: 240, to: 280, s: "stop" }, { from: 540, to: 580, s: "stop" }, { from: 1140, to: 1410, s: "stop" }] },
  ] as const;

  it.each(FL_RAILS.map((r, i) => [i + 1, r] as const))("rail for flag %i (hero glass card)", (_, r) => {
    const o = { ...r, segs: r.segs.map((s) => ({ ...s })) };
    // In the railbox the rail has no role of its own: the rb-head and rail-ends are its text.
    expectParity(mock.rail, o, <Rail {...o} decorative />, "", "rail");
  });
});

/* ---------- final/trip.html ---------- */

describe("trip.html call sites", () => {
  // trip.html line 140: expected tank level without the drop, from the drop onward
  const exp = (d: { fuel: number[]; step: number }) => {
    const pts: [number, number][] = [];
    for (let t = 309; t <= 575; t += d.step) {
      const i = Math.round(t / d.step);
      pts.push([i, d.fuel[i] + (t < 335 ? (38 * (t - 309)) / 26 : 38)]);
    }
    return pts;
  };

  it("rail #rail (with the knob)", () => {
    const o = { total: 575, step: 5, segs: [{ from: 96, to: 144, s: "stop" }, { from: 304, to: 308, s: "stop" }, { from: 309, to: 335, s: "flag" }, { from: 336, to: 338, s: "stop" }, { from: 361, to: 365, s: "stop" }, { from: 366, to: 372, s: "fuel" }], knob: { t: 309, label: "2:14 AM · −38 L" } } as const;
    const want = mockupOut(mock.rail, o);
    expect(want.some((l) => l.includes("<span") && l.includes('class="knob"'))).toBe(true);
    expectParity(mock.rail, o, <Rail {...o} decorative />, "", "rail");
  });

  it("wave #wave (desktop: window, expected line, notes, times)", () => {
    const D = { ...mock.night0926(5), step: 5 };
    const o = {
      fuel: D.fuel, speed: D.speed, kind: (i: number) => D.kind[i] as "flag", window: [62, 67] as [number, number], expected: exp(D), h: 300,
      notes: [
        { i: 61, y: 66, a: "end" as const, text: "−38 L in 26 min", c: "var(--loss)", w: 600, fs: 13 },
        { i: 61, y: 83, a: "end" as const, text: "parked, ignition off", fs: 12 },
        { i: 75, y: 12, text: "+138 L refuel · bill 140 L ✓", fs: 12 },
        { i: 19, y: 70, text: "dhaba stop · steady ✓", fs: 12 },
      ],
      times: [{ i: 1, text: "9 PM" }, { i: 23, text: "11 PM" }, { i: 47, text: "1 AM" }, { i: 71, text: "3 AM" }, { i: 95, text: "5 AM" }, { i: 114, text: "6:40 AM" }],
    };
    expectParity(mock.wave, o, <Wave {...o} label="wave" className="wave-desk" />, "wave", "wave-desk");
    expect(count(mockupOut(mock.wave, o), "polyline")).toBe(1);
  });

  it("wave #waveM (phone: w 360, h 250, gap 1.2, fs 12)", () => {
    const M = { ...mock.night0926(10), step: 10 };
    const o = {
      fuel: M.fuel, speed: M.speed, kind: M.kind as "flag"[], window: [31, 33] as [number, number], expected: exp(M), w: 360, h: 250, gap: 1.2, fs: 12,
      notes: [{ i: 30, y: 58, a: "end" as const, text: "−38 L, parked", c: "var(--loss)", w: 600, fs: 13 }, { i: 38, y: 11, text: "+138 L ✓", fs: 12 }],
      times: [{ i: 1, text: "9 PM" }, { i: 24, text: "1 AM" }, { i: 48, text: "5 AM" }],
    };
    const mo = { ...o, kind: (i: number) => M.kind[i] };
    const want = mockupOut(mock.wave, mo);
    const { wrapper, out } = reactOut(<Wave {...o} label="waveM" className="wave-mob" />);
    expect(out).toEqual(want);
    expect(wrapper.getAttribute("class")).toBe("wave-mob");
  });

  it("bars #c-route (dashed reference line, one loss bar)", () => {
    const route = [16.2, 17.1, 16.9, 15.8, 17.4, 16.5, 16.1, 17.0, 16.8, 16.3, 17.2, 16.6, 16.7, 13.24];
    const o = { values: route, max: 18.5, ref: { v: 16.66 }, kind: (i: number) => (i === 13 ? "loss" : "dim") as "loss" };
    const { ref, ...rest } = o;
    expectParity(mock.bars, o, <Bars {...rest} refLine={ref} label="route" />, "route", "chart");
    expect(count(mockupOut(mock.bars, o), "line")).toBe(2);
  });
});

/* ---------- final/brief.html ---------- */

describe("brief.html call sites", () => {
  it("bars #c-days (defaults: no labels, no bracket; stripes on the hot bar)", () => {
    const days = [1.42, 1.61, 0.98, 1.77, 1.55, 1.3, 1.88, 1.49, 1.66, 1.21, 1.948, 1.58, 1.72, 1.864];
    const o = { values: days, max: 2.1, stripes: true, kind: (i: number) => (i === 13 ? "hot" : "dim") as "hot" };
    expectParity(mock.bars, o, <Bars {...o} label="days" />, "days", "chart");
  });

  it("bars with no max, gap, w or h uses charts.js defaults", () => {
    const o = { values: [3, 5, 8, 2], w: 200, h: 60, gap: 4 };
    expectParity(mock.bars, o, <Bars {...o} label="x" />, "x", "chart");
    const d = { values: [3, 5, 8, 2] };
    expectParity(mock.bars, d, <Bars {...d} label="x" />, "x", "chart");
  });

  it("bricks #c-weeks", () => {
    const o = { cols: [{ n: 9, lit: 6 }, { n: 14, lit: 8 }, { n: 12, lit: 5 }, { n: 23, lit: 2 }], labels: ["1–7", "8–14", "15–21", "22–27"] };
    expectParity(mock.bricks, o, <Bricks {...o} label="weeks" />, "weeks", "chart");
  });
});

/* ---------- final/states.html ---------- */

describe("states.html call sites", () => {
  it("rail #r-load (one tick per trip)", () => {
    const o = { total: 16, step: 1, segs: [{ from: 11, to: 16, s: "stop" as const }] };
    expectParity(mock.rail, o, <Rail {...o} label="load" extraClass="trips" />, "load", "rail trips");
  });

  it("rail #r-clean", () => {
    const o = { total: 16, step: 1, segs: [] };
    expectParity(mock.rail, o, <Rail {...o} label="clean" />, "clean", "rail");
  });
});

/* ---------- ids ---------- */

it("two charts on one page get distinct gradient ids", () => {
  const html = renderToStaticMarkup(
    <>
      <Bars values={[1, 2]} label="a" />
      <Bars values={[1, 2]} label="b" />
    </>,
  );
  const ids = [...html.matchAll(/id="(lit[^"]*)"/g)].map((m) => m[1]);
  expect(ids).toHaveLength(2);
  expect(new Set(ids).size).toBe(2);
  for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
});
