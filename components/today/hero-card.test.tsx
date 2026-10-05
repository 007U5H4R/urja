// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getToday } from "@/lib/data/views/today";
import { MAP_UNAVAILABLE } from "@/components/map/map-copy";
import { posterImg } from "@/components/ui/poster-img";
import { HeroCard } from "./HeroCard";

// TSK-10.2 / 10.3 (+ Review focus #4): the hero card's switch, glass card, rail and the shared
// selection with "Needs your eyes", with the map stubbed so it never fires `load`.

type Cb = { onSelect: (i: number) => void; onFail: () => void; onReady?: () => void };
const mount = vi.hoisted(() => ({
  calls: [] as { el: HTMLElement; cb: Cb; initial: { view: string; selected: number } }[],
  show: vi.fn(),
  destroy: vi.fn(),
  /** When set, mountHeroMap stays pending until the test calls `release()`. */
  defer: false,
  release: null as null | (() => void),
}));

vi.mock("@/components/map/map-client", () => ({
  // The map never loads: `ready` never settles and onReady is never called.
  mountHeroMap: vi.fn(async (el: HTMLElement, _data: unknown, cb: Cb, initial: { view: string; selected: number }) => {
    mount.calls.push({ el, cb, initial });
    if (mount.defer) await new Promise<void>((res) => (mount.release = res));
    return { ready: new Promise(() => {}), show: mount.show, destroy: mount.destroy };
  }),
}));

const R = "₹";
const t = getToday();
const poster = posterImg(t.heroScene.poster, "(max-width: 1180px) 100vw, 60vw");
const norm = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/’/g, "'");

function renderHero(strict = false) {
  const el = <HeroCard hero={t.hero} fleet={t.fleetNow} scene={t.heroScene} cities={t.mapCities} eyes={t.eyes} eyesHead={t.eyesHead} cleanLine={t.cleanLine} posterImg={poster} />;
  const r = render(strict ? <StrictMode>{el}</StrictMode> : el);
  const card = r.container.querySelector("article.mapcard") as HTMLElement;
  const eyes = r.container.querySelector("article.eyes") as HTMLElement;
  const seg = (name: string) => within(card).getByRole("button", { name });
  const row = (i: number) => eyes.querySelectorAll<HTMLButtonElement>("button.eye-sel")[i];
  const fc = () => card.querySelector("#fc") as HTMLElement;
  const rb = () => card.querySelector("#rb") as HTMLElement;
  return { ...r, card, eyes, seg, row, fc, rb };
}

beforeEach(() => {
  mount.calls.length = 0;
  mount.show.mockClear();
  mount.destroy.mockClear();
  mount.defer = false;
  mount.release = null;
  window.history.replaceState(null, "", "/");
});
afterEach(cleanup);

describe("HeroCard · Scene (default)", () => {
  it("renders the mockup's hero card with the poster, the scene tag and flag 1", () => {
    const h = renderHero();
    expect(h.card.className).toBe("panel mapcard is-scene");
    expect(h.card.getAttribute("aria-labelledby")).toBe("map-h");
    expect(h.card.querySelector(".mc-top h2#map-h")!.textContent).toBe("Where it happened");
    expect(h.seg("Scene").getAttribute("aria-pressed")).toBe("true");
    expect(h.seg("Map").getAttribute("aria-pressed")).toBe("false");
    expect(h.seg("Fleet").getAttribute("aria-pressed")).toBe("false");
    expect([...h.card.querySelectorAll(".seg button")].map((b) => b.getAttribute("data-mode"))).toEqual(["scene", "flags", "fleet"]);
    expect(within(h.card).getByRole("button", { name: "Full screen map" }).id).toBe("fs");

    const scene = h.card.querySelector(".truck3d#scene")!;
    expect(scene.getAttribute("role")).toBe("img");
    expect(scene.getAttribute("aria-label")).toBe(t.heroScene.ariaLabel);
    expect(scene.querySelector("img")!.getAttribute("src")).toContain("truck-scene.png");
    expect(scene.querySelector(".scene-tag")!.getAttribute("aria-hidden")).toBe("true");
    expect(scene.querySelector(".scene-tag small")!.textContent).toBe("Reconstruction from GPS + fuel sensor");

    const map = h.card.querySelector(".map#heroMap")!;
    expect(map.getAttribute("role")).toBe("group");
    expect(map.getAttribute("aria-label")).toBe(t.hero[0].map.ariaLabel);

    expect(h.fc().getAttribute("aria-live")).toBe("polite");
    expect(h.fc().querySelector(".fc-head .plate")!.textContent).toBe("RJ14 GB 4521");
    expect(h.fc().querySelector(".fc-head .subtle")!.textContent).toBe("Trip 0926-04");
    expect(h.fc().querySelector(".route")!.textContent).toBe("Ramesh Kumar · Jaipur → Delhi (Okhla)");
    expect([...h.fc().querySelectorAll("dl div")].map((d) => [d.querySelector("dt")!.textContent, d.querySelector("dd")!.textContent])).toEqual([
      ["Diesel unaccounted", "38 L"],
      ["Where", "Parked near Behror"],
      ["When", "2:14 AM"],
      ["Confidence", "High"],
    ]);
    expect(h.fc().querySelector("p.amt.lit-loss")!.textContent).toBe(`${R}3,420`);
    const cta = h.fc().querySelector("a.btn.btn-lamp")!;
    expect(cta.textContent).toBe("Open the evidence");
    expect(cta.getAttribute("href")).toBe("/trips/0926-04");

    expect(h.rb().querySelector(".rb-head b")!.textContent).toBe("Night of 26–27 Sep");
    expect(h.rb().querySelector(".rb-head span")!.textContent).toBe("286 km on NH48");
    expect(h.rb().querySelector(".rail .knob b")!.textContent).toBe("2:14 AM · −38 L");
    expect([...h.rb().querySelectorAll(".rail-ends span")].map((s) => s.textContent)).toEqual(["9:05 PM · Jaipur", "6:40 AM · Okhla"]);

    expect(h.row(0).getAttribute("aria-pressed")).toBe("true");
  });

  it("puts Needs your eyes before the hero card in the DOM, so the tab order matches the stacked phone order (DES-7, WCAG 2.4.3)", () => {
    const h = renderHero();
    const row = h.container.querySelector("section.hero-row")!;
    expect([...row.children].map((c) => c.className)).toEqual(["panel eyes", "panel mapcard is-scene"]);
  });

  it("does not load the map module while the Scene shows", () => {
    renderHero();
    expect(mount.calls).toHaveLength(0);
  });

  it("row 1 keeps the Scene (it reconstructs flag 1)", () => {
    const h = renderHero();
    fireEvent.click(h.row(0));
    expect(h.seg("Scene").getAttribute("aria-pressed")).toBe("true");
    expect(mount.calls).toHaveLength(0);
  });
});

