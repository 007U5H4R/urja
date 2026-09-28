// @vitest-environment jsdom
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Bars } from "./Bars";
import { Bricks } from "./Bricks";
import { Meter } from "./Meter";
import { Rail } from "./Rail";
import { Units } from "./Units";
import { Wave } from "./Wave";

// Edge cases and invariants beyond the mockup's sample inputs (TSK-03.5 review, fix round 1).

function mount(ui: ReactElement): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(ui);
  return host;
}
const noNaN = (host: Element) => expect(host.innerHTML).not.toMatch(/NaN|Infinity/);

describe("Bars degenerate input", () => {
  it("all-zero values draw without NaN", () => {
    noNaN(mount(<Bars values={[0, 0, 0]} refLine={{ v: 0 }} label="z" />));
  });
  it("empty values draw without NaN (baseline only), bracket and labels included", () => {
    const host = mount(<Bars values={[]} labels={[]} refLine={{ v: 1 }} label="e" />);
    noNaN(host);
    expect(host.querySelectorAll("svg > rect")).toHaveLength(0);
  });
  it("a kind array shorter than the values falls back to 'dim'", () => {
    const host = mount(<Bars values={[1, 2, 3]} kind={["hot"]} uid="k" label="k" />);
    const fills = [...host.querySelectorAll("svg > rect")].map((r) => r.getAttribute("fill"));
    expect(fills).toEqual(["url(#hotk)", "url(#dimk)", "url(#dimk)"]);
  });
});

describe("Wave kind fallback", () => {
  it("a kind array shorter than the samples falls back to 'move' (dim fill)", () => {
    const host = mount(<Wave fuel={[100, 90]} speed={[0, 0]} kind={["flag"]} uid="w" label="w" />);
    const fills = [...host.querySelectorAll("svg > rect")].map((r) => r.getAttribute("fill"));
    expect(fills).toEqual(["url(#lossw)", "url(#dimw)"]);
  });
});

describe("Rail degenerate input", () => {
  it.each([
    ["total 0", 0, 5],
    ["total < step", 3, 5],
    ["total = step", 5, 5],
  ])("%s draws at least one tick and no NaN", (_, total, step) => {
    const host = mount(<Rail total={total} step={step} segs={[]} label="r" />);
    noNaN(host);
    expect(host.querySelectorAll("line").length).toBeGreaterThanOrEqual(1);
  });
  it("one tick when total < step", () => {
    expect(mount(<Rail total={3} step={5} segs={[]} label="r" />).querySelectorAll("line")).toHaveLength(1);
  });
  it.each([0, -5])("rejects step %i", (step) => {
    expect(() => renderToStaticMarkup(<Rail total={10} step={step} segs={[]} label="r" />)).toThrow(RangeError);
  });
  it("skips the knob when total ≤ 0", () => {
    const host = mount(<Rail total={0} step={5} segs={[]} knob={{ t: 0, label: "k" }} label="r" />);
    expect(host.querySelector(".knob")).toBeNull();
  });
});

describe("Meter", () => {
  const widths = (host: Element) => [
    (host.querySelector(".val") as HTMLElement).style.width,
    (host.querySelector(".lim") as HTMLElement).style.left,
  ];
  it("max ≤ 0 gives 0%", () => {
    expect(widths(mount(<Meter value={5} limit={10} max={0} />))).toEqual(["0%", "0%"]);
  });
  it("clamps to 0–100%", () => {
    expect(widths(mount(<Meter value={30} limit={-2} max={20} />))).toEqual(["100%", "0%"]);
  });
});

describe("ids", () => {
  const charts: [string, ReactElement][] = [
    ["Bars", <Bars key="b" values={[1, 3, 2, 4]} kind={["dim", "lit", "hatch", "hot"]} stripes label="b" />],
    ["Bricks", <Bricks key="k" cols={[{ n: 5, lit: 2 }]} label="k" />],
    ["Units", <Units key="u" groups={[{ n: 2, kind: "lit" }, { n: 1, kind: "hatch" }, { n: 1, kind: "wrong" }]} label="u" />],
    ["Rail", <Rail key="r" total={10} step={1} segs={[{ from: 2, to: 4, s: "flag" }]} label="r" />],
    ["Wave", <Wave key="w" fuel={[100, 90, 120]} speed={[40, 0, 30]} kind={["move", "flag", "fuel"]} label="w" />],
  ];
  it.each(charts)("every url(#x) in %s resolves to an id in the same svg", (_, ui) => {
    const host = mount(ui);
    const svg = host.querySelector("svg")!;
    const refs = [...svg.outerHTML.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
    for (const id of refs) expect(svg.querySelector(`[id="${id}"]`), id).not.toBeNull();
  });

  it("a stable uid prop takes precedence over useId (sanitised)", () => {
    const html = renderToStaticMarkup(<Bars values={[1]} uid="c-diesel" label="d" />);
    expect(html).toContain('id="litcdiesel"');
    expect(html).toContain("url(#dimcdiesel)");
  });
});

describe("classes and accessibility props", () => {
  it("extraClass appends to the default class; className replaces it", () => {
    expect(mount(<Rail total={2} step={1} segs={[]} label="r" extraClass="trips" />).firstElementChild!.className).toBe("rail trips");
    expect(mount(<Wave fuel={[1]} speed={[0]} kind={["move"]} label="w" className="wave-mob" />).firstElementChild!.className).toBe("wave-mob");
    expect(mount(<Bars values={[1]} label="b" className="x" extraClass="y" />).firstElementChild!.className).toBe("x y");
  });

  it("decorative charts carry no role or label", () => {
    const w = mount(<Rail total={2} step={1} segs={[]} decorative />).firstElementChild!;
    expect(w.hasAttribute("role")).toBe(false);
    expect(w.hasAttribute("aria-label")).toBe(false);
  });

  it("a chart needs a label or an explicit decorative flag (type-level)", () => {
    // @ts-expect-error: neither label nor decorative
    const a = <Bars values={[1]} />;
    // @ts-expect-error: both label and decorative
    const b = <Rail total={1} step={1} segs={[]} label="r" decorative />;
    expect([a, b]).toHaveLength(2);
  });
});
