// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { centreCurrent, TabsScroller } from "./TabsScroller";

// TASK-32 fix round 1: on a phone the current tab is scrolled into the middle of the tab row.

afterEach(cleanup);

function fakeBox(scrollWidth: number, clientWidth: number, tab: { left: number; width: number } | null) {
  const box = document.createElement("div");
  Object.defineProperty(box, "clientWidth", { value: clientWidth });
  Object.defineProperty(box, "scrollWidth", { value: scrollWidth });
  if (tab) {
    const a = document.createElement("a");
    a.setAttribute("aria-current", "page");
    Object.defineProperty(a, "offsetLeft", { value: tab.left });
    Object.defineProperty(a, "offsetWidth", { value: tab.width });
    box.appendChild(a);
  }
  return box;
}

describe("centreCurrent", () => {
  it("scrolls so the current tab sits in the middle of the box", () => {
    const box = fakeBox(700, 300, { left: 500, width: 100 });
    centreCurrent(box);
    expect(box.scrollLeft).toBe(500 - (300 - 100) / 2);
  });

  it("does nothing without a current tab", () => {
    const box = fakeBox(700, 300, null);
    centreCurrent(box);
    expect(box.scrollLeft).toBe(0);
  });

  it("never scrolls smoothly (reduced motion stays honoured)", () => {
    const box = fakeBox(700, 300, { left: 500, width: 100 });
    const scrollTo = vi.fn();
    box.scrollTo = scrollTo;
    centreCurrent(box);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("TabsScroller", () => {
  it("wraps its children in the scroll box", () => {
    const { container } = render(
      <TabsScroller>
        <ul>
          <li>
            <a href="/bet" aria-current="page">
              Overview
            </a>
          </li>
        </ul>
      </TabsScroller>,
    );
    const box = container.querySelector(".bet-tabs-scroll")!;
    expect(box.querySelector('a[aria-current="page"]')?.textContent).toBe("Overview");
  });
});
