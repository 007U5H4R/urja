// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAP_UNAVAILABLE } from "@/components/map/map-copy";
import { getTripView } from "@/lib/data/views/trip";
import { getTripMapView } from "@/lib/data/views/trip-map";
import { TripMapSlot } from "./TripMapSlot";

// TSK-10.4: the route map in the trip page's slot, with MapLibre stubbed (it arrives through import()).

type Cb = { onFail: () => void; onReady?: () => void };
const mount = vi.hoisted(() => ({ calls: [] as { data: Record<string, unknown>; cb: Cb }[], destroy: vi.fn() }));
vi.mock("@/components/map/map-client", () => ({
  mountTripMap: vi.fn(async (_el: HTMLElement, data: Record<string, unknown>, cb: Cb) => {
    mount.calls.push({ data, cb });
    return { ready: new Promise(() => {}), destroy: mount.destroy };
  }),
}));

beforeEach(() => {
  mount.calls.length = 0;
  mount.destroy.mockClear();
});
afterEach(cleanup);

const v = getTripView("0926-04")!;
const route = getTripMapView("0926-04")!;

describe("TripMap in the TripMapSlot", () => {
  it("labels the map box in words (a labelled group, TC-031) and mounts the route map in its own container", async () => {
    const { container } = render(<TripMapSlot map={v.map} rail={v.rail} route={route} />);
    const box = container.querySelector("article.mapcard .map#tripMap")!;
    expect(box.getAttribute("role")).toBe("group");
    expect(box.getAttribute("aria-label")).toBe(route.ariaLabel);
    await waitFor(() => expect(mount.calls).toHaveLength(1));
    expect(box.children).toHaveLength(1);
    expect(mount.calls[0].data).toEqual({
      plan: route.plan,
      actual: route.actual,
      lit: null,
      focus: route.focus,
      events: route.events,
      bounds: route.bounds,
    });
    expect(within(container.querySelector(".mc-top") as HTMLElement).getByRole("button", { name: "Full screen map" })).toBeTruthy();
  });

  it("shows the failure overlay when the map can't load; the legend and rail stay", async () => {
    const { container } = render(<TripMapSlot map={v.map} rail={v.rail} route={route} />);
    await waitFor(() => expect(mount.calls).toHaveLength(1));
    act(() => mount.calls[0].cb.onFail());
    const card = container.querySelector("article.mapcard") as HTMLElement;
    expect(card.querySelector(".map-fail")!.textContent).toBe(MAP_UNAVAILABLE);
    // Not a second role="status": the trip page's driver note already is one.
    expect(within(card).queryByRole("status")).toBeNull();
    expect(card.querySelector(".maplegend")).not.toBeNull();
    expect(card.querySelector(".railbox .rail")).not.toBeNull();
    expect(card.querySelector(".map#tripMap")!.getAttribute("data-map")).toBe("failed");
  });

  it("frees the map on unmount", async () => {
    const r = render(<TripMapSlot map={v.map} rail={v.rail} route={route} />);
    await waitFor(() => expect(mount.calls).toHaveLength(1));
    await Promise.resolve();
    r.unmount();
    await waitFor(() => expect(mount.destroy).toHaveBeenCalledTimes(1));
  });

  it("the full-screen button targets the route card", () => {
    const { container } = render(<TripMapSlot map={v.map} rail={v.rail} route={route} />);
    const card = container.querySelector("#mapcard") as HTMLElement & { requestFullscreen: () => Promise<void> };
    card.requestFullscreen = vi.fn(() => Promise.resolve());
    fireEvent.click(within(card).getByRole("button", { name: "Full screen map" }));
    expect(card.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("without a route the box stays empty and unlabelled (no map code runs)", () => {
    const { container } = render(<TripMapSlot map={v.map} rail={v.rail} />);
    expect(container.querySelector(".map#tripMap")!.getAttribute("role")).toBeNull();
    expect(mount.calls).toHaveLength(0);
  });
});
