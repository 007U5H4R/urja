// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { AskResponse } from "@/lib/ask/contract";
import { openAsk } from "@/lib/ask-events";
import { AskAnswer } from "./AskAnswer";
import { AskDock } from "./AskDock";
import { AskProvider, type SheetComponent } from "./AskProvider";
import { ASK_CHIPS, ASK_COPY } from "./copy";
import { modelLabel, provenanceLine, seconds } from "./format";

// TSK-12.2 / TSK-12.3: the drawer, its states and the dock (technical-plan §6.6, TC-024, TC-026).

beforeAll(() => {
  // jsdom lays nothing out; the focus-return target must count as visible.
  HTMLElement.prototype.getClientRects = function () {
    return [{}] as unknown as DOMRectList;
  };
});
afterEach(cleanup);

const SCOPE = "212 trips across 24 trucks, 1–27 Sep";
const SCOPE_HI = "212 ट्रिप, 24 ट्रक, 1–27 सितंबर";
const SHELL_SCOPE = { en: SCOPE, hi: SCOPE_HI };
const SAVED = {
  en: "Your question is saved. Try again in a minute for a written answer.",
  hi: "आपका सवाल सहेज लिया गया है। लिखित जवाब के लिए एक मिनट बाद फिर पूछें।",
};
const provenance = { scope: SCOPE, model: "gemini-3.5-flash", ms: 1800, promptVersion: "ask-v1", datasetHash: "h" };
const resp = (over: Partial<AskResponse> = {}): AskResponse => ({
  mode: "model",
  answer: "RJ14 GB 4521 had 38 L unaccounted.",
  lang: "en",
  cites: [
    { tripId: "0926-04", label: "RJ14 GB 4521 · Jaipur → Okhla, Delhi" },
    { tripId: "0927-02", label: "RJ14 GC 1180 · Jaipur → Ahmedabad" },
  ],
  provenance,
  ...over,
});
const reply = (json: unknown, status = 200) => () =>
  Promise.resolve(new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } }));

function mount(
  fetchImpl: (...a: unknown[]) => Promise<Response> = reply(resp()),
  extra?: React.ReactNode,
  loadSheet?: () => Promise<SheetComponent>,
) {
  const f = vi.fn(fetchImpl);
  const utils = render(
    <AskProvider scope={SHELL_SCOPE} saved={SAVED} fetchImpl={f as unknown as typeof fetch} loadSheet={loadSheet}>
      <main>
        <button type="button" id="askBtn" onClick={() => openAsk()}>
          Ask about any truck
        </button>
        <button type="button">Other</button>
        {extra}
      </main>
    </AskProvider>,
  );
  return { ...utils, fetchImpl: f };
}

const dialog = () => screen.getByRole("dialog", { name: "Ask Urja" });
const input = () => screen.getByRole("textbox", { name: "Your question" });
const sent = (f: ReturnType<typeof vi.fn>, i = 0) => JSON.parse((f.mock.calls[i][1] as RequestInit).body as string);

async function askQuestion(q: string) {
  fireEvent.change(input(), { target: { value: q } });
  fireEvent.submit(input().closest("form")!);
}

