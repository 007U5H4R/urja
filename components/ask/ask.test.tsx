// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { AskResponse } from "@/lib/ask/contract";
import { openAsk } from "@/lib/ask-events";
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
    <AskProvider scope={SCOPE} saved={SAVED} fetchImpl={f as unknown as typeof fetch} loadSheet={loadSheet}>
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
    fireEvent.click(screen.getByRole("button", { name: ASK_COPY.close }));
    await waitFor(() => expect(container.hasAttribute("inert")).toBe(false));
  });

  it("⌘K while the sheet is open puts focus back in the input", async () => {
    mount();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    await waitFor(() => expect(document.activeElement).toBe(input()));
    screen.getByRole("button", { name: ASK_COPY.close }).focus();
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
    expect(d.tagName).toBe("ASIDE");
    expect(d.classList.contains("drawer")).toBe(true);
    expect(d.getAttribute("aria-modal")).toBe("true");
    expect(within(d).getByRole("heading", { level: 2, name: "Ask Urja" })).toBeTruthy();
    expect(input().getAttribute("placeholder")).toBe("Ask in Hindi or English…");
    const chips = within(within(d).getByRole("group", { name: "Suggested questions" })).getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual([
      "Which truck earns least per km, and why?",
      "पिछले हफ़्ते कितना डीज़ल गायब हुआ?",
      "Show every flag on the Behror stretch",
    ]);
    expect(chips[1].getAttribute("lang")).toBe("hi");
  });
});

describe("Ask states (TC-024)", () => {
  it("a chip sends the chip's question", async () => {
    const { fetchImpl } = mount();
    act(() => openAsk());
    await waitFor(dialog);
    fireEvent.click(screen.getByRole("button", { name: ASK_CHIPS[1].text }));
    expect(sent(fetchImpl)).toEqual({ question: ASK_CHIPS[1].text });
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
      expect(within(el).getByRole("heading", { level: 3, name: ASK_COPY.fallbackBanner })).toBeTruthy();
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
    expect(within(dialog()).getByRole("heading", { level: 3 }).textContent).toBe(ASK_COPY.savedBanner);
    expect(within(dialog()).getByRole("button", { name: "Try again" })).toBeTruthy();
    expect((input() as HTMLInputElement).value).toBe("Will it rain in Behror?");
  });

  it("a 429 shows when to ask again, with the fallback it carries", async () => {
    mount(reply(resp({ mode: "fallback", retryAfterS: 12, provenance: { ...provenance, model: null } }), 429));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("q");
    await waitFor(() => expect(within(dialog()).getByText(ASK_COPY.retryAfter(12))).toBeTruthy());
    expect(within(dialog()).getByRole("heading", { level: 3, name: ASK_COPY.fallbackBanner })).toBeTruthy();
  });

  it("error: says what happened, keeps the question and offers Try again", async () => {
    mount(() => Promise.reject(new TypeError("Failed to fetch")));
    act(() => openAsk());
    await waitFor(dialog);
    await askQuestion("Which truck?");
    await waitFor(() => expect(within(dialog()).getByText(ASK_COPY.error)).toBeTruthy());
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

  it("an empty dock just opens the chat view", async () => {
    const { fetchImpl } = mount(reply(resp()), <AskDock lang="en" copy={copy} />);
    fireEvent.click(screen.getByRole("button", { name: copy.button }));
    await waitFor(() => expect(dialog()).toBeTruthy());
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
