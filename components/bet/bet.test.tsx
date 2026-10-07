// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BET_OVERVIEW, BET_TIERS, BET_TRUCK } from "@/content/bet/copy";
import { citedSourceIds, isCited, sourceById, type Claim } from "@/content/bet/sources";
import { Cite } from "./Cite";
import { ClaimList } from "./ClaimList";
import { SimulatedTag } from "./SimulatedTag";
import { Sources } from "./Sources";

// TASK-21: the citation primitives of the bet pages.

afterEach(cleanup);

const ORDER = ["fastag-98", "eway-bills", "aa-fy25"];

describe("Cite", () => {
  it("numbers each source by its place in the page's list and links to its entry", () => {
    render(<Cite ids={["eway-bills", "aa-fy25"]} order={ORDER} />);
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["#src-eway-bills", "#src-aa-fy25"]);
    expect(links[0]).toHaveProperty("textContent", expect.stringMatching(/^\[2\]/));
    expect(links[1]).toHaveProperty("textContent", expect.stringMatching(/^\[3\]/));
    // The link names the source for a screen reader.
    expect(links[0].textContent).toContain(sourceById("eway-bills").title);
  });

  it("shows an unverified badge while a cited source is unverified", () => {
    const { container } = render(<Cite ids={["fastag-98"]} order={ORDER} />);
    expect(container.querySelector(".cite-badge")?.textContent).toBe("unverified");
  });

  it("throws when a cited source is missing from the page's list", () => {
    expect(() => render(<Cite ids={["zinka-prospectus"]} order={ORDER} />)).toThrow(/zinka-prospectus/);
  });
});

describe("Sources", () => {
  it("lists the page's sources in order, each with its anchor, link, publisher and status", () => {
    render(<Sources ids={ORDER} />);
    const region = screen.getByRole("region", { name: "Sources" });
    const items = within(region).getAllByRole("listitem");
    expect(items.map((li) => li.id)).toEqual(["src-fastag-98", "src-eway-bills", "src-aa-fy25"]);
    const first = sourceById("fastag-98");
    expect(within(items[0]).getByRole("link", { name: first.title }).getAttribute("href")).toBe(first.url);
    expect(items[0].textContent).toContain(first.publisher);
    expect(items[0].textContent).toContain(first.date);
    expect(within(items[0]).getByText("Unverified")).toBeTruthy();
  });

  it("renders nothing for a page that cites nothing", () => {
    const { container } = render(<Sources ids={[]} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("ClaimList", () => {
  it("cites sourced claims and labels assumptions with their basis", () => {
    const claims: Claim[] = [
      { text: "FASTag claim.", sourceIds: ["fastag-98"] },
      { text: "A guess.", assumption: true, basis: "Because." },
    ];
    render(<ClaimList claims={claims} order={citedSourceIds(claims)} />);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByRole("link").getAttribute("href")).toBe("#src-fastag-98");
    expect(items[1].textContent).toContain("Assumption");
    expect(items[1].textContent).toContain("Because.");
    expect(within(items[1]).queryByRole("link")).toBeNull();
  });

  it("every page's claim is cited to known sources or is a labelled assumption with a basis", () => {
    for (const page of [BET_OVERVIEW, BET_TIERS, BET_TRUCK]) {
      expect(page.claims.length).toBeGreaterThan(0);
      for (const claim of page.claims as readonly Claim[]) {
        if (isCited(claim)) {
          expect(claim.sourceIds.length, claim.text).toBeGreaterThan(0);
          for (const id of claim.sourceIds) expect(() => sourceById(id), claim.text).not.toThrow();
        } else {
          expect(claim.assumption, claim.text).toBe(true);
          expect(claim.basis.trim(), claim.text).not.toBe("");
        }
      }
    }
  });

  it("the overview's claims all resolve to the page's sources", () => {
    const order = citedSourceIds(BET_OVERVIEW.claims);
    expect(order.length).toBeGreaterThan(0);
    expect(() => render(<ClaimList claims={BET_OVERVIEW.claims} order={order} />)).not.toThrow();
  });
});

describe("SimulatedTag", () => {
  it("is a chip that says Simulated", () => {
    const { container } = render(<SimulatedTag />);
    expect(container.firstElementChild?.className).toContain("chip");
    expect(container.textContent).toBe("Simulated");
  });
});
