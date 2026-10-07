// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PROTOTYPE_NOTE } from "@/content/bet/copy";
import { FLAG_LAB_COPY as C } from "@/content/bet/flag-lab-copy";
import { getFlagLabView, type FlagLabView } from "@/lib/bet/views/flag-lab";
import { FlagLab } from "./FlagLab";

// TASK-25: the flag lab on a trip page. Every value comes from getFlagLabView().

afterEach(cleanup);

const view = (id: string): FlagLabView => getFlagLabView(id)!;
const lab = () => screen.getByRole("region", { name: "Flag lab" });
const stepper = () => screen.getByRole("slider", { name: C.steps.control }) as HTMLInputElement;
const setStep = (n: number) => fireEvent.change(stepper(), { target: { value: String(n) } });
const tierBtn = (label: string) => within(screen.getByRole("group", { name: C.ladder.control })).getByRole("button", { name: label });
const now = () => lab().querySelector("[data-testid='fl-now']")!;
const level = (id: string) => lab().querySelector(`li[data-level='${id}']`) as HTMLElement;
const unlockedLevels = () => [...lab().querySelectorAll("li[data-level][data-unlocked='true']")].map((li) => li.getAttribute("data-level"));

describe("FlagLab (0926-04, R1)", () => {
  const v = view("0926-04");
  const f = v.flags[0];

  it("is a labelled section with the heading, a prototype intro and a link to /bet", () => {
    const { container } = render(<FlagLab view={v} />);
    const section = container.querySelector<HTMLElement>("section#flag-lab")!;
    expect(section).toBe(lab());
    expect(within(section).getByRole("heading", { level: 2 }).textContent).toContain("Flag lab");
    expect(section.textContent).toContain(C.intro.lead);
    expect(within(section).getByRole("link", { name: C.intro.link }).getAttribute("href")).toBe("/bet");
  });

  it("opens on the flag's default step and on Munshi", () => {
    render(<FlagLab view={v} />);
    expect(stepper().value).toBe(String(f.defaultStep + 1));
    expect(stepper().min).toBe("1");
    expect(stepper().max).toBe(String(f.steps.length));
    expect(stepper().getAttribute("aria-valuetext")).toBe("Step 4 of 5: Fleet history, High");
    expect(now().textContent).toContain("High");
    expect(now().textContent).toContain("1 independent family");
    expect(tierBtn("Munshi").getAttribute("aria-pressed")).toBe("true");
    for (const t of ["Free", "Pro", "Autopilot"]) expect(tierBtn(t).getAttribute("aria-pressed")).toBe("false");
  });

  it("lists every stream step with its source, level word, families, note and evidence; later steps are not added yet", () => {
    render(<FlagLab view={v} />);
    const items = [...lab().querySelectorAll("ol.fl-steplist > li")] as HTMLElement[];
    expect(items).toHaveLength(5);
    expect(items.map((li) => li.getAttribute("data-state"))).toEqual(["added", "added", "added", "current", "later"]);
    f.steps.forEach((s, i) => {
      expect(items[i].textContent).toContain(s.label);
      expect(items[i].textContent).toContain(s.source);
      expect(items[i].textContent).toContain(s.note);
    });
    // Added steps show their level as a word and their family count.
    expect(items[0].querySelector(".conf")!.textContent).toBe("Check");
    expect(items[3].querySelector(".conf")!.textContent).toBe("High");
    expect(items[3].textContent).toContain("1 independent family");
    expect(items[1].textContent).toContain(f.steps[1].evidence[0]);
    // The camera isn't added yet: it says so in words, keeps its Simulated tag, and shows no level.
    expect(items[4].textContent).toContain(C.stepState.later);
    expect(within(items[4]).getByText("Simulated").className).toContain("chip");
    expect(items[4].querySelector(".conf")).toBeNull();
    // The families definition, once.
    expect(lab().textContent!.split(v.familiesNote)).toHaveLength(2);
  });

  it("moves confidence up the ladder as streams are added: Check, Likely, Likely, High, High", () => {
    render(<FlagLab view={v} />);
    const words: string[] = [];
    for (let n = 1; n <= 5; n++) {
      setStep(n);
      words.push(now().querySelector(".conf")!.textContent!);
    }
    expect(words).toEqual(["Check", "Likely", "Likely", "High", "High"]);
    expect(now().textContent).toContain("2 independent families");
    const items = [...lab().querySelectorAll("ol.fl-steplist > li")];
    expect(items.every((li) => li.getAttribute("data-state") !== "later")).toBe(true);
    expect(items[4].querySelector(".conf")!.textContent).toBe("High");
  });

  it("on Free only L1 is unlocked, and L1 shows its summary", () => {
    render(<FlagLab view={v} />);
    fireEvent.click(tierBtn("Free"));
    expect(tierBtn("Free").getAttribute("aria-pressed")).toBe("true");
    expect(unlockedLevels()).toEqual(["L1"]);
    expect(level("L1").textContent).toContain(v.levels[0].summary);
    expect(level("L1").textContent).toContain(C.lock.unlocked);
    expect(level("L2").textContent).toContain(C.lock.locked);
    // Locked actions are disabled and say why in text.
    const hold = within(level("L2")).getByRole("button", { name: "Hold the fuel card" }) as HTMLButtonElement;
    expect(hold.disabled).toBe(true);
    expect(level("L2").textContent).toContain("Needs the Munshi tier.");
    expect(hold.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(hold.getAttribute("aria-describedby")!)!.textContent).toContain("Needs the Munshi tier.");
  });

  it("each level shows its title and tier; L5 is greyed out as Future", () => {
    render(<FlagLab view={v} />);
    for (const l of v.levels) {
      expect(level(l.id).querySelector("h4")!.textContent).toBe(l.title);
      expect(level(l.id).textContent).toContain(l.tierLabel);
    }
    expect(level("L5").getAttribute("data-future")).toBe("true");
    expect(level("L5").textContent).toContain(C.lock.future);
    expect(level("L5").querySelector(".fl-reason")!.textContent).toBe("Future, not building now.");
    // "Future" once in the head: the lock chip, not a second tier label beside it.
    expect(level("L5").querySelector(".fl-level-head")!.textContent!.match(/Future/g)).toHaveLength(1);
    expect(level("L5").querySelector(".fl-tierlabel")).toBeNull();
    expect((within(level("L5")).getByRole("button", { name: "Self-closing daily settlement" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("with Autopilot on the last step the L4 auto-hold is unlocked and available", () => {
    render(<FlagLab view={v} />);
    fireEvent.click(tierBtn("Autopilot"));
    const autoHold = () => within(level("L4")).getByRole("button", { name: /^Auto-hold driver advances above/ }) as HTMLButtonElement;
    // At the default step (High on one family) the gate isn't met.
    expect(level("L4").getAttribute("data-unlocked")).toBe("true");
    expect(autoHold().disabled).toBe(true);
    expect(level("L4").textContent).toContain("this step has High on 1 family");
    setStep(5);
    expect(autoHold().disabled).toBe(false);
    expect(unlockedLevels()).toEqual(["L1", "L2", "L3", "L4"]);
  });

  it("a locked Ask the driver is a disabled button with its reason linked, like the other locked actions", () => {
    render(<FlagLab view={v} />);
    fireEvent.click(tierBtn("Free"));
    const ask = within(level("L2")).getByRole("button", { name: "Ask the driver" }) as HTMLButtonElement;
    expect(ask.disabled).toBe(true);
    expect(within(level("L2")).queryByRole("link", { name: /^Ask the driver/ })).toBeNull();
    expect(document.getElementById(ask.getAttribute("aria-describedby")!)!.textContent).toBe("LockedNeeds the Munshi tier.");
  });

  it("points Ask the driver at the flag card's driver's side instead of adding a second Ask button", () => {
    render(<FlagLab view={v} />);
    expect(within(lab()).queryByRole("button", { name: /^Ask/ })).toBeNull();
    const ask = within(level("L2")).getByRole("link", { name: /^Ask the driver/ });
    expect(ask.getAttribute("href")).toBe("#driver");
    expect(document.getElementById(ask.getAttribute("aria-describedby")!)!.textContent).toBe("ReadyUses the driver's side on the flag card. Not asked yet.");
  });

  it("announces step and tier changes in a polite live region", () => {
    render(<FlagLab view={v} />);
    const live = lab().querySelector("[data-testid='fl-announce']")!;
    expect(live.getAttribute("aria-live")).toBe("polite");
    expect(live.getAttribute("role")).toBeNull(); // the page's one role=status is the driver note
    expect(live.textContent).toBe("");
    setStep(5);
    fireEvent.click(tierBtn("Autopilot"));
    expect(live.textContent).toBe("Step 5 of 5: High, 2 independent families. Autopilot: L1 to L4 unlocked, 6 actions available.");
  });

  it("keeps the stepper and the tier switch on the keyboard path", () => {
    render(<FlagLab view={v} />);
    expect(stepper().tagName).toBe("INPUT");
    expect(stepper().type).toBe("range");
    expect(screen.getByLabelText(C.steps.control)).toBe(stepper());
    for (const t of v.tiers) expect(tierBtn(t.label).tagName).toBe("BUTTON");
  });

  describe("actions", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;
    let xhrSpy: ReturnType<typeof vi.fn>;
    beforeEach(() => {
      fetchSpy = vi.fn();
      xhrSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      vi.stubGlobal("XMLHttpRequest", xhrSpy);
      vi.stubGlobal("navigator", { ...navigator, sendBeacon: fetchSpy });
    });
    afterEach(() => vi.unstubAllGlobals());

    it("an available action shows the prototype note inline, in a live region, and sends nothing", () => {
      render(<FlagLab view={v} />);
      const hold = within(level("L2")).getByRole("button", { name: "Hold the fuel card" }) as HTMLButtonElement;
      expect(hold.disabled).toBe(false);
      const note = level("L2").querySelector("[data-testid='fl-note']")!;
      expect(note.getAttribute("aria-live")).toBe("polite");
      expect(note.textContent).toBe("");
      fireEvent.click(hold);
      expect(note.textContent).toBe(C.actionNote("Hold the fuel card"));
      expect(note.textContent!.startsWith(PROTOTYPE_NOTE)).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(xhrSpy).not.toHaveBeenCalled();
      // Moving the step clears it.
      setStep(1);
      expect(note.textContent).toBe("");
    });
  });
});

describe("FlagLab · other showcases", () => {
  it("0927-02: the typed bill doesn't count, and bill OCR (simulated) takes it to High on 2 families", () => {
    render(<FlagLab view={view("0927-02")} />);
    const items = [...lab().querySelectorAll("ol.fl-steplist > li")] as HTMLElement[];
    setStep(1);
    expect(items[0].textContent).toContain("Doesn't count as a family");
    expect(now().textContent).toContain("No independent family yet");
    setStep(4);
    expect(now().querySelector(".conf")!.textContent).toBe("High");
    expect(now().textContent).toContain("2 independent families");
    expect(within(items[3]).getByText("Simulated")).toBeTruthy();
  });

  it("0926-11: every step stays at Check, and the e-way bill argues against the flag", () => {
    const v = view("0926-11");
    render(<FlagLab view={v} />);
    const words: string[] = [];
    for (let n = 1; n <= v.flags[0].steps.length; n++) {
      setStep(n);
      words.push(now().querySelector(".conf")!.textContent!);
    }
    expect(words.every((w) => w === "Check")).toBe(true);
    expect(lab().textContent).toMatch(/Argues against the flag here/);
  });

  it("shows a flag picker only when the trip has more than one flag, and switching resets the step", () => {
    const one = view("0926-04");
    const { unmount } = render(<FlagLab view={one} />);
    expect(screen.queryByRole("combobox")).toBeNull();
    unmount();
    // No trip in the dataset has two flags, so pair two real flags to exercise the picker.
    const second = view("0927-02").flags[0];
    const two: FlagLabView = { ...one, flags: [one.flags[0], second] };
    render(<FlagLab view={two} />);
    const picker = screen.getByRole("combobox", { name: C.flagLabel }) as HTMLSelectElement;
    expect([...picker.options].map((o) => o.value)).toEqual([one.flags[0].id, second.id]);
    expect(stepper().max).toBe("5");
    fireEvent.change(picker, { target: { value: second.id } });
    expect(stepper().max).toBe(String(second.steps.length));
    expect(stepper().value).toBe(String(second.defaultStep + 1));
    expect(lab().textContent).toContain("Fuel bill (typed)");
  });

  it("renders the same from the view after a JSON round trip (what the page hands the client)", () => {
    const v = view("0926-04");
    const a = render(<FlagLab view={v} />).container.innerHTML;
    cleanup();
    const b = render(<FlagLab view={JSON.parse(JSON.stringify(v)) as FlagLabView} />).container.innerHTML;
    expect(b).toBe(a);
  });
});

describe("FlagLab · client boundary", () => {
  const src = (p: string) => readFileSync(join(__dirname, p), "utf8");
  it("only the interactive wrapper is a client component", () => {
    expect(src("FlagLab.tsx").startsWith('"use client";')).toBe(true);
    expect(src("StreamSteps.tsx")).not.toMatch(/^\s*["']use client["']/m);
    expect(src("ActionLadder.tsx")).not.toMatch(/^\s*["']use client["']/m);
    expect(src("../../app/(site)/trips/[tripId]/page.tsx")).not.toMatch(/^\s*["']use client["']/m);
  });

  it("trip pages don't load bet.css (its unscoped .cite would restyle the Ask chips); the lab scopes the rules it needs", () => {
    expect(src("FlagLab.tsx")).not.toMatch(/bet\.css/);
    expect(src("../../app/(site)/trips/[tripId]/page.tsx")).not.toMatch(/bet\.css/);
    const css = src("flag-lab.css").replace(/\/\*[\s\S]*?\*\//g, "");
    // Every bet or citation selector in flag-lab.css is under #flag-lab.
    const loose = css.split("\n").filter((l) => /(^|[\s,}])\.(cite|bet-)/.test(l) && !/^#flag-lab\b/.test(l.trim()));
    expect(loose).toEqual([]);
    expect(css).toMatch(/#flag-lab \.cite-n/);
    expect(css).toMatch(/#flag-lab \.bet-sources/);
  });

  it("the trip page renders the lab between the fuel chart and the lower section, only when the view exists", () => {
    const page = src("../../app/(site)/trips/[tripId]/page.tsx");
    const chart = page.indexOf("<FuelSpeedChart");
    const labAt = page.indexOf("<FlagLab");
    const lower = page.indexOf('className="lower"');
    expect(chart).toBeGreaterThan(0);
    expect(labAt).toBeGreaterThan(chart);
    expect(lower).toBeGreaterThan(labAt);
    expect(page).toMatch(/getFlagLabView\(/);
    // The footer cites the streams' sourced figures and ends with the lab's own Sources list.
    expect(page).toMatch(/flagLabClaims\([\s\S]*streamId/);
    expect(page.indexOf("<Sources")).toBeGreaterThan(page.indexOf("<ClaimList"));
  });
});
