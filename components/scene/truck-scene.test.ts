// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// TSK-14.2 · the guard inside createTruckScene: a missing WebGL2 context or a software renderer
// resolves null (the poster stays), never constructs three's WebGLRenderer (whose failure path
// logs console.error, TC-029), and releases the probe context so nothing leaks (TC-030).

const ctor = vi.hoisted(() => vi.fn());
vi.mock("three", async (importOriginal) => {
  const three = await importOriginal<typeof import("three")>();
  return {
    ...three,
    WebGLRenderer: class {
      constructor(...args: unknown[]) {
        ctor(...args);
        throw new Error("Error creating WebGL context.");
      }
    },
  };
});

import { glStats } from "./gl-count";
import { createTruckScene } from "./truck-scene";

const UNMASKED = 0x9246;

function fakeGl(renderer: string) {
  const loseContext = vi.fn();
  return {
    loseContext,
    gl: {
      RENDERER: 0x1f01,
      getExtension: (n: string) => (n === "WEBGL_debug_renderer_info" ? { UNMASKED_RENDERER_WEBGL: UNMASKED } : n === "WEBGL_lose_context" ? { loseContext } : null),
      getParameter: (p: number) => (p === UNMASKED ? renderer : "WebKit WebGL"),
      isContextLost: () => false,
    },
  };
}

let host: HTMLDivElement;
let errors: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  ctor.mockClear();
  errors = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  host.remove();
});

describe("createTruckScene guard", () => {
  it("resolves null when WebGL2 is unavailable", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const onFallback = vi.fn();
    await expect(createTruckScene(host, { plate: "RJ14 GB 4521", onFallback })).resolves.toBeNull();
    expect(onFallback).toHaveBeenCalledWith("webgl");
    expect(ctor).not.toHaveBeenCalled();
    expect(host.querySelector("canvas")).toBeNull();
    expect(glStats.live).toBe(0);
  });

  it("resolves null on a software GPU (SwiftShader) and releases the probe context", async () => {
    const { gl, loseContext } = fakeGl("ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(gl as unknown as RenderingContext);
    const onFallback = vi.fn();
    await expect(createTruckScene(host, { plate: "RJ14 GB 4521", onFallback })).resolves.toBeNull();
    expect(onFallback).toHaveBeenCalledWith("software");
    expect(ctor).not.toHaveBeenCalled();
    expect(loseContext).toHaveBeenCalledTimes(1);
    expect(host.querySelector("canvas")).toBeNull();
    expect(glStats.live).toBe(0);
    expect(errors).not.toHaveBeenCalled();
  });

  it("builds nothing when unmounted during the font wait: the probed context is released, no renderer", async () => {
    const { gl, loseContext } = fakeGl("Apple M2 Pro");
    const probe = { ok: true as const, canvas: document.createElement("canvas"), gl: gl as unknown as WebGL2RenderingContext };
    const onFallback = vi.fn();
    const onFirstFrame = vi.fn();
    await expect(createTruckScene(host, { plate: "RJ14 GB 4521", probe, isLive: () => false, onFallback, onFirstFrame })).resolves.toBeNull();
    expect(loseContext).toHaveBeenCalledTimes(1);
    expect(ctor).not.toHaveBeenCalled();
    expect(onFallback).not.toHaveBeenCalled(); // nobody is listening: not a fallback
    expect(onFirstFrame).not.toHaveBeenCalled();
    expect(host.querySelector("canvas")).toBeNull();
    expect(glStats.live).toBe(0);
  });

  it("resolves null when the renderer can't be created, with the context released", async () => {
    const { gl, loseContext } = fakeGl("Apple M2 Pro");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(gl as unknown as RenderingContext);
    const onFallback = vi.fn();
    await expect(createTruckScene(host, { plate: "RJ14 GB 4521", onFallback })).resolves.toBeNull();
    expect(ctor).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith("renderer");
    expect(loseContext).toHaveBeenCalledTimes(1);
    expect(glStats.live).toBe(0);
  });
});
