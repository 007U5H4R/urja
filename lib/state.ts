/**
 * Screen states (TKT-11, technical-plan §3.2, §5.6): `?state=` asks a data
 * view to render one of its specimens instead of the working view. Anything
 * the route doesn't support, or doesn't recognise, falls through to the
 * normal view, so a stray or mistyped link never breaks a page.
 */

/** Every screen state a data view can be asked for. */
export type ScreenState = "loading" | "empty" | "clean" | "error";

/** Today (/) and the Morning brief (/brief): all four. */
export const DATA_STATES = ["loading", "empty", "clean", "error"] as const satisfies readonly ScreenState[];

/** Trip evidence (/trips/[id]): a trip is never empty, and its clean case is the page itself. */
export const TRIP_STATES = ["loading", "error"] as const satisfies readonly ScreenState[];

/** A server page's `searchParams`, or anything with URLSearchParams' `get`. */
export type StateSearch =
  | { get(name: string): string | null }
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

function rawState(search: StateSearch): string | undefined {
  if (!search) return undefined;
  if (typeof search.get === "function") return (search as { get(name: string): string | null }).get("state") ?? undefined;
  const v = (search as Record<string, string | string[] | undefined>).state;
  return Array.isArray(v) ? v[0] : v;
}

/** `?state=` as one of `allowed`, or null for the normal view. */
export function parseState<S extends ScreenState>(search: StateSearch, allowed: readonly S[]): S | null {
  const v = rawState(search);
  return v !== undefined && (allowed as readonly string[]).includes(v) ? (v as S) : null;
}
