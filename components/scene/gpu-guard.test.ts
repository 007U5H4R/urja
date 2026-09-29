import { describe, expect, it } from "vitest";

import { isSoftwareRenderer, pixelRatioFor, readRendererName, SOFTWARE_RENDERER_RE } from "./gpu-guard";

// TSK-14.2 · technical-plan §7: the guard falls back to the poster when the renderer string
// matches /swiftshader|llvmpipe|software|basic render/i.

describe("isSoftwareRenderer", () => {
  it("keeps the regex from technical-plan §7 verbatim", () => {
    expect(SOFTWARE_RENDERER_RE.source).toBe("swiftshader|llvmpipe|software|basic render");
    expect(SOFTWARE_RENDERER_RE.flags).toBe("i");
  });

  it.each([
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
    "Google SwiftShader",
    "llvmpipe (LLVM 15.0.7, 256 bits)",
    "Mesa OffScreen / llvmpipe",
    "Software Rasterizer",
    "ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "microsoft basic render driver",
    "SOFTWARE",
  ])("flags a software GPU: %s", (name) => {
    expect(isSoftwareRenderer(name)).toBe(true);
  });

  it.each([
    "Apple M2 Pro",
    "ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)",
    "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "Mali-G78",
    "Adreno (TM) 650",
    "Apple GPU",
    "WebKit WebGL",
    "",
  ])("passes a hardware GPU: %s", (name) => {
    expect(isSoftwareRenderer(name)).toBe(false);
  });

  it("is stateless (no /g lastIndex carry-over between calls)", () => {
    expect(isSoftwareRenderer("SwiftShader")).toBe(true);
    expect(isSoftwareRenderer("SwiftShader")).toBe(true);
  });
});

/** A minimal WebGL context: RENDERER and, optionally, WEBGL_debug_renderer_info. */
function fakeGl(opts: { masked: string; unmasked?: string; throws?: boolean }) {
  const UNMASKED_RENDERER_WEBGL = 0x9246;
  const RENDERER = 0x1f01;
  return {
    RENDERER,
    getExtension: (name: string) => {
      if (opts.throws) throw new Error("boom");
      return name === "WEBGL_debug_renderer_info" && opts.unmasked !== undefined ? { UNMASKED_RENDERER_WEBGL } : null;
    },
    getParameter: (p: number) => (p === UNMASKED_RENDERER_WEBGL ? opts.unmasked : p === RENDERER ? opts.masked : null),
  };
}

describe("readRendererName", () => {
  it("prefers the unmasked renderer from WEBGL_debug_renderer_info", () => {
    expect(readRendererName(fakeGl({ masked: "WebKit WebGL", unmasked: "Google SwiftShader" }))).toBe("Google SwiftShader");
  });

  it("falls back to RENDERER when the extension is missing (Firefox)", () => {
    expect(readRendererName(fakeGl({ masked: "llvmpipe" }))).toBe("llvmpipe");
  });

  it("returns '' when the context can't say (assume hardware, as final/truck3d.js does)", () => {
    expect(readRendererName(fakeGl({ masked: "", throws: true }))).toBe("");
  });
});

describe("pixelRatioFor", () => {
  it("caps at 1.5 on fine pointers and 1.25 on coarse ones", () => {
    expect(pixelRatioFor(2, false)).toBe(1.5);
    expect(pixelRatioFor(3, true)).toBe(1.25);
    expect(pixelRatioFor(1, false)).toBe(1);
    expect(pixelRatioFor(1, true)).toBe(1);
  });
});
