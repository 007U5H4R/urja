// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TruckSceneOptions } from "./truck-scene";
import TruckScene, { type SceneState } from "./TruckScene";

// TSK-14.3 · the wrapper: mounts the scene in an idle callback once the Scene view is shown,
// keeps the poster until the first frame, shows keyboard-operable rotate/reset buttons only
// while the live scene is up, pauses when the view changes, and disposes on unmount.

const scene = vi.hoisted(() => ({
  calls: [] as { el: HTMLElement; opts: TruckSceneOptions }[],
  /** What createTruckScene does: "ready" draws a first frame; "software" falls back. */
  mode: "ready" as "ready" | "software" | "reject" | "defer",
  /** In "defer" mode, createTruckScene stays pending until the test calls this. */
  release: null as null | (() => void),
  api: {
    start: vi.fn(),
    stop: vi.fn(),
    renderOnce: vi.fn(),
    rotate: vi.fn(),
    reset: vi.fn(),
    dispose: vi.fn(() => null),
  },
}));

const guard = vi.hoisted(() => ({ software: false, loseContext: vi.fn() }));
vi.mock("./gpu-guard", () => ({
  probeWebGL: vi.fn(() => (guard.software ? { ok: false, reason: "software" } : { ok: true, canvas: {}, gl: { fake: true } })),
  loseContext: guard.loseContext,
}));

vi.mock("./truck-scene", () => ({
  createTruckScene: vi.fn(async (el: HTMLElement, opts: TruckSceneOptions) => {
    scene.calls.push({ el, opts });
    if (scene.mode === "reject") throw new Error("chunk failed");
    if (scene.mode === "defer") {
      await new Promise<void>((res) => (scene.release = res));
      opts.onFirstFrame?.(); // it finished building after the unmount
      return scene.api;
    }
    if (scene.mode === "software") {
      opts.onFallback?.("software");
      return null;
    }
    opts.onFirstFrame?.();
    return scene.api;
  }),
}));

function Harness({ active, onState }: { active: boolean; onState: (s: SceneState) => void }) {
  const host = useRef<HTMLDivElement>(null);
  return (
    <article>
      <div className="seg">
        <button type="button" data-mode="scene">
          Scene
        </button>
      </div>
      <div ref={host} className="truck3d" data-testid="host" />
      <TruckScene host={host} active={active} plate="RJ14 GB 4521" onState={onState} />
    </article>
  );
}

beforeEach(() => {
  scene.calls.length = 0;
  scene.mode = "ready";
  scene.release = null;
  guard.software = false;
  guard.loseContext.mockClear();
  for (const f of Object.values(scene.api)) f.mockClear();
});
afterEach(cleanup);

