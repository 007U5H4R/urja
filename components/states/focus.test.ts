// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { focusPageHeading, focusNextPageHeading } from "./focus";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("focusPageHeading", () => {
  it("focuses main's h1, making it focusable without adding it to the tab order", () => {
    document.body.innerHTML = `<main><h1>Title</h1></main>`;
    const h1 = document.querySelector("h1")!;
    expect(focusPageHeading()).toBe(true);
    expect(h1.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(h1);
  });

  it("keeps an existing tabindex", () => {
    document.body.innerHTML = `<main><h1 tabindex="0">Title</h1></main>`;
    focusPageHeading();
    expect(document.querySelector("h1")!.getAttribute("tabindex")).toBe("0");
  });

  it("returns false when there is no h1", () => {
    document.body.innerHTML = `<main><p>x</p></main>`;
    expect(focusPageHeading()).toBe(false);
  });
});

describe("focusNextPageHeading", () => {
  it("waits for a new h1 to replace the current one, then focuses it", async () => {
    document.body.innerHTML = `<main id="a"><h1>Old</h1></main>`;
    const done = focusNextPageHeading();
    document.body.innerHTML = `<main id="b"><h1>New</h1></main>`;
    await done;
    expect(document.activeElement!.textContent).toBe("New");
  });
});
