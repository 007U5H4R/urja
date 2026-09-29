/**
 * The site's own URL (technical-plan §9). TKT-09 uses `siteUrl` as the
 * `metadataBase`; the 7 AM message's link preview shows `siteHost`, the real
 * deployed host, never a domain we don't own (§4.9).
 *
 *   siteUrl = NEXT_PUBLIC_SITE_URL
 *          ?? (VERCEL_ENV === 'production' ? https://${VERCEL_PROJECT_PRODUCTION_URL}
 *              : VERCEL_URL ? https://${VERCEL_URL}
 *              : 'http://localhost:3000')
 *
 * Empty values count as unset, so a blank variable in a dashboard can't
 * produce "https://". Read on the server: the Vercel variables are not
 * exposed to the browser.
 */

export type SiteEnv = Partial<
  Record<"NEXT_PUBLIC_SITE_URL" | "VERCEL_ENV" | "VERCEL_PROJECT_PRODUCTION_URL" | "VERCEL_URL", string | undefined>
>;

export const LOCAL_SITE_URL = "http://localhost:3000";

const set = (v: string | undefined): string | undefined => (v && v.trim() ? v.trim() : undefined);

/**
 * One normaliser for every branch: add https:// when there is no scheme, drop
 * trailing slashes, and fall back to localhost when the result isn't a URL, so
 * a bad variable can never make module load throw.
 */
export function normaliseSiteUrl(raw: string): string {
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return LOCAL_SITE_URL;
  }
}

/** The site URL for an environment, without a trailing slash. */
export function resolveSiteUrl(env: SiteEnv): string {
  const production = env.VERCEL_ENV === "production" ? set(env.VERCEL_PROJECT_PRODUCTION_URL) : undefined;
  const raw = set(env.NEXT_PUBLIC_SITE_URL) ?? production ?? set(env.VERCEL_URL);
  return raw ? normaliseSiteUrl(raw) : LOCAL_SITE_URL;
}

/** 'https://urja.vercel.app' → 'urja.vercel.app'. */
export function siteHostOf(url: string): string {
  return new URL(url).host;
}

export const siteUrl: string = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  VERCEL_URL: process.env.VERCEL_URL,
});

export const siteHost: string = siteHostOf(siteUrl);
