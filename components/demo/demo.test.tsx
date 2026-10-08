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
    const steps = [...main.querySelectorAll("ol.demo-steps > li")];
    expect(steps).toHaveLength(6);
    steps.forEach((li, i) => {
      const s = view.steps[i];
      expect(li.classList.contains("panel")).toBe(true);
      expect(norm(li.querySelector("h2")!.textContent)).toBe(s.title);
      expect(norm(li.querySelector("p")!.textContent)).toBe(s.look);
      const links = li.querySelectorAll("a");
      expect(links).toHaveLength(1);
      expect(links[0].getAttribute("href")).toBe(s.href);
      expect(links[0].className).toMatch(/\bbtn\b/);
      expect(norm(links[0].textContent)).toBe(s.cta);
    });
  });

  it("names each step by its heading, for screen readers", () => {
    const { container } = render(<DemoGuide view={view} />);
    for (const li of container.querySelectorAll("ol.demo-steps > li")) {
      const h = li.querySelector("h2")!;
      expect(li.getAttribute("aria-labelledby")).toBe(h.id);
    }
  });
});