describe("HeroCard · selection with a map that never loads (Review focus #4, TC-025)", () => {
  it("row 2 switches Scene → Map, lights the row, and updates the glass card and rail", async () => {
    const h = renderHero();
    fireEvent.click(h.row(1));
    expect(h.seg("Map").getAttribute("aria-pressed")).toBe("true");
    expect(h.card.className).toBe("panel mapcard");
    expect(h.row(1).getAttribute("aria-pressed")).toBe("true");
    expect(h.row(0).getAttribute("aria-pressed")).toBe("false");
    expect(h.eyes.querySelectorAll(".eye")[1].className).toBe("eye on");
    expect(h.fc().querySelector(".plate")!.textContent).toBe("RJ14 GA 1182");
    expect(h.fc().querySelector(".subtle")!.textContent).toBe("Trip 0927-02");
    expect(h.rb().querySelector(".rail .knob b")!.textContent).toBe("4:50 PM · bill ≠ tank");
    expect(h.card.querySelector("#heroMap")!.getAttribute("aria-label")).toBe(t.hero[1].map.ariaLabel);
    // The map was asked for, with this state, and never loaded.
    await waitFor(() => expect(mount.calls).toHaveLength(1));
    expect(mount.calls[0].initial).toEqual({ view: "map", selected: 1 });
    expect(h.card.getAttribute("data-map")).toBe("loading");
  });

  it("row 3 shows flag 3 (no knob: no single stop) and the map mirrors the state", async () => {
    const h = renderHero();
    fireEvent.click(h.row(1));
    await waitFor(() => expect(mount.calls).toHaveLength(1));
    fireEvent.click(h.row(2));
    expect(h.row(2).getAttribute("aria-pressed")).toBe("true");
    expect(h.fc().querySelector(".plate")!.textContent).toBe("RJ14 GC 3309");
    expect(norm(h.rb().querySelector(".rb-head span")!.textContent)).toBe("1,150 km · spread across the trip, no single stop");
    expect(h.rb().querySelector(".rail .knob")).toBeNull();
    await waitFor(() => expect(mount.show).toHaveBeenLastCalledWith("map", 2));
  });

  it("a map marker selects its row (marker 3 → row 3)", async () => {
    const h = renderHero();
    fireEvent.click(h.seg("Map"));
    await waitFor(() => expect(mount.calls).toHaveLength(1));
    act(() => mount.calls[0].cb.onSelect(2));
    expect(h.row(2).getAttribute("aria-pressed")).toBe("true");
    expect(h.fc().querySelector(".plate")!.textContent).toBe("RJ14 GC 3309");
  });

  it("Fleet shows the 24 trucks' counts and the Now line; a row then returns to Map", async () => {
    const h = renderHero();
    fireEvent.click(h.seg("Fleet"));
    expect(h.seg("Fleet").getAttribute("aria-pressed")).toBe("true");
    expect(h.fc().querySelector(".fc-head b")!.textContent).toBe("24 trucks");
    expect([...h.fc().querySelectorAll("dl div")].map((d) => [d.querySelector("dt")!.textContent, d.querySelector("dd")!.textContent])).toEqual([
      ["On a trip", "11"],
      ["In a yard", "12"],
      ["Workshop", "1"],
    ]);
    expect(h.fc().querySelector("a.btn.btn-line")!.getAttribute("href")).toBe("#trucks");
    expect(h.rb().querySelector(".rb-head b")!.textContent).toBe("Now, 7:12 AM");
    expect(h.rb().querySelector(".rail")).toBeNull();
    expect(h.card.querySelector("#heroMap")!.getAttribute("aria-label")).toBe(t.fleetNow.ariaLabel);
    await waitFor(() => expect(mount.calls[0].initial).toEqual({ view: "fleet", selected: 0 }));
    fireEvent.click(h.row(1));
    expect(h.seg("Map").getAttribute("aria-pressed")).toBe("true");
    expect(h.fc().querySelector(".plate")!.textContent).toBe("RJ14 GA 1182");
  });

  it("back to Scene resets to flag 1, as the mockup does", () => {
    const h = renderHero();
    fireEvent.click(h.row(2));
    fireEvent.click(h.seg("Scene"));
    expect(h.card.className).toBe("panel mapcard is-scene");
    expect(h.row(0).getAttribute("aria-pressed")).toBe("true");
    expect(h.fc().querySelector(".plate")!.textContent).toBe("RJ14 GB 4521");
  });
});

