/**
 * The 3D scene's guards (technical-plan §7, Design.md §26). No three.js here, so the
 * wrapper can use these without pulling the three chunk.
 */

/** Software WebGL (SwiftShader, llvmpipe, VMs) can freeze the page on this scene: show the poster. */
export const SOFTWARE_RENDERER_RE = /swiftshader|llvmpipe|software|basic render/i;

export function isSoftwareRenderer(name: string): boolean {
  return SOFTWARE_RENDERER_RE.test(name);
}

/** The parts of a WebGL context the guard reads. */
export interface RendererInfoSource {
  readonly RENDERER: number;
  getExtension(name: string): unknown;
  getParameter(pname: number): unknown;
}

/**
 * The GPU's name: the unmasked renderer from `WEBGL_debug_renderer_info`, else `RENDERER`
 * (Firefox reports the real name there). '' when the context can't say, which the guard
 * treats as hardware, as final/truck3d.js does.
 */
export function readRendererName(gl: RendererInfoSource): string {
  try {
    const dbg = gl.getExtension("WEBGL_debug_renderer_info") as { UNMASKED_RENDERER_WEBGL: number } | null;
    const unmasked = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null;
    return String(unmasked || gl.getParameter(gl.RENDERER) || "");
  } catch {
    return "";
  }
}

/** Pixel ratio capped at 1.5, or 1.25 on coarse pointers (phones). */
export function pixelRatioFor(devicePixelRatio: number, coarse: boolean): number {
  return Math.min(devicePixelRatio, coarse ? 1.25 : 1.5);
}

export type FallbackReason = "webgl" | "software" | "renderer" | "contextlost";

/** What three's WebGLRenderer would ask for itself (r169 defaults, plus the prototype's options). */
export const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: false,
  depth: true,
  stencil: false,
  antialias: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: "high-performance",
};

/** Drops a context we won't use, so it never counts against the browser's context limit. */
export function loseContext(gl: WebGL2RenderingContext): void {
  try {
    (gl.getExtension("WEBGL_lose_context") as { loseContext(): void } | null)?.loseContext();
  } catch {
    /* already gone */
  }
}

export type Probe = { ok: true; canvas: HTMLCanvasElement; gl: WebGL2RenderingContext } | { ok: false; reason: "webgl" | "software" };

/**
 * The guard, before three.js is fetched: a WebGL2 context at all, then a hardware renderer.
 * A software context is released at once. A good one is handed to the renderer (never opened
 * twice); whoever holds it must `loseContext` it if it goes unused.
 */
export function probeWebGL(forceSoftware = false): Probe {
  const canvas = document.createElement("canvas");
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", CONTEXT_ATTRIBUTES);
  } catch {
    gl = null;
  }
  if (!gl) return { ok: false, reason: "webgl" };
  if (isSoftwareRenderer(readRendererName(gl)) && !forceSoftware) {
    loseContext(gl);
    return { ok: false, reason: "software" };
  }
  return { ok: true, canvas, gl };
}
