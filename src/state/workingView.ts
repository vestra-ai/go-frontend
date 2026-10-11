import type { Id, WorkingCard } from "@/api/contract";
import { cards } from "@/data/seed/copy";
import { httpUrl } from "@/state/bookingView";

// Go doing a longer job on a site (the `working` card, CONTRACT-APP §5): what the card in the room and the screen
// viewer both draw. `live_url` and `page_url` are contract 1.3.

const copy = cards.working;

export interface WorkingModel {
  cardId: Id;
  title: string;
  state: WorkingCard["state"];
  steps: WorkingCard["steps"];
  /** Steps done, out of all of them. */
  filled: number;
  total: number;
  /** The step Go is on, and "Step 2 of 5" ("" when the card has no steps). */
  line: string;
  lineSub: string;
  status: { text: string; tone: "muted" | "success" | "danger" };
  /** The latest picture of the page. */
  screenshot?: string;
  /** The host of the page Go is on, for an address bar. */
  address?: string;
  /**
   * The live stream of Go's screen: only while Go is at it (`running` / `needs_you`) and sent one. The link is handed on
   * exactly as it came (its access token is in the `#fragment`), and it is never logged or put in an address.
   */
  liveUrl?: string;
}

function hostOf(url?: string | null): string | undefined {
  if (!httpUrl(url)) return undefined;
  try {
    return new URL(url as string).host || undefined;
  } catch {
    return undefined;
  }
}

export function toWorking(card: WorkingCard): WorkingModel {
  const total = card.steps.length;
  const filled = card.steps.filter((s) => s.state === "done").length;
  const at = card.steps.findIndex((s) => s.state === "doing");
  const current = at >= 0 ? at : Math.min(filled, Math.max(total - 1, 0));
  const tone = card.state === "done" ? "success" : card.state === "failed" ? "danger" : "muted";
  const text = { running: copy.running, needs_you: copy.needsYou, done: copy.done, failed: copy.failed }[card.state] ?? card.state;
  const working = card.state === "running" || card.state === "needs_you";
  return {
    cardId: card.card_id,
    title: card.title,
    state: card.state,
    steps: card.steps,
    filled,
    total,
    line: card.steps[current]?.text ?? card.title,
    lineSub: total > 0 ? copy.step(Math.min(current + 1, total), total) : "",
    status: { text, tone },
    screenshot: httpUrl(card.screenshot_url),
    address: hostOf(card.page_url),
    liveUrl: working && card.live_url && /^https:\/\//i.test(card.live_url) ? card.live_url : undefined,
  };
}
