// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Confidence } from "./Confidence";
import { DeltaChip } from "./DeltaChip";
import { Money } from "./Money";
import { Panel } from "./Panel";
import { Plate } from "./Plate";
import { SectionHead } from "./SectionHead";
import { StatusChip } from "./StatusChip";

// TSK-03.4 / TKT-03 AC4. Markup and classes come from final/index.html, trip.html and brief.html.

afterEach(cleanup);

/** The rupee sign, spelled out so no TSX file holds a ₹-digit literal (TC-021 static check). */
const R = "\u20B9";

const html = (ui: React.ReactElement) => render(ui).container.innerHTML;

describe("Plate", () => {
  it("renders the mockup plate", () => {
    expect(html(<Plate plate="RJ14 GB 4521" />)).toBe('<span class="plate">RJ14 GB 4521</span>');
  });
  it("size lg adds the lg class (trip head)", () => {
    expect(html(<Plate plate="RJ14 GB 4521" size="lg" />)).toBe('<span class="plate lg">RJ14 GB 4521</span>');
  });
});

describe("Money", () => {
  it("renders en-IN grouping with the rupee sign", () => {
    expect(html(<Money inr={186400} />)).toBe(`<span>${R}1,86,400</span>`);
  });
  it("lit adds the lit class (index.html hero figure)", () => {
    expect(html(<Money inr={186400} lit />)).toBe(`<span class="lit">${R}1,86,400</span>`);
  });
  it('lit="loss" adds lit-loss', () => {
    const { container } = render(<Money inr={3420} lit="loss" />);
    const el = container.firstElementChild!;
    expect(el.classList.contains("lit-loss")).toBe(true);
    expect(el.classList.contains("lit")).toBe(false);
    expect(el.textContent).toBe(`${R}3,420`);
  });
  it("renders a negative with U+2212, never a hyphen", () => {
    const text = render(<Money inr={-10620} />).container.textContent!;
    expect(text).toBe(`−${R}10,620`);
    expect(text).not.toContain("-");
  });
  it("never breaks a negative between − and ₹ (DES-33): the amount doesn't wrap; positives are left alone", () => {
    const neg = render(<Money inr={-3420} />).container.firstElementChild as HTMLElement;
    expect(neg.style.whiteSpace).toBe("nowrap");
    expect((render(<Money inr={800} sign="always" />).container.lastElementChild as HTMLElement).style.whiteSpace).toBe("nowrap");
    expect(html(<Money inr={3420} />)).toBe(`<span>${R}3,420</span>`);
    expect((render(<Money inr={-3420} sign="never" />).container.lastElementChild as HTMLElement).getAttribute("style")).toBeNull();
  });
  it("tone and className compose in mockup order (`amt loss`)", () => {
    expect(html(<Money inr={3420} tone="loss" className="amt" />)).toBe(
      `<span class="amt loss">${R}3,420</span>`,
    );
    expect(html(<Money inr={21600} tone="gain" />)).toBe(`<span class="gain">${R}21,600</span>`);
  });
  it("sign='always' prefixes gains with + and keeps U+2212 on costs", () => {
    expect(render(<Money inr={21600} sign="always" />).container.textContent).toBe(`+${R}21,600`);
    expect(render(<Money inr={-800} sign="always" />).container.textContent).toBe(`−${R}800`);
    expect(render(<Money inr={0} sign="always" />).container.textContent).toBe(`${R}0`);
  });
  it("sign='never' drops the sign (a flagged amount already reads as a loss)", () => {
    expect(render(<Money inr={-3420} sign="never" />).container.textContent).toBe(`${R}3,420`);
  });
  it("sign={true} means always and sign={false} means never", () => {
    expect(render(<Money inr={21600} sign />).container.textContent).toBe(`+${R}21,600`);
    expect(render(<Money inr={-800} sign={true} />).container.textContent).toBe(`−${R}800`);
    expect(render(<Money inr={-3420} sign={false} />).container.textContent).toBe(`${R}3,420`);
    expect(render(<Money inr={21600} sign={false} />).container.textContent).toBe(`${R}21,600`);
  });
  it("as renders the mockup element", () => {
    expect(html(<Money inr={3420} lit="loss" as="p" className="amt" />)).toBe(
      `<p class="amt lit-loss">${R}3,420</p>`,
    );
  });
});

