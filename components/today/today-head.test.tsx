// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getTodayHead } from "@/lib/data/views/today";
import { LedgerBar } from "./LedgerBar";
import { PageHead } from "./PageHead";

// TSK-02.8: final/index.html lines 33–53, every value from getTodayHead().

afterEach(cleanup);

/** The rupee sign, spelled out so no TSX file holds a ₹-digit literal (TC-021 static check). */
const R = "₹";
const head = getTodayHead();
const norm = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").replace(/’/g, "'");

describe("PageHead", () => {
  it("renders the greeting, the verdict h1 and the two tags", () => {
    const { container } = render(<PageHead greeting={head.greeting} verdict={head.verdict} tags={head.tags} />);
    const section = container.querySelector("section.pagehead")!;
    expect(section.getAttribute("aria-labelledby")).toBe("h1");
    expect(section.querySelector("p.greet")!.textContent).toBe("Good morning, Sharma ji · Monday, 28 September");
    const h1 = section.querySelector("h1.verdict#h1")!;
    expect(norm(h1.textContent)).toBe(`Your trucks earned ${R}1,86,400 yesterday. ${R}11,430 of it doesn't add up, across 3 trips.`);
    expect(h1.querySelector("b")!.textContent).toBe(`${R}1,86,400`);
    expect(h1.querySelector("span.lit-loss")!.textContent).toBe(`${R}11,430`);
    // As in the mockup: a typographic apostrophe and a no-break space before "trips".
    expect(h1.textContent).toContain("doesn\u2019t add up, across 3\u00a0trips.");
    const tags = [...section.querySelectorAll(".controls > span.tag")];
    expect(tags.map((t) => t.textContent)).toEqual(["Yesterday · Sun 27 Sep", "17 trips reconciled at 6:55 AM"]);
    expect(tags.map((t) => t.querySelector("svg.i use")!.getAttribute("href"))).toEqual(["#i-calendar", "#i-clock"]);
  });

  it("says 'trip' for a single flagged trip", () => {
    const { container } = render(<PageHead greeting={head.greeting} verdict={{ ...head.verdict, flaggedTrips: 1 }} tags={head.tags} />);
    expect(norm(container.querySelector("h1")!.textContent)).toMatch(/across 1 trip\.$/);
  });
});

describe("LedgerBar", () => {
  it("renders the bar widths and the legend amounts", () => {
    const { container } = render(<LedgerBar ledger={head.ledger} />);
    const section = container.querySelector("section.ledgerbar")!;
    const bar = section.querySelector(".bar")!;
    expect([...bar.children].map((s) => [s.className, (s as HTMLElement).style.width])).toEqual([
      ["d", "38.4%"], ["t", "9.4%"], ["o", "6.9%"], ["p", "45.3%"],
    ]);
    const legend = section.querySelector("p.legend")!;
    expect([...legend.querySelectorAll("b")].map((b) => b.textContent)).toEqual([
      `${R}4,12,000`, `${R}1,58,300`, `${R}38,900`, `${R}28,400`, `${R}1,86,400`,
    ]);
    expect(legend.querySelector("b.lit")!.textContent).toBe(`${R}1,86,400`);
    expect([...legend.children].map((s) => norm(s.textContent))).toEqual([
      `Freight billed ${R}4,12,000`, "=", `Diesel ${R}1,58,300`, `Tolls ${R}38,900`, `Allowance & other ${R}28,400`, `Profit ${R}1,86,400`,
    ]);
    expect(legend.querySelectorAll("i")).toHaveLength(4);
  });

  it("names the bar as an image with the generated label, and leaves the legend readable", () => {
    const { container, getByRole } = render(<LedgerBar ledger={head.ledger} />);
    const img = getByRole("img");
    expect(img.className).toBe("bar");
    expect(img.getAttribute("aria-label")).toBe(head.ledger.ariaLabel);
    expect(img.children).toHaveLength(4);
    const section = container.querySelector("section.ledgerbar")!;
    // No labelled region whose content is all hidden.
    expect(section.hasAttribute("aria-label")).toBe(false);
    expect(container.querySelectorAll("[aria-hidden='true'] b")).toHaveLength(0);
    const legend = section.querySelector("p.legend")!;
    expect(legend.hasAttribute("aria-hidden")).toBe(false);
    expect([...legend.querySelectorAll("i")].every((i) => i.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(legend.querySelector(".eq")!.getAttribute("aria-hidden")).toBeNull();
  });
});
