// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RailBox } from "@/components/today/RailBox";
import { TripMapSlot } from "@/components/trip/TripMapSlot";
import { getToday } from "@/lib/data/views/today";
import { getTripView } from "@/lib/data/views/trip";
import { KNOB_EDGE, knobEdge } from "./Rail";

// DES-10: a knob near either end of the rail would put its centred caption over the rail box's
// head (its title on the left, its note or legend on the right), so there the caption is placed.

afterEach(cleanup);

describe("knobEdge (DES-10)", () => {
  it("is null in the middle 40%", () => {
    expect(KNOB_EDGE).toBe(0.3);
    expect(knobEdge(1000, { t: 300 })).toBeNull();
    expect(knobEdge(1000, { t: 500 })).toBeNull();
    expect(knobEdge(1000, { t: 700 })).toBeNull();
  });

  it("names the end in the outer 30% at either side", () => {
    expect(knobEdge(1000, { t: 0 })).toBe("start");
    expect(knobEdge(1000, { t: 299 })).toBe("start");
    expect(knobEdge(1000, { t: 701 })).toBe("end");
    expect(knobEdge(1000, { t: 1000 })).toBe("end");
  });

  it("is null without a knob or a span", () => {
    expect(knobEdge(1000)).toBeNull();
    expect(knobEdge(0, { t: 0 })).toBeNull();
    expect(knobEdge(-5, { t: 1 })).toBeNull();
  });
});

describe("the rail boxes place an edge knob's caption (DES-10)", () => {
  const today = getToday();
  const heroBox = (i: number) => render(<RailBox content={{ kind: "flag", flag: today.hero[i] }} />).container.querySelector(".railbox")!;

  it("Today: flag 1 (2:14 AM, mid-rail) keeps the centred caption; flag 2 (4:50 PM, near the end) anchors it inward; flag 3 has no knob", () => {
    expect(heroBox(0).className).toBe("glass railbox");
    cleanup();
    expect(heroBox(1).className).toBe("glass railbox knob-end");
    cleanup();
    expect(heroBox(2).className).toBe("glass railbox");
  });

  it.each([
    ["0926-04", "glass railbox"],
    ["0927-02", "glass railbox knob-under"],
    ["0901-04", "glass railbox knob-under"],
  ])("trip %s: %s", (id, cls) => {
    const v = getTripView(id)!;
    const box = render(<TripMapSlot map={v.map} rail={v.rail} />).container.querySelector(".railbox")!;
    expect(box.className).toBe(cls);
  });
});
