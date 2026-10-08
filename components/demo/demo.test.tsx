// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DEMO_COPY, getDemoView } from "@/content/demo";
import { DemoGuide } from "./DemoGuide";

afterEach(cleanup);

const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

describe("DemoGuide (TASK-33)", () => {
  const view = getDemoView();

  it("renders one h1, the intro, and an ordered list of six steps with real links", () => {
    const { container } = render(<DemoGuide view={view} />);
    const main = container.querySelector("main#main")!;
    expect(main.querySelectorAll("h1")).toHaveLength(1);
    expect(main.querySelector("h1")!.textContent).toBe(DEMO_COPY.h1);
    expect(norm(main.querySelector(".demo-intro")!.textContent)).toBe(view.intro);
    // TASK-34: the story first (the lunch stop, then Mr. Sharma), above the prototype line.
    const head = main.querySelector("section.pagehead")!;
    expect([...head.querySelectorAll("p")].map((p) => [p.className, norm(p.textContent)])).toEqual([
      ...view.story.map((t) => ["demo-story", t]),
      ["demo-meet", view.meet],
      ["demo-intro", view.intro],
    ]);
    const steps = [...main.querySelectorAll("ol.demo-steps > li")];
    expect(steps).toHaveLength(6);
    steps.forEach((li, i) => {
      const s = view.steps[i];
      expect(li.classList.contains("panel")).toBe(true);
      expect(norm(li.querySelector("h2")!.textContent)).toBe(s.title);
      const ps = [...li.querySelectorAll(".demo-body > p")].map((p) => norm(p.textContent));
      expect(ps).toEqual(s.note ? [s.look, s.note] : [s.look]);
      const links = li.querySelectorAll("a");
      expect(links).toHaveLength(1);
      expect(links[0].getAttribute("href")).toBe(s.href);
      expect(links[0].className).toMatch(/\bbtn\b/);
      expect(norm(links[0].textContent)).toBe(s.cta);
    });
  });

  it("TASK-34: ends with the closing line, after the steps", () => {
    const { container } = render(<DemoGuide view={view} />);
    const close = container.querySelector("main#main > p.demo-close")!;
    expect(norm(close.textContent)).toBe(view.close);
    expect(close.previousElementSibling!.matches("ol.demo-steps")).toBe(true);
  });

  it("names each step by its heading, for screen readers", () => {
    const { container } = render(<DemoGuide view={view} />);
    for (const li of container.querySelectorAll("ol.demo-steps > li")) {
      const h = li.querySelector("h2")!;
      expect(li.getAttribute("aria-labelledby")).toBe(h.id);
    }
  });
});
