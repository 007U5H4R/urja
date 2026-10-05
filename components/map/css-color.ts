/**
 * MapLibre can't parse oklch(), so a CSS token (`--lamp`, `--cream`, …) is
 * resolved to rgba by painting it into a 1-px canvas and reading it back
 * (a port of map.js `css`). Client-only: it needs a document.
 */
export interface PixelContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  getImageData(x: number, y: number, w: number, h: number): { data: ArrayLike<number> };
}

const CLEAR = "rgba(0, 0, 0, 0)";
const TRANSPARENT = "rgba(0,0,0,0)";

/**
 * A resolver over an injected 2D context and token reader (testable without a
 * real canvas). An empty or unparseable value gives `fallback`, never the
 * previously painted colour.
 */
export function createCssColor(getCtx: () => PixelContext | null, readVar: (name: string) => string | undefined) {
  let ctx: PixelContext | null | undefined;
  return function css(token: string, fallback = TRANSPARENT): string {
    if (ctx === undefined) ctx = getCtx();
    const value = (readVar(token) ?? "").trim();
    if (!ctx || !value) return fallback;
    // A canvas keeps its previous fillStyle when handed a value it can't parse.
    ctx.fillStyle = CLEAR;
    ctx.fillStyle = value;
    if (ctx.fillStyle === CLEAR || String(ctx.fillStyle).replace(/\s/g, "") === TRANSPARENT) return fallback;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
  };
}

let shared: ((token: string, fallback?: string) => string) | null = null;

/** Resolves a token on `document.body` (where lamp.css defines them) to `rgba(r,g,b,a)`. */
export function cssColor(token: string, fallback?: string): string {
  shared ??= createCssColor(
    () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      return canvas.getContext("2d", { willReadFrequently: true });
    },
    (name) => getComputedStyle(document.body).getPropertyValue(name),
  );
  return shared(token, fallback);
}
