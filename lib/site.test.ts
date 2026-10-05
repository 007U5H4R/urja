import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSiteUrl, siteHostOf } from "./site";

// technical-plan §9: NEXT_PUBLIC_SITE_URL ?? (production → VERCEL_PROJECT_PRODUCTION_URL
// : VERCEL_URL → preview) ?? http://localhost:3000. §4.9: the WhatsApp preview shows this host.
describe("lib/site", () => {
  it("prefers NEXT_PUBLIC_SITE_URL over every Vercel variable", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://urja.example.com",
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "urja.vercel.app",
        VERCEL_URL: "urja-abc123.vercel.app",
      }),
    ).toBe("https://urja.example.com");
  });

  it("drops a trailing slash from NEXT_PUBLIC_SITE_URL", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://urja.example.com/" })).toBe("https://urja.example.com");
  });

  it("uses the production domain on a production deployment", () => {
    expect(
      resolveSiteUrl({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "urja.vercel.app", VERCEL_URL: "urja-abc123.vercel.app" }),
    ).toBe("https://urja.vercel.app");
  });

  it("uses the deployment URL on a preview", () => {
    expect(resolveSiteUrl({ VERCEL_ENV: "preview", VERCEL_URL: "urja-git-build-stage7.vercel.app" })).toBe(
      "https://urja-git-build-stage7.vercel.app",
    );
  });

  it("falls back to localhost:3000 with nothing set, and treats empty values as unset", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "", VERCEL_URL: "" })).toBe("http://localhost:3000");
  });

  it("falls through to VERCEL_URL when production has no production domain", () => {
    expect(resolveSiteUrl({ VERCEL_ENV: "production", VERCEL_URL: "urja-abc123.vercel.app" })).toBe("https://urja-abc123.vercel.app");
  });

  it("normalises every branch the same way: a scheme added when missing, trailing slashes dropped", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "urja.example.com" })).toBe("https://urja.example.com");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "urja.vercel.app/" })).toBe("https://urja.vercel.app");
    expect(resolveSiteUrl({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "urja.vercel.app/" })).toBe("https://urja.vercel.app");
    expect(resolveSiteUrl({ VERCEL_URL: "https://urja-abc123.vercel.app//" })).toBe("https://urja-abc123.vercel.app");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3100/" })).toBe("http://localhost:3100");
  });

  it("falls back to localhost:3000 when the value isn't a URL, so module load never throws", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://" })).toBe("http://localhost:3000");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "not a host name" })).toBe("http://localhost:3000");
    expect(siteHostOf(resolveSiteUrl({ VERCEL_URL: "::" }))).toBe("localhost:3000");
  });

  it("siteHost is the bare host, never urja.app", () => {
    expect(siteHostOf("https://urja.vercel.app")).toBe("urja.vercel.app");
    expect(siteHostOf("http://localhost:3000")).toBe("localhost:3000");
  });
});

// The module-level exports, as Next reads them at build time (merged from TKT-09's tests).
describe("lib/site module exports", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function load(env: SiteEnvStub) {
    for (const k of ["NEXT_PUBLIC_SITE_URL", "VERCEL_ENV", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const) vi.stubEnv(k, env[k] ?? "");
    vi.resetModules();
    return import("./site");
  }

  it("are absolute https on the deployment host whenever VERCEL_URL is set", async () => {
    for (const VERCEL_ENV of ["preview", "development"]) {
      const s = await load({ VERCEL_ENV, VERCEL_URL: "urja-x.vercel.app" });
      expect(s.siteUrl).toBe("https://urja-x.vercel.app");
      expect(s.siteHost).toBe("urja-x.vercel.app");
    }
  });

  it("fall back to localhost:3000 with no deployment env", async () => {
    const s = await load({});
    expect([s.siteUrl, s.siteHost]).toEqual(["http://localhost:3000", "localhost:3000"]);
  });
});

type SiteEnvStub = Partial<Record<"NEXT_PUBLIC_SITE_URL" | "VERCEL_ENV" | "VERCEL_PROJECT_PRODUCTION_URL" | "VERCEL_URL", string>>;
