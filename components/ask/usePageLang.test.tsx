// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePageLang } from "./usePageLang";

// EXE23: the drawer's language follows <html lang>, watched by one MutationObserver.

afterEach(() => {
  cleanup();
  document.documentElement.lang = "en";
  vi.restoreAllMocks();
});

function Probe({ onRender }: { onRender: (l: string) => void }) {
  const lang = usePageLang();
  onRender(lang);
  return <p>{lang}</p>;
}

describe("usePageLang", () => {
  it("reads <html lang> and follows a change", async () => {
    document.documentElement.lang = "hi";
    const seen: string[] = [];
    const { container } = render(<Probe onRender={(l) => seen.push(l)} />);
    expect(container.textContent).toBe("hi");
    await act(async () => void (document.documentElement.lang = "en"));
    expect(container.textContent).toBe("en");
  });

  it("disconnects its observer on unmount, and no longer re-renders", async () => {
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const seen: string[] = [];
    const { unmount } = render(<Probe onRender={(l) => seen.push(l)} />);
    expect(observe).toHaveBeenCalledWith(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    expect(disconnect).not.toHaveBeenCalled();
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(observe.mock.calls.length);
    const renders = seen.length;
    await act(async () => void (document.documentElement.lang = "hi"));
    expect(seen.length).toBe(renders);
  });
});
