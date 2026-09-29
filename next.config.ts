import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // M-004 perf (EXE18): no experimental.inlineCss. Inlining put the whole stylesheet in the HTML
  // three times (the <style>, and twice in the RSC payload: the root layout's and global-error's
  // styles), 62 KB of gzip HTML on Today, a third data round trip on a phone. app/site.css now
  // bundles the site's styles into one stylesheet request instead.
  env: {
    // The 3D scene's non-secret debug flag (components/scene/TruckScene.tsx), inlined at build
    // time: "1" only for the e2e build (playwright.config.ts), else "0". Left unset, Turbopack
    // would keep a runtime process.env lookup that a page could spoof; inlined, the minifier
    // strips the debug branch. `pnpm check:bundle` checks the hooks are gone.
    NEXT_PUBLIC_DEBUG_GL: process.env.NEXT_PUBLIC_DEBUG_GL === "1" ? "1" : "0",
  },
};

export default nextConfig;
