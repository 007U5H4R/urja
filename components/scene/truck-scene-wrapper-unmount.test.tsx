// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, expect, it, vi } from "vitest";

import TruckScene from "./TruckScene";

// TSK-14.3 · unmounting while the three chunk is still downloading: the probed context is
// released once and the scene is never built. A file of its own because the gate below holds
// the first (and only) evaluation of the mocked './truck-scene' module.

const gate = vi.hoisted(() => {
  let open!: () => void;
  const opened = new Promise<void>((res) => (open = res));
  return { opened, open, requested: false };
});
const createTruckScene = vi.hoisted(() => vi.fn());
const loseContext = vi.hoisted(() => vi.fn());

vi.mock("./gpu-guard", () => ({
  probeWebGL: vi.fn(() => ({ ok: true, canvas: {}, gl: { fake: true } })),
  loseContext,
}));
vi.mock("./truck-scene", async () => {
  gate.requested = true;
  await gate.opened; // the chunk is still loading
  return { createTruckScene };
});

function Harness() {
  const host = useRef<HTMLDivElement>(null);
  return (
    <article>
      <div ref={host} className="truck3d" />
      <TruckScene host={host} active plate="RJ14 GB 4521" onState={() => {}} />
    </article>
  );
}

afterEach(cleanup);

it("releases the probed context once, and never builds the scene, when unmounted mid-download", async () => {
  const r = render(<Harness />);
  await waitFor(() => expect(gate.requested).toBe(true)); // probed, import() in flight
  r.unmount();
  expect(loseContext).not.toHaveBeenCalled();
  await act(async () => gate.open());
  await act(() => new Promise((res) => setTimeout(res, 20)));
  expect(loseContext).toHaveBeenCalledTimes(1);
  expect(loseContext).toHaveBeenCalledWith({ fake: true });
  expect(createTruckScene).not.toHaveBeenCalled();
});