describe("HeroCard · failure and extras", () => {
  it("shows the failure overlay when the map fails, and the switch and selection keep working (TC-028)", async () => {
    const h = renderHero();
    fireEvent.click(h.seg("Map"));
    await waitFor(() => expect(mount.calls).toHaveLength(1));
    act(() => mount.calls[0].cb.onFail());
    const overlay = h.card.querySelector(".map-fail")!;
    expect(overlay.textContent).toBe(MAP_UNAVAILABLE);
    expect(MAP_UNAVAILABLE).toBe("Map unavailable; every event is in the timeline");
    expect(h.card.getAttribute("data-map")).toBe("failed");
    fireEvent.click(h.row(1));
    expect(h.fc().querySelector(".plate")!.textContent).toBe("RJ14 GA 1182");
    fireEvent.click(h.seg("Fleet"));
    expect(h.fc().querySelector(".fc-head b")!.textContent).toBe("24 trucks");
  });

  it("deep links open the Fleet or a flag on the Map", async () => {
    window.history.replaceState(null, "", "/?view=fleet");
    const a = renderHero();
    await waitFor(() => expect(a.seg("Fleet").getAttribute("aria-pressed")).toBe("true"));
    cleanup();
    window.history.replaceState(null, "", "/?flag=3");
    const b = renderHero();
    await waitFor(() => expect(b.seg("Map").getAttribute("aria-pressed")).toBe("true"));
    expect(b.row(2).getAttribute("aria-pressed")).toBe("true");
  });

  it.each(["?flag=0", "?flag=4", "?flag=abc", "?flag=1.5", "?flag=1", "?view=nope"])("%s keeps the Scene on flag 1", async (q) => {
    window.history.replaceState(null, "", `/${q}`);
    const h = renderHero();
    await act(async () => {});
    expect(h.seg("Scene").getAttribute("aria-pressed")).toBe("true");
    expect(h.row(0).getAttribute("aria-pressed")).toBe("true");
    expect(mount.calls).toHaveLength(0);
  });

  it("unmounting while the map is still mounting destroys it once it arrives", async () => {
    mount.defer = true;
    const h = renderHero();
    fireEvent.click(h.seg("Map"));
    await waitFor(() => expect(mount.release).not.toBeNull());
    h.unmount();
    expect(mount.destroy).not.toHaveBeenCalled();
    await act(async () => mount.release!());
    await waitFor(() => expect(mount.destroy).toHaveBeenCalledTimes(1));
  });

  it("under StrictMode each mount gets its own container, and the discarded one is removed", async () => {
    const h = renderHero(true);
    fireEvent.click(h.seg("Map"));
    await waitFor(() => expect(mount.calls.length).toBeGreaterThanOrEqual(1));
    const box = h.card.querySelector("#heroMap")!;
    await waitFor(() => expect(box.children).toHaveLength(1));
    const live = mount.calls[mount.calls.length - 1].el;
    expect(box.firstElementChild).toBe(live);
    expect(new Set(mount.calls.map((c) => c.el)).size).toBe(mount.calls.length);
  });

  it("the full-screen button toggles the card", () => {
    const h = renderHero();
    const req = vi.fn(() => Promise.resolve());
    (h.card as unknown as { requestFullscreen: () => Promise<void> }).requestFullscreen = req;
    fireEvent.click(within(h.card).getByRole("button", { name: "Full screen map" }));
    expect(req).toHaveBeenCalledTimes(1);
  });

  it("unmounting frees the map", async () => {
    const h = renderHero();
    fireEvent.click(h.seg("Map"));
    await waitFor(() => expect(mount.calls).toHaveLength(1));
    await waitFor(() => expect(mount.show).toHaveBeenCalled());
    h.unmount();
    expect(mount.destroy).toHaveBeenCalledTimes(1);
  });
});
