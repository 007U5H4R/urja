/**
 * Live WebGL contexts the scene holds (TC-030's automated check). It goes up when the scene
 * opens a context and down when it releases one; the wrapper exposes it as `window.__urjaGL`
 * only in a NEXT_PUBLIC_DEBUG_GL=1 build. No three.js here.
 */
export const glStats = { live: 0 };
