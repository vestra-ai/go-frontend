import { scrollBehavior } from "@/lib/motion";

/**
 * Takes the thread to a message that is on the page and marks it for a moment (`[data-flash]`, globals.css), so the
 * reader sees which one they were taken to. False when the message is not in the thread (not loaded, or gone).
 */
export function jumpToMessage(id: string): boolean {
  const row = document.querySelector<HTMLElement>(`[data-message="${CSS.escape(id)}"]`);
  if (!row) return false;
  row.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
  // Off and on again with a layout read between, so a second jump to the same message replays the mark.
  row.removeAttribute("data-flash");
  void row.offsetWidth;
  row.setAttribute("data-flash", "");
  row.addEventListener("animationend", (e) => e.target === row && row.removeAttribute("data-flash"), { once: true });
  return true;
}
