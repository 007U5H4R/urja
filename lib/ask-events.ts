/**
 * Opening Ask from anywhere in the shell. The top-bar AskTrigger and the
 * mobile menu's "Ask Urja" call `openAsk()`, which fires ASK_OPEN_EVENT on
 * window; TKT-12's Ask sheet listens for that event and opens the dialog.
 */
export const ASK_OPEN_EVENT = "urja:ask-open";

export function openAsk(): void {
  window.dispatchEvent(new CustomEvent(ASK_OPEN_EVENT));
}
