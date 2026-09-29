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
  experimental: {
    // EXE23: several root layouts (app/(site), app/(phone), app/(phone-en)) leave no single layout
    // for an unmatched address's 404, so app/global-not-found.tsx serves it.
    globalNotFound: true,
  },
  // EXE23: <html lang> on the phone screens' first paint. /brief and /message are Hindi by default
  // and render under app/(phone), <html lang="hi">. For ?lang=en they are rewritten (internal, not a
  // redirect: the address bar and the canonical URL keep the public path) to /en/brief and
  // /en/message under app/(phone-en), <html lang="en">, keeping every query parameter (?only=,
  // ?state=). No proxy is needed, so nothing runs in front of the site's static pages.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/:screen(brief|message)", has: [{ type: "query", key: "lang", value: "en" }], destination: "/en/:screen" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // A direct hit on an English route goes to its public URL, so it is never a second, indexable copy.
  // Temporary (307), so no browser caches it should the internal path ever change.
  async redirects() {
    return [{ source: "/en/:screen(brief|message)", destination: "/:screen?lang=en", permanent: false }];
  },
};

export default nextConfig;