describe("format", () => {
  it("labels the model from provenance and measures seconds", () => {
    expect(modelLabel("gemini-3.5-flash")).toBe("Gemini 3.5 Flash");
    expect(modelLabel("gemini-2.5-flash-lite")).toBe("Gemini 2.5 Flash Lite");
    expect(seconds(1800)).toBe("1.8");
    expect(seconds(2345)).toBe("2.3");
    expect(seconds(40)).toBe("0.04");
    expect(seconds(0)).toBe("0.0");
  });

  it("builds the §6.6 provenance line, and says 'from your data' when there is no model", () => {
    expect(provenanceLine({ scope: SCOPE, model: "gemini-3.5-flash", ms: 1800 })).toBe(
      "From 212 trips across 24 trucks, 1–27 Sep · Gemini 3.5 Flash · answered in 1.8 s · Urja can be wrong, so open the trips before acting.",
    );
    expect(provenanceLine({ scope: SCOPE, model: null, ms: 120 })).toBe(
      "From 212 trips across 24 trucks, 1–27 Sep · straight from your data, no AI · answered in 0.1 s · Urja can be wrong, so open the trips before acting.",
    );
  });
  it("builds the provenance line in Hindi (EXE23)", () => {
    expect(provenanceLine({ scope: SCOPE_HI, model: "gemini-3.5-flash", ms: 1800 }, "hi")).toBe(
      "212 ट्रिप, 24 ट्रक, 1–27 सितंबर के डेटा से · Gemini 3.5 Flash · 1.8 सेकंड में जवाब · Urja ग़लत हो सकता है, इसलिए कार्रवाई से पहले ट्रिप खोलें।",
    );
    expect(provenanceLine({ scope: SCOPE_HI, model: null, ms: 40 }, "hi")).toBe(
      "212 ट्रिप, 24 ट्रक, 1–27 सितंबर के डेटा से · AI के बिना, सीधा हिसाब · 0.04 सेकंड में जवाब · Urja ग़लत हो सकता है, इसलिए कार्रवाई से पहले ट्रिप खोलें।",
    );
  });
});