describe("TruckScene", () => {
  it("mounts the scene after idle, on the host, with the view model's plate", async () => {
    const onState = vi.fn();
    const r = render(<Harness active onState={onState} />);
    expect(scene.calls).toHaveLength(0); // not during the commit: after an idle callback
    await waitFor(() => expect(scene.calls).toHaveLength(1));
    expect(scene.calls[0].el).toBe(r.getByTestId("host"));
    expect(scene.calls[0].opts.plate).toBe("RJ14 GB 4521");
    await waitFor(() => expect(onState).toHaveBeenCalledWith("ready"));
    await waitFor(() => expect(scene.api.start).toHaveBeenCalled());
  });

  it("offers rotate-left, rotate-right and reset as labelled buttons once the first frame is drawn", async () => {
    const r = render(<Harness active onState={() => {}} />);
    const left = await r.findByRole("button", { name: "Rotate the scene left" });
    const right = r.getByRole("button", { name: "Rotate the scene right" });
    const reset = r.getByRole("button", { name: "Reset the scene view" });
    expect(r.getByRole("group", { name: "Scene view" })).toBeTruthy();
    for (const b of [left, right, reset]) expect(b.getAttribute("type")).toBe("button"); // native: Enter and Space work
    fireEvent.click(left);
    fireEvent.click(right);
    fireEvent.click(reset);
    expect(scene.api.rotate.mock.calls).toEqual([[-1], [1]]);
    expect(scene.api.reset).toHaveBeenCalledTimes(1);
  });

  it("keeps the poster when the scene falls back: fallback state, no buttons", async () => {
    scene.mode = "software";
    const onState = vi.fn();
    const r = render(<Harness active onState={onState} />);
    await waitFor(() => expect(onState).toHaveBeenCalledWith("fallback"));
    expect(onState).not.toHaveBeenCalledWith("ready");
    expect(r.queryByRole("group", { name: "Scene view" })).toBeNull();
  });

  it("never fetches three on a software GPU: the probe fails first", async () => {
    guard.software = true;
    const onState = vi.fn();
    const r = render(<Harness active onState={onState} />);
    await waitFor(() => expect(onState).toHaveBeenCalledWith("fallback"));
    await act(() => new Promise((res) => setTimeout(res, 50)));
    expect(scene.calls).toHaveLength(0);
    expect(r.queryByRole("group", { name: "Scene view" })).toBeNull();
  });

  it("hands the probed context to the scene rather than opening a second one", async () => {
    render(<Harness active onState={() => {}} />);
    await waitFor(() => expect(scene.calls).toHaveLength(1));
    expect(scene.calls[0].opts.probe).toEqual({ ok: true, canvas: {}, gl: { fake: true } });
    expect(guard.loseContext).not.toHaveBeenCalled();
  });

  it("falls back when the three chunk fails to load", async () => {
    scene.mode = "reject";
    const onState = vi.fn();
    render(<Harness active onState={onState} />);
    await waitFor(() => expect(onState).toHaveBeenCalledWith("fallback"));
  });

  it("waits for the Scene view before loading anything", async () => {
    const r = render(<Harness active={false} onState={() => {}} />);
    await act(() => new Promise((res) => setTimeout(res, 400)));
    expect(scene.calls).toHaveLength(0);
    r.rerender(<Harness active onState={() => {}} />);
    await waitFor(() => expect(scene.calls).toHaveLength(1));
  });

  it("stops the loop and hides the buttons in the Map view, and restarts on return", async () => {
    const r = render(<Harness active onState={() => {}} />);
    await r.findByRole("button", { name: "Reset the scene view" });
    // The buttons show on the first frame; the loop's first start() lands a tick later, once the
    // scene is handed over. Wait for it before counting, or a slow runner counts it twice.
    await waitFor(() => expect(scene.api.start).toHaveBeenCalled());
    scene.api.start.mockClear();
    r.rerender(<Harness active={false} onState={() => {}} />);
    expect(scene.api.stop).toHaveBeenCalled();
    expect(r.queryByRole("group", { name: "Scene view" })).toBeNull();
    r.rerender(<Harness active onState={() => {}} />);
    expect(scene.api.start).toHaveBeenCalledTimes(1);
    expect(scene.calls).toHaveLength(1); // the same scene, not a second one
  });

  it("disposes the scene on unmount", async () => {
    const r = render(<Harness active onState={() => {}} />);
    await r.findByRole("button", { name: "Reset the scene view" });
    r.unmount();
    expect(scene.api.dispose).toHaveBeenCalledTimes(1);
  });

  it("disposes a scene that finishes building after unmount, and never reports it ready", async () => {
    scene.mode = "defer";
    const onState = vi.fn();
    const r = render(<Harness active onState={onState} />);
    await waitFor(() => expect(scene.calls).toHaveLength(1)); // mid-load: createTruckScene pending
    expect(scene.calls[0].opts.isLive?.()).toBe(true);
    r.unmount();
    expect(scene.calls[0].opts.isLive?.()).toBe(false); // the scene checks this after its font wait
    await act(async () => scene.release!());
    await act(() => new Promise((res) => setTimeout(res, 20)));
    expect(scene.api.dispose).toHaveBeenCalledTimes(1);
    expect(onState).not.toHaveBeenCalledWith("ready");
    expect(scene.api.start).not.toHaveBeenCalled();
  });

  it("moves focus to the Scene switch when the context is lost under a focused scene button", async () => {
    const onState = vi.fn();
    const r = render(<Harness active onState={onState} />);
    const left = await r.findByRole("button", { name: "Rotate the scene left" });
    left.focus();
    expect(document.activeElement).toBe(left);
    act(() => scene.calls[0].opts.onFallback?.("contextlost"));
    await waitFor(() => expect(onState).toHaveBeenCalledWith("fallback"));
    expect(r.queryByRole("button", { name: "Rotate the scene left" })).toBeNull();
    expect(document.activeElement).toBe(r.getByRole("button", { name: "Scene" }));
    expect(scene.api.dispose).toHaveBeenCalledTimes(1);
  });

  it("leaves focus alone on context loss when it is elsewhere", async () => {
    const r = render(<Harness active onState={() => {}} />);
    await r.findByRole("button", { name: "Rotate the scene left" });
    (document.activeElement as HTMLElement | null)?.blur();
    act(() => scene.calls[0].opts.onFallback?.("contextlost"));
    await waitFor(() => expect(r.queryByRole("button", { name: "Rotate the scene left" })).toBeNull());
    expect(document.activeElement).toBe(document.body);
  });
});
