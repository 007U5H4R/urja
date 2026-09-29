// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { createCssColor, cssColor } from "./css-color";

// TSK-10.1: MapLibre can't parse oklch(), so tokens resolve to rgba through a 1-px canvas (map.js `css`).

/** A fake 2D context: remembers the last valid fillStyle and "paints" it from a lookup table. */
function fakeCtx(table: Record<string, [number, number, number, number]>) {
  let style = "rgba(0, 0, 0, 0)";
  let painted: [number, number, number, number] = [0, 0, 0, 0];
  const ctx = {
    clearRect: vi.fn(() => {
      painted = [0, 0, 0, 0];
    }),
    fillRect: vi.fn(() => {
      painted = table[style] ?? [0, 0, 0, 0];
    }),
    getImageData: vi.fn(() => ({ data: Uint8ClampedArray.from(painted) })),
    get fillStyle() {
      return style;
    },
    set fillStyle(v: string) {
      // A canvas ignores a value it can't parse and keeps the previous one.
      if (v in table || v === "rgba(0, 0, 0, 0)") style = v;
    },
  };
  return ctx;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.removeAttribute("style");
});

describe("createCssColor", () => {
  it("resolves a token's value to rgba via the canvas", () => {
    const ctx = fakeCtx({ "oklch(0.705 0.166 53)": [236, 150, 70, 255] });
    const read = vi.fn(() => " oklch(0.705 0.166 53) ");
    const css = createCssColor(() => ctx, read);
    expect(css("--lamp")).toBe("rgba(236,150,70,1.000)");
    expect(read).toHaveBeenCalledWith("--lamp");
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1, 1);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 1, 1);
  });

  it("keeps alpha to three decimals", () => {
    const ctx = fakeCtx({ "oklch(1 0 0 / .5)": [255, 255, 255, 128] });
    const css = createCssColor(() => ctx, () => "oklch(1 0 0 / .5)");
    expect(css("--glow")).toBe("rgba(255,255,255,0.502)");
  });

  it("returns the fallback for an unknown token or an unparseable value, never the previous colour", () => {
    const ctx = fakeCtx({ "oklch(0.705 0.166 53)": [236, 150, 70, 255] });
    const values: Record<string, string> = { "--lamp": "oklch(0.705 0.166 53)", "--bad": "not-a-colour", "--none": "" };
    const css = createCssColor(() => ctx, (v) => values[v]);
    expect(css("--lamp")).toBe("rgba(236,150,70,1.000)");
    expect(css("--bad")).toBe("rgba(0,0,0,0)");
    expect(css("--none", "rgba(1,2,3,1)")).toBe("rgba(1,2,3,1)");
  });

  it("returns the fallback when there is no 2D context", () => {
    const css = createCssColor(() => null, () => "red");
    expect(css("--lamp", "rgba(9,9,9,1)")).toBe("rgba(9,9,9,1)");
  });

  it("creates the context once", () => {
    const ctx = fakeCtx({ red: [255, 0, 0, 255] });
    const get = vi.fn(() => ctx);
    const css = createCssColor(get, () => "red");
    css("--a");
    css("--b");
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe("cssColor (document default)", () => {
  it("reads the token from the body's computed style through a real canvas element", () => {
    document.body.style.setProperty("--cream", "rgb(250, 230, 200)");
    const ctx = fakeCtx({ "rgb(250, 230, 200)": [250, 230, 200, 255] });
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => ctx as unknown as CanvasRenderingContext2D);
    expect(cssColor("--cream")).toBe("rgba(250,230,200,1.000)");
    expect(spy).toHaveBeenCalledWith("2d", { willReadFrequently: true });
  });
});