describe("Confidence", () => {
  it.each([
    ["high", "3", "High"],
    ["likely", "2", "Likely"],
    ["check", "1", "Check"],
  ] as const)("en %s → data-level %s, 3 bars and the word", (level, dl, word) => {
    const { container } = render(<Confidence level={level} lang="en" />);
    expect(container.innerHTML).toBe(
      `<span class="conf" data-level="${dl}"><i><b></b><b></b><b></b></i>${word}</span>`,
    );
  });

  it.each([
    ["high", "3", "पक्का"],
    ["likely", "2", "शायद"],
    ["check", "1", "जाँचें"],
  ] as const)("hi %s → data-level %s, 3 bars and the Hindi word with lang=hi", (level, dl, word) => {
    const { container } = render(<Confidence level={level} lang="hi" />);
    const conf = container.querySelector(".conf")!;
    expect(conf.getAttribute("data-level")).toBe(dl);
    expect(conf.querySelectorAll("i > b")).toHaveLength(3);
    const w = conf.querySelector('[lang="hi"]')!;
    expect(w.textContent).toBe(word);
    expect(conf.textContent).toBe(word);
  });

  it("suffix extends the word (trip flag card: “High confidence”)", () => {
    const { container } = render(<Confidence level="high" lang="en" suffix=" confidence" />);
    expect(container.textContent).toBe("High confidence");
  });
});

describe("StatusChip and DeltaChip", () => {
  it("StatusChip renders .chip with an optional tone", () => {
    expect(html(<StatusChip>Ramesh not asked yet</StatusChip>)).toBe('<span class="chip">Ramesh not asked yet</span>');
    expect(html(<StatusChip tone="warn">Stationary fuel drop</StatusChip>)).toBe(
      '<span class="chip warn">Stationary fuel drop</span>',
    );
  });
  it("DeltaChip renders .delta with its tone; neutral has no tone class", () => {
    expect(html(<DeltaChip tone="loss">below</DeltaChip>)).toBe('<span class="delta loss">below</span>');
    expect(html(<DeltaChip tone="gain">of flagged</DeltaChip>)).toBe('<span class="delta gain">of flagged</span>');
    expect(html(<DeltaChip tone="neutral">this week</DeltaChip>)).toBe('<span class="delta">this week</span>');
  });
});

describe("Panel", () => {
  it("defaults to <article class=panel> and passes attributes through", () => {
    expect(html(<Panel className="eyes" aria-labelledby="eyes-h">x</Panel>)).toBe(
      '<article class="panel eyes" aria-labelledby="eyes-h">x</article>',
    );
  });
  it("as=section", () => {
    expect(html(<Panel as="section" className="chartpanel">x</Panel>)).toBe(
      '<section class="panel chartpanel">x</section>',
    );
  });
});

describe("SectionHead", () => {
  it("renders title only", () => {
    expect(html(<SectionHead id="tl-h" title="What happened, in order" />)).toBe(
      '<div class="sec-head"><h2 id="tl-h">What happened, in order</h2></div>',
    );
  });
  it("renders count and right slots in mockup order", () => {
    expect(
      html(<SectionHead id="eyes-h" title="Needs your eyes" count="3 of 17 trips" right={<b>r</b>} />),
    ).toBe(
      '<div class="sec-head"><h2 id="eyes-h">Needs your eyes</h2><span class="count">3 of 17 trips</span><span class="right"><b>r</b></span></div>',
    );
  });
  it("a decorative legend in the right slot (trip fuel chart)", () => {
    expect(html(<SectionHead title="t" right="L" rightClassName="legend" rightHidden />)).toBe(
      '<div class="sec-head"><h2>t</h2><span class="right legend" aria-hidden="true">L</span></div>',
    );
  });
});
