// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

import RouteError from "@/app/error";
import { stateSpecimens } from "@/lib/data/views/states";
import { formatINR } from "@/lib/format";
import { BriefState } from "./BriefState";
import { TodaySkeleton } from "./Skeleton";
import { StateSwitch } from "./StateSwitch";
import { todaySpecimens } from "./TodayStates";
import { workingHref } from "./WorkingViewButton";

// TKT-11: the final/states.html specimens, every number from stateSpecimens().

const s = stateSpecimens();
const norm = (x: string | null | undefined) => (x ?? "").replace(/’/g, "'").replace(/\s+/g, " ").trim();
const GREET = "Good morning, Sharma ji · Monday, 28 September";

afterEach(() => {
  cleanup();
  replace.mockReset();
  window.history.replaceState(null, "", "/");
});

function renderToday(search: string) {
  window.history.replaceState(null, "", `/${search}`);
  return render(
    <StateSwitch specimens={todaySpecimens(GREET, s)}>
      <main data-testid="working">working view</main>
    </StateSwitch>,
  );
}

describe("StateSwitch (Today)", () => {
  it("renders the working view with no state, or an unknown one", () => {
    for (const q of ["", "?state=foo", "?state=", "?view=map"]) {
      const { unmount } = renderToday(q);
      expect(screen.getByTestId("working")).toBeTruthy();
      expect(document.querySelector(".st-view")).toBeNull();
      unmount();
    }
  });

  it("loading: the skeleton and the real progress, 11 of 17 done", () => {
    const { container } = renderToday("?state=loading");
    expect(screen.queryByTestId("working")).toBeNull();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(norm(container.querySelector("h1")!.textContent)).toBe("Loading · reconciling yesterday's trips");
    const card = container.querySelector("section.state")!;
    // aria-busy sits on the skeleton only, not on the section holding the status line
    expect(card.hasAttribute("aria-busy")).toBe(false);
    expect(card.querySelector("[data-skeleton='today']")!.getAttribute("aria-busy")).toBe("true");
    expect(norm(screen.getByRole("status").textContent)).toBe("Checking 17 trips against fuel, FASTag and GPS · 11 of 17 done");
    expect(container.querySelector(".progress b")!.textContent).toBe("11 of 17 done");
    const rail = container.querySelector(".rail.trips")!;
    expect(rail.getAttribute("aria-label")).toBe("Progress: 11 of 17 trips checked, 6 still to check");
    expect(rail.querySelectorAll("line")).toHaveLength(17);
    expect(container.querySelector("[data-skeleton='today']")!.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".st-head .greet")!.textContent).toBe(GREET);
  });

  it("empty: no trips finished yesterday, the now-counts and the next brief", () => {
    const { container } = renderToday("?state=empty");
    expect(norm(container.querySelector("h1")!.textContent)).toBe("No trips finished yesterday.");
    expect(container.querySelector(".copy")!.textContent).toContain("11 trucks are still on the road and 13 were in the yard or workshop.");
    expect(container.querySelector(".copy")!.textContent).toContain("Next brief: tomorrow, 7:00 AM.");
    expect(screen.getByRole("link", { name: "See where trucks are now" }).getAttribute("href")).toBe("/?view=fleet");
    expect(screen.getByRole("link", { name: "Open September so far" })).toBeTruthy();
  });

  it("clean: 24 Sep's 17 trips add up, lit amount, 4th clean day", () => {
    const { container } = renderToday("?state=clean");
    const card = container.querySelector("section.state.clean")!;
    expect(norm(card.querySelector("h1")!.textContent)).toBe(`All 17 trips add up. ${formatINR(194_800)} earned, nothing unaccounted.`);
    expect(card.querySelector("h1 .lit")!.textContent).toBe(formatINR(194_800));
    expect(norm(card.querySelector(".copy")!.textContent)).toBe("Diesel, tolls and km matched on every trip. That's the 4th clean day this month.");
    expect(card.querySelector(".copy b")!.textContent).toBe("4th clean day");
    expect(norm(card.querySelector(".st-tag")!.textContent)).toBe("Working · a clean day · Thu 24 Sep");
    expect([...card.querySelectorAll(".rail-ends span")].map((e) => e.textContent)).toEqual(["17 trips reconciled", "0 flags"]);
    expect(card.querySelector(".rail")!.getAttribute("aria-label")).toBe("All 17 of 17 trips checked, and every one adds up");
  });

  it("error: data late, nothing lost, show the ready trips or try again", () => {
    const { container } = renderToday("?state=error&lang=en#x");
    const card = container.querySelector("section.state")!;
    expect(card.getAttribute("role")).toBe("alert");
    expect(norm(card.querySelector("h1")!.textContent)).toBe("Yesterday's trips haven't reached Urja yet.");
    const copy = norm(card.querySelector(".copy")!.textContent);
    expect(copy).toContain("6 trucks haven't sent data since 2 AM");
    expect(copy).toContain("Udaipur stretch");
    expect(copy).toContain("Nothing is lost");
    expect(copy).toContain("The other 11 trips are ready.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(replace).toHaveBeenLastCalledWith("/?lang=en#x");
    fireEvent.click(screen.getByRole("button", { name: "Show the 11 ready trips" }));
    expect(replace).toHaveBeenCalledTimes(2);
    expect(replace).toHaveBeenLastCalledWith("/?lang=en#x");
  });

  it("server render (the static prerender) is always the working view, even with ?state=error", () => {
    window.history.replaceState(null, "", "/?state=error");
    const html = renderToString(
      <StateSwitch specimens={todaySpecimens(GREET, s)}>
        <main data-testid="working">working view</main>
      </StateSwitch>,
    );
    expect(html).toContain('data-testid="working"');
    expect(html).not.toContain("st-view");
  });

  it("back to a URL without ?state= (popstate) brings the working view back", () => {
    renderToday("?state=error");
    expect(screen.queryByTestId("working")).toBeNull();
    act(() => {
      window.history.replaceState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByTestId("working")).toBeTruthy();
    expect(document.querySelector(".st-view")).toBeNull();
  });
});

describe("BriefState", () => {
  it("puts the state card in the phone screen, English, one h1", () => {
    const { container } = render(<BriefState state="error" s={s} greet="Good morning, Sharma ji" date="Monday, 28 September" />);
    expect(container.querySelector(".p-brief main.m")!.getAttribute("lang")).toBe("en");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("real route boundaries", () => {
  it("the Today skeleton is decorative only: no text, no figures", () => {
    const { container } = render(<TodaySkeleton />);
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
    expect(container.textContent).toBe("");
    expect(container.querySelectorAll(".sk").length).toBeGreaterThan(4);
  });

  it("error.tsx says what happened, what next and what's preserved, with a retry", () => {
    const retry = vi.fn();
    const { container } = render(<RouteError error={new Error("boom")} retry={retry} />);
    expect(container.querySelector("[role='alert']")).toBeTruthy();
    expect(norm(container.querySelector("h1")!.textContent)).toBe("Urja couldn't show this page.");
    expect(container.textContent).toContain("Nothing is lost");
    expect(container.textContent).toContain("Try again, or go back to Today.");
    expect(container.textContent).not.toContain("boom");
    expect(document.activeElement).toBe(container.querySelector("h1"));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Back to Today" }).getAttribute("href")).toBe("/");
  });
});

describe("workingHref", () => {
  it("drops only ?state=", () => {
    expect(workingHref("http://x/brief?state=error&lang=en#top")).toBe("/brief?lang=en#top");
    expect(workingHref("http://x/?state=loading")).toBe("/");
    expect(workingHref("http://x/trips/0926-04?state=error")).toBe("/trips/0926-04");
  });
});