describe("AskProvider + AskSheet: opening, focus, inert (TC-026)", () => {
  it("is closed until asked, then ⌘K opens it with focus in the input", async () => {
    mount();
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    await waitFor(() => expect(dialog()).toBeTruthy());
    await waitFor(() => expect(document.activeElement).toBe(input()));
  });

  it("Ctrl+K opens it too, and a plain K does nothing", async () => {
    mount();
    fireEvent.keyDown(window, { key: "k" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(window, { key: "K", ctrlKey: true });
    await waitFor(() => expect(dialog()).toBeTruthy());
  });

  it("the trigger's event opens it; Esc closes it and focus returns to the trigger", async () => {
    mount();
    const trigger = screen.getByRole("button", { name: "Ask about any truck" });
    trigger.focus();
    fireEvent.click(trigger);
    await waitFor(() => expect(document.activeElement).toBe(input()));
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("makes everything else in <body> inert while open, and restores it on close", async () => {
    const { container } = mount();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    await waitFor(() => expect(container.hasAttribute("inert")).toBe(true));
    expect(dialog().closest("[inert]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: ASK_COPY.en.close }));
    await waitFor(() => expect(container.hasAttribute("inert")).toBe(false));
  });

  it("⌘K while the sheet is open puts focus back in the input", async () => {
    mount();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    await waitFor(() => expect(document.activeElement).toBe(input()));
    screen.getByRole("button", { name: ASK_COPY.en.close }).focus();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(document.activeElement).toBe(input());
  });

  it("opened by ⌘K from the page body, focus returns to the Ask trigger (#askBtn)", async () => {
    mount();
    (document.activeElement as HTMLElement | null)?.blur();
    expect(document.activeElement).toBe(document.body);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    await waitFor(() => expect(document.activeElement).toBe(input()));
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(document.getElementById("askBtn")));
  });

  it("accepts the K key by its code (Hindi layouts) and ignores keys mid-composition", async () => {
    mount();
    fireEvent.keyDown(window, { key: "क", code: "KeyK", ctrlKey: true, isComposing: true });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(window, { key: "क", code: "KeyK", ctrlKey: true });
    await waitFor(() => expect(dialog()).toBeTruthy());
  });

  it("keeps the conversation's live region rendered while idle, so the first answer is announced", async () => {
    mount();
    act(() => openAsk());
    const d = await waitFor(dialog);
    const live = d.querySelector(".convo")!;
    expect(live).not.toBeNull();
    expect(live.getAttribute("aria-live")).toBe("polite");
  });

  it("/?ask opens the sheet on Today, then strips the param", async () => {
    window.history.replaceState(null, "", "/?ask");
    try {
      mount();
      await waitFor(() => expect(document.activeElement).toBe(input()));
      expect(window.location.search).toBe("");
      expect(window.location.pathname).toBe("/");
    } finally {
      window.history.replaceState(null, "", "/");
    }
  });

  it("?ask on another route does nothing", async () => {
    window.history.replaceState(null, "", "/trips/0926-04?ask");
    try {
      mount();
      await new Promise((r) => setTimeout(r, 50));
      expect(screen.queryByRole("dialog")).toBeNull();
    } finally {
      window.history.replaceState(null, "", "/");
    }
  });

  it("a drawer chunk that fails to load leaves the app working, and the next open retries", async () => {
    const { AskSheet } = await import("./AskSheet");
    const load = vi.fn<() => Promise<SheetComponent>>().mockRejectedValueOnce(new Error("ChunkLoadError")).mockResolvedValue(AskSheet);
    mount(reply(resp()), null, load);
    act(() => openAsk());
    await waitFor(() => expect(load).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Ask about any truck" })).toBeTruthy();
    act(() => openAsk());
    await waitFor(() => expect(dialog()).toBeTruthy());
  });

  it("a drawer that throws while rendering is caught; the page stays and the next open retries", async () => {
    const { AskSheet } = await import("./AskSheet");
    let fail = true;
    const Flaky: SheetComponent = (props) => {
      if (fail) throw new Error("render failed");
      return <AskSheet {...props} />;
    };
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mount(reply(resp()), null, () => Promise.resolve(Flaky));
      act(() => openAsk());
      await waitFor(() => expect(quiet).toHaveBeenCalled());
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.getByRole("button", { name: "Ask about any truck" })).toBeTruthy();
      fail = false;
      act(() => openAsk());
      await waitFor(() => expect(dialog()).toBeTruthy());
    } finally {
      quiet.mockRestore();
    }
  });

  it("has the mockup's markup: a labelled dialog, the header, the chips and the composer", async () => {
    mount();
    act(() => openAsk());
    const d = await waitFor(dialog);
    expect(d.tagName).toBe("DIV"); // not <aside>: role="dialog" isn't allowed on it (DES-25)
    expect(d.classList.contains("drawer")).toBe(true);
    expect(d.getAttribute("aria-modal")).toBe("true");
    expect(within(d).getByRole("heading", { level: 2, name: "Ask Urja" })).toBeTruthy();
    expect(input().getAttribute("placeholder")).toBe("Ask in Hindi or English…");
    const chips = within(within(d).getByRole("group", { name: "Suggested questions" })).getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual([
      "Which truck earns least per km, and why?",
      "How much diesel went unaccounted last week?",
      "Show every flag on the Behror stretch",
    ]);
    expect(chips[1].getAttribute("lang")).toBe("en");
  });
});

describe("Ask states (TC-024)", () => {
  it("a chip sends the chip's question", async () => {
    const { fetchImpl } = mount();
    act(() => openAsk());
    await waitFor(dialog);
    fireEvent.click(screen.getByRole("button", { name: ASK_CHIPS.en[1].text }));
    expect(sent(fetchImpl)).toEqual({ question: ASK_CHIPS.en[1].text });
  });

  it("shows 'Asking Gemini…' while answering", async () => {
    mount(() => new Promise<Response>(() => {}));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("Which truck?");
    expect(within(dialog()).getByText("Asking Gemini…")).toBeTruthy();
    expect(within(dialog()).getByText("Which truck?").classList.contains("q")).toBe(true);
  });

  it("an answer shows its text, cite chips that link to the trips, the caveat and the provenance line", async () => {
    mount(reply(resp({ caveat: "Check the trips before acting" })));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("Which truck?");
    const d = await waitFor(() => {
      const el = dialog();
      expect(within(el).getByText("RJ14 GB 4521 had 38 L unaccounted.")).toBeTruthy();
      return el;
    });
    const cite = within(d).getByRole("link", { name: "Trip 0926-04" });
    expect(cite.getAttribute("lang")).toBe("en");
    expect(cite.getAttribute("href")).toBe("/trips/0926-04");
    expect(cite.classList.contains("cite")).toBe(true);
    expect(cite.closest("li")!.textContent).toBe("RJ14 GB 4521 · Jaipur → Okhla, Delhi" + "Trip 0926-04");
    expect(within(d).getByRole("link", { name: "Trip 0927-02" }).getAttribute("href")).toBe("/trips/0927-02");
    expect(within(d).getByText("Check the trips before acting")).toBeTruthy();
    expect(d.querySelector(".prov")!.textContent).toBe(
      "From 212 trips across 24 trucks, 1–27 Sep · Gemini 3.5 Flash · answered in 1.8 s · Urja can be wrong, so open the trips before acting.",
    );
    // An answer clears the box.
    expect((input() as HTMLInputElement).value).toBe("");
  });

  it("renders model text as text: a <script> answer is shown literally and creates no element (Review focus #2)", async () => {
    const evil = '<script>alert(1)</script><img src=x onerror="alert(2)">';
    mount(reply(resp({ answer: evil, cites: [{ tripId: "0926-04", label: "<b>bold</b>" }] })));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("<i>q</i>");
    const d = await waitFor(() => {
      const el = dialog();
      expect(within(el).getByText(evil)).toBeTruthy();
      return el;
    });
    expect(d.querySelector("script")).toBeNull();
    expect(d.querySelector("img")).toBeNull();
    expect(d.querySelector("li b")).toBeNull();
    expect(d.querySelector(".q i")).toBeNull();
    expect(document.querySelector("script")).toBeNull();
  });

  it("uses the server-computed scope when a response carries none", async () => {
    mount(reply(resp({ provenance: { ...provenance, scope: "" } })));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("q");
    await waitFor(() => expect(dialog().querySelector(".prov")!.textContent).toMatch(/^From 212 trips across 24 trucks, 1–27 Sep · /));
  });

  it("fallback: the banner, the report with its cites, 'Your question is saved', and Try again that resends", async () => {
    const { fetchImpl } = mount(reply(resp({ mode: "fallback", answer: "21–27 Sep: 217 L diesel unaccounted on 5 trips.", provenance: { ...provenance, model: null, ms: 90 } })));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("How much diesel last week?");
    const d = await waitFor(() => {
      const el = dialog();
      expect(within(el).getByRole("heading", { level: 3, name: ASK_COPY.en.fallbackBanner })).toBeTruthy();
      return el;
    });
    expect(within(d).getByText("21–27 Sep: 217 L diesel unaccounted on 5 trips.")).toBeTruthy();
    expect(within(d).getByRole("link", { name: "Trip 0926-04" }).getAttribute("href")).toBe("/trips/0926-04");
    expect(within(d).getByText(SAVED.en)).toBeTruthy();
    expect(d.querySelector(".prov")!.textContent).toContain("straight from your data, no AI · answered in 0.09 s");
    expect((input() as HTMLInputElement).value).toBe("How much diesel last week?");
    fireEvent.click(within(d).getByRole("button", { name: "Try again" }));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sent(fetchImpl, 1)).toEqual({ question: "How much diesel last week?" });
  });

  it("fallback in Hindi carries the saved line in Hindi", async () => {
    mount(reply(resp({ mode: "fallback", lang: "hi", answer: "पिछले हफ़्ते 217 L", provenance: { ...provenance, model: null } })));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("पिछले हफ़्ते कितना डीज़ल गायब हुआ?");
    await waitFor(() => expect(within(dialog()).getByText(SAVED.hi)).toBeTruthy());
    expect(within(dialog()).getByText(SAVED.hi).closest("[lang]")!.getAttribute("lang")).toBe("hi");
  });

  it("saved: the saved message, the question kept in the input, and Try again", async () => {
    mount(reply(resp({ mode: "saved", answer: SAVED.en, cites: [], provenance: { ...provenance, model: null } })));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("Will it rain in Behror?");
    await waitFor(() => expect(within(dialog()).getByText(SAVED.en)).toBeTruthy());
    expect(within(dialog()).getByRole("heading", { level: 3 }).textContent).toBe(ASK_COPY.en.savedBanner);
    expect(within(dialog()).getByRole("button", { name: "Try again" })).toBeTruthy();
    expect((input() as HTMLInputElement).value).toBe("Will it rain in Behror?");
  });

  it("a 429 shows when to ask again as its heading, with the fallback it carries (DES-18)", async () => {
    mount(reply(resp({ mode: "fallback", retryAfterS: 12, provenance: { ...provenance, model: null } }), 429));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("q");
    await waitFor(() => expect(within(dialog()).getByRole("heading", { level: 3, name: ASK_COPY.en.retryAfter(12) })).toBeTruthy());
    // The AI wasn't asked, so nothing blames it; the one wait is the heading's.
    expect(within(dialog()).queryByText(ASK_COPY.en.fallbackBanner)).toBeNull();
    expect(within(dialog()).getByText(ASK_COPY.en.savedShort)).toBeTruthy();
    expect(dialog().textContent).not.toContain("in a minute");
    expect((within(dialog()).getByRole("button", { name: "Try again" }) as HTMLButtonElement).disabled).toBe(true);
    // The cites and the report are still there.
    expect(within(dialog()).getByRole("link", { name: "Trip 0926-04" })).toBeTruthy();
  });

  it("error: says what happened, keeps the question and offers Try again", async () => {
    mount(() => Promise.reject(new TypeError("Failed to fetch")));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("Which truck?");
    await waitFor(() => expect(within(dialog()).getByText(ASK_COPY.en.error)).toBeTruthy());
    expect((input() as HTMLInputElement).value).toBe("Which truck?");
    expect(within(dialog()).getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("encodes the trip id in a cite's href", async () => {
    mount(reply(resp({ cites: [{ tripId: "09/26?x", label: "odd" }] })));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("q");
    const cite = await waitFor(() => within(dialog()).getByRole("link", { name: "Trip 09/26?x" }));
    expect(cite.getAttribute("href")).toBe("/trips/09%2F26%3Fx");
  });

  it("following a cite chip closes the sheet", async () => {
    mount();
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("q");
    const cite = await waitFor(() => within(dialog()).getByRole("link", { name: "Trip 0926-04" }));
    cite.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(cite);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("Ask rate-limited (429) state (DES-18)", () => {
  afterEach(() => vi.useRealTimers());

  const savedState = (lang: "en" | "hi", retryAfterS = 3) =>
    ({
      status: "saved",
      question: "q",
      retryAfterS,
      response: resp({ mode: "saved", lang, answer: SAVED[lang], cites: [], provenance: { ...provenance, model: null } }),
    }) as const;
  const shown = (el: HTMLElement) => el.querySelector("[aria-hidden]")?.textContent ?? el.textContent;

  it.each(["en", "hi"] as const)("%s: the wait is the heading; 'Try again' stays disabled and counts down until it has passed", (lang) => {
    vi.useFakeTimers();
    const c = ASK_COPY[lang];
    const onRetry = vi.fn();
    const { container } = render(<AskAnswer state={savedState(lang)} lang={lang} scope={SHELL_SCOPE} saved={SAVED} onRetry={onRetry} />);
    const heading = () => screen.getByRole("heading", { level: 3 });
    const button = () => screen.getByRole("button") as HTMLButtonElement;

    // One wait on screen, stated once to assistive tech; no banner about the AI; no "in a minute".
    expect(shown(heading())).toBe(c.retryAfter(3));
    expect(heading().querySelector(".sr")!.textContent).toBe(c.retryAfter(3));
    expect(container.textContent).not.toContain(c.savedBanner);
    expect(container.textContent).not.toContain(SAVED[lang]);
    expect(screen.getByText(c.savedShort)).toBeTruthy();
    expect(SAVED[lang].startsWith(c.savedShort)).toBe(true);
    expect(button().disabled).toBe(true);
    expect(shown(button())).toBe(c.retryIn(3));
    expect(button().querySelector(".sr")!.textContent).toBe(c.retry);
    fireEvent.click(button());
    expect(onRetry).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(1000));
    expect(shown(heading())).toBe(c.retryAfter(2));
    expect(shown(button())).toBe(c.retryIn(2));
    expect(button().disabled).toBe(true);

    act(() => void vi.advanceTimersByTime(1000));
    act(() => void vi.advanceTimersByTime(1000));
    expect(heading().textContent).toBe(c.retryReady);
    expect(button().disabled).toBe(false);
    expect(button().textContent).toBe(c.retry);
    fireEvent.click(button());
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each(["en", "hi"] as const)("%s: a daily cap (wait to midnight) says to come back tomorrow, with no countdown and no 'Try again'", (lang) => {
    vi.useFakeTimers();
    const c = ASK_COPY[lang];
    const { container } = render(<AskAnswer state={savedState(lang, 61234)} lang={lang} scope={SHELL_SCOPE} saved={SAVED} onRetry={() => {}} />);
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(c.dailyLimit);
    expect(container.textContent).not.toContain("61234");
    expect(container.textContent).not.toContain(c.retryAfter(61234));
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(c.savedShort)).toBeTruthy();
    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(c.dailyLimit);
  });

  it("a wait of exactly 60 s still counts down", () => {
    render(<AskAnswer state={savedState("en", 60)} lang="en" scope={SHELL_SCOPE} saved={SAVED} onRetry={() => {}} />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("heading", { level: 3, name: ASK_COPY.en.retryAfter(60) })).toBeTruthy();
  });

  it("without a wait, saved keeps its banner, its full line and an enabled 'Try again'", () => {
    const state = { ...savedState("en"), retryAfterS: undefined };
    render(<AskAnswer state={state} lang="en" scope={SHELL_SCOPE} saved={SAVED} onRetry={() => {}} />);
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(ASK_COPY.en.savedBanner);
    expect(screen.getByText(SAVED.en)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Try again" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it.each([undefined, 9, 61234])("Stage 9: a refusal (retryAfterS %s) shows the refusal itself: no banner, no wait, no 'saved', no 'Try again'", (retryAfterS) => {
    const refusal = "I don't have that data. I only know Sharma Roadlines' own trips, trucks, diesel and money, so ask me about those.";
    const state = {
      status: "saved",
      question: "What's the weather in Jaipur tomorrow?",
      ...(retryAfterS ? { retryAfterS } : {}),
      response: resp({ mode: "saved", lang: "en", answer: refusal, cites: [], refusal: "out_of_scope", provenance: { ...provenance, model: null } }),
    } as const;
    const { container } = render(<AskAnswer state={state} lang="en" scope={SHELL_SCOPE} saved={SAVED} onRetry={() => {}} />);
    const c = ASK_COPY.en;
    expect(screen.getByText(refusal)).toBeTruthy();
    expect(container.querySelector('[data-mode="refusal"]')).not.toBeNull();
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    for (const s of [c.savedBanner, c.savedShort, c.dailyLimit, SAVED.en]) expect(container.textContent).not.toContain(s);
  });

  it("no rate-limit line blames the AI", () => {
    for (const l of ["en", "hi"] as const) {
      const c = ASK_COPY[l];
      for (const s of [c.retryAfter(9), c.retryReady, c.retryIn(9), c.savedShort, c.dailyLimit]) expect(s).not.toMatch(/\bAI\b/);
    }
  });
});

describe("AskDock (TSK-12.3)", () => {
  const copy = { label: "Urja से पूछें", placeholder: "कुछ भी पूछें…", button: "पूछें" };

  it("sends the dock's question to the same hook and opens the chat view", async () => {
    const { fetchImpl } = mount(reply(resp()), <AskDock lang="hi" copy={copy} />);
    const dockInput = screen.getByRole("textbox", { name: copy.label });
    fireEvent.change(dockInput, { target: { value: "सबसे कम कौन कमाता है?" } });
    fireEvent.click(screen.getByRole("button", { name: copy.button }));
    await waitFor(() => expect(dialog()).toBeTruthy());
    expect(sent(fetchImpl)).toEqual({ question: "सबसे कम कौन कमाता है?", lang: "hi" });
    await waitFor(() => expect(within(dialog()).getByText("RJ14 GB 4521 had 38 L unaccounted.")).toBeTruthy());
    expect((dockInput as HTMLInputElement).value).toBe("");
  });

  it("sits in a labelled search landmark, and the drawer is a div with role dialog (axe region, aria-allowed-role; DES-25)", async () => {
    mount(reply(resp()), <AskDock lang="hi" copy={copy} />);
    const form = screen.getByRole("search", { name: copy.label });
    expect(within(form).getByRole("textbox", { name: copy.label })).toBeTruthy();
    fireEvent.click(within(form).getByRole("button", { name: copy.button }));
    await waitFor(() => expect(dialog()).toBeTruthy());
    expect(dialog().tagName).toBe("DIV");
    expect(dialog().id).toBe("ask-drawer");
  });

  it("an empty dock just opens the chat view", async () => {
    const { fetchImpl } = mount(reply(resp()), <AskDock lang="en" copy={copy} />);
    fireEvent.click(screen.getByRole("button", { name: copy.button }));
    await waitFor(() => expect(dialog()).toBeTruthy());
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("the drawer on a Hindi screen (EXE23): its labels follow <html lang>", () => {
  const hi = ASK_COPY.hi;
  const hiDialog = () => screen.getByRole("dialog", { name: hi.title });
  const hiInput = () => screen.getByRole("textbox", { name: hi.inputLabel });
  const setLang = (l: string) => act(() => void (document.documentElement.lang = l));
  afterEach(() => setLang("en"));

  async function openHi(fetchImpl?: (...a: unknown[]) => Promise<Response>) {
    setLang("hi");
    const m = mount(fetchImpl);
    act(() => openAsk());
    await waitFor(() => expect(hiDialog()).toBeTruthy());
    return m;
  }

  it("titles, labels, placeholder, buttons and the three chips are Hindi", async () => {
    await openHi();
    const d = hiDialog();
    expect(d.getAttribute("lang")).toBe("hi");
    expect(within(d).getByRole("heading", { level: 2 }).textContent).toBe("Urja से पूछें");
    expect(hiInput().getAttribute("placeholder")).toBe(hi.placeholder);
    expect(within(d).getByRole("button", { name: hi.close })).toBeTruthy();
    expect(within(d).getByRole("button", { name: hi.submit })).toBeTruthy();
    const chips = within(within(d).getByRole("group", { name: hi.suggestedLabel })).getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual(ASK_CHIPS.hi.map((c) => c.text));
    expect(chips.every((c) => c.getAttribute("lang") === "hi" && c.classList.contains("hi"))).toBe(true);
    // Every visible label is Devanagari (the brand and model names aside).
    for (const s of [hi.title, hi.inputLabel, hi.placeholder, hi.submit, hi.close, hi.suggestedLabel]) expect(s).toMatch(/[ऀ-ॿ]/);
  });

  it("a chip sends its Hindi question, so the answer comes back in Hindi", async () => {
    const { fetchImpl } = await openHi();
    fireEvent.click(screen.getByRole("button", { name: ASK_CHIPS.hi[0].text }));
    expect(sent(fetchImpl)).toEqual({ question: ASK_CHIPS.hi[0].text });
    expect(ASK_CHIPS.hi[0].text).toMatch(/[ऀ-ॿ]/);
  });

  it("answering and the answer's provenance line are Hindi, with the Hindi scope", async () => {
    let release: (r: Response) => void = () => {};
    await openHi(() => new Promise<Response>((r) => (release = r)));
    fireEvent.change(hiInput(), { target: { value: "सबसे कम कौन कमाता है?" } });
    fireEvent.submit(hiInput().closest("form")!);
    await waitFor(() => expect(within(hiDialog()).getByText(hi.answering)).toBeTruthy());
    await act(async () => release(new Response(JSON.stringify(resp({ lang: "hi" })), { status: 200 })));
    const prov = await waitFor(() => hiDialog().querySelector(".prov")!);
    expect(prov.getAttribute("lang")).toBe("hi");
    expect(prov.textContent).toBe(provenanceLine({ scope: SCOPE_HI, model: "gemini-3.5-flash", ms: 1800 }, "hi"));
    const list = within(hiDialog()).getByRole("list", { name: hi.citesLabel });
    const cite = within(list).getByRole("link", { name: "ट्रिप 0926-04" });
    expect(cite.getAttribute("lang")).toBe("hi");
    expect(cite.getAttribute("href")).toBe("/trips/0926-04");
    expect(within(list).queryByText(/^Trip /)).toBeNull();
  });

  it("fallback: both banner clauses, the saved line and Try again are Hindi", async () => {
    const { fetchImpl } = await openHi(reply(resp({ mode: "fallback", lang: "hi", answer: "21–27 सितंबर: 217 L डीज़ल का हिसाब नहीं।", provenance: { ...provenance, model: null } })));
    fireEvent.change(hiInput(), { target: { value: "पिछले हफ़्ते?" } });
    fireEvent.submit(hiInput().closest("form")!);
    const banner = await waitFor(() => within(hiDialog()).getByRole("heading", { level: 3 }));
    expect(banner.textContent).toBe(hi.fallbackBanner);
    expect(banner.getAttribute("lang")).toBe("hi");
    expect(within(hiDialog()).getByText(SAVED.hi)).toBeTruthy();
    expect(hiDialog().querySelector(".prov")!.textContent).toContain(hi.noModel);
    fireEvent.click(within(hiDialog()).getByRole("button", { name: hi.retry }));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  });

  it("saved, 429 and error lines are Hindi", async () => {
    await openHi(reply({ ...resp({ mode: "saved", lang: "hi", answer: SAVED.hi, cites: [] }), retryAfterS: 9 }, 429));
    fireEvent.change(hiInput(), { target: { value: "कल बारिश होगी?" } });
    fireEvent.submit(hiInput().closest("form")!);
    await waitFor(() => expect(within(hiDialog()).getByRole("heading", { level: 3, name: hi.retryAfter(9) })).toBeTruthy());
    expect(within(hiDialog()).getByText(hi.savedShort).closest("[lang]")!.getAttribute("lang")).toBe("hi");
    expect(within(hiDialog()).getByRole("button", { name: hi.retry }).querySelector("[aria-hidden]")!.textContent).toBe(hi.retryIn(9));
    cleanup();
    await openHi(() => Promise.reject(new TypeError("offline")));
    fireEvent.change(hiInput(), { target: { value: "कल?" } });
    fireEvent.submit(hiInput().closest("form")!);
    const err = await waitFor(() => within(hiDialog()).getByText(hi.error));
    expect(err.closest("[lang]")!.getAttribute("lang")).toBe("hi");
    expect(within(hiDialog()).getByRole("button", { name: hi.retry })).toBeTruthy();
  });

  it("follows the language toggle while mounted: hi → en → hi", async () => {
    await openHi();
    setLang("en");
    await waitFor(() => expect(dialog()).toBeTruthy());
    expect(input().getAttribute("placeholder")).toBe(ASK_COPY.en.placeholder);
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(expect.arrayContaining(ASK_CHIPS.en.map((c) => c.text)));
    setLang("hi");
    await waitFor(() => expect(hiDialog()).toBeTruthy());
  });

  it("stays English everywhere else", async () => {
    mount();
    act(() => openAsk());
    await waitFor(() => expect(dialog()).toBeTruthy());
    expect(dialog().getAttribute("lang")).toBe("en");
    expect(within(dialog()).getByRole("heading", { level: 2 }).textContent).toBe("Ask Urja");
  });
});
