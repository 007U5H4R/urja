"use client";

import { Icon } from "@/components/ui/Icon";
import { openAsk } from "@/lib/ask-events";

/**
 * The top-bar search field (final/index.html line 18). It opens the Ask dialog;
 * TKT-12 wires `onOpen`. The aria-label keeps a name once `.ph` is hidden ≤1180px.
 */
export function AskTrigger({ onOpen = openAsk }: { onOpen?: () => void }) {
  return (
    <button
      type="button"
      className="askbar"
      id="askBtn"
      aria-haspopup="dialog"
      aria-label="Ask about any truck, trip or driver"
      onClick={() => onOpen()}
    >
      <Icon name="search" />
      <span className="ph">Ask about any truck, trip or driver…</span>
      <span className="kbd">⌘K</span>
    </button>
  );
}
