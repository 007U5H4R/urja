import { describe, expect, it } from "vitest";
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
