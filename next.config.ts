import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // M-004 perf: inline the route's CSS (≈15 KB, mostly globals) into the HTML so first paint no
    // longer waits on a render-blocking stylesheet round trip (Lighthouse mobile: ~600 ms on /).
    // MapLibre's stylesheet still arrives only with the lazy map chunk.
    inlineCss: true,
  },
  env: {
    // The 3D scene's non-secret debug flag (components/scene/TruckScene.tsx), inlined at build
    // time: "1" only for the e2e build (playwright.config.ts), else "0". Left unset, Turbopack
    // would keep a runtime process.env lookup that a page could spoof; inlined, the minifier
    // strips the debug branch. `pnpm check:bundle` checks the hooks are gone.
    NEXT_PUBLIC_DEBUG_GL: process.env.NEXT_PUBLIC_DEBUG_GL === "1" ? "1" : "0",
  },
};

export default nextConfig;
