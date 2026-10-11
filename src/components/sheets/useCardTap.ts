"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Card, CardAction, CardActionResult } from "@/api/contract";
import { errorMessage } from "@/api/http";
import { openIn, parseGoRoute, preopenTab, type GoRoute } from "@/lib/links";
import { toastGo } from "@/lib/toast";
import { cards as copy } from "@/data/seed/copy";
import { buttonGone, tapCard } from "@/state";

/**
 * The two answers that must open in the browser itself, never framed (CONTRACT-APP §4.7): the vault (`approve`) and the
 * listen-in page (`listen`). Their tab is opened inside the tap. Every other page Go answers with opens inside the app.
 */
const OPENS_IN_BROWSER = new Set(["approve", "listen"]);

/** A page Go answered a tap with (its "Log in to ixigo" view, a page to watch): framed in a sheet, never a new tab. */
export interface GoPage {
  /** The card and the button that opened it: the page is done with once Go takes that button off the card. */
  cardId: string;
  actionId: string;
  /** Handed to the frame exactly as it came: a link like this carries its access in the `#fragment`. */
  url: string;
}

/**
 * How long a card waits for Go once its page has ended itself. Go replaces the card within a few seconds; if it never
 * does, the button can be pressed again after this.
 */
const SETTLE_MS = 20_000;

/** Whether the card still offers this person the button: Go takes it off once what it opened is done with. */
export function offers(card: Card | null | undefined, actionId: string, meId: string): boolean {
  const actions = (card as { actions?: CardAction[] | null } | null | undefined)?.actions ?? [];
  return actions.some((a) => a.action_id === actionId && (!a.only_for_person_ids || a.only_for_person_ids.includes(meId)));
}

/** Where a `go://` link leads when it is one of the app's own screens on another route. */
function pathFor(route: GoRoute): string | null {
  if (route.kind === "tab") return `/trips/${route.tripId}/${route.tab}`;
  if (route.kind === "checkin") return `/trips/${route.tripId}?checkin=${encodeURIComponent(route.bookingId)}`;
  return null;
}

export interface CardTap {
  /** The card whose tap is on its way: disable its buttons meanwhile (CONTRACT-APP §4.7). */
  pending: string | null;
  /**
   * The card whose page ended itself (the login was detected) and that Go has not replaced yet: it still shows the
   * button, which waits as it does for a tap, and is not pressed again meanwhile.
   */
  settling: string | null;
  /** The framed page said it is finished with: its card waits for Go from here. */
  pageEnded(page: GoPage): void;
  tap(cardId: string, actionId: string, opts?: { optionId?: string; payload?: { trip: "oneway" | "round" } }): Promise<CardActionResult | null>;
  /** Follows a `go://` link (a card button, or a notice's link): a sheet of this room, or another screen. */
  follow(url: string): void;
}

/**
 * One press of a Go card button: sends it, then does what Go answered. `done` / `refused` show the toast; `open` opens
 * one of the app's own screens for a `go://` link, or an `https://` page at once: framed in a sheet (`onPage`), except
 * the vault and the listen-in page, which open in the browser. Never retried on its own.
 *
 * @param offered Whether the card still offers me the button that opened a page (see `offers`).
 */
export function useCardTap(
  tripId: string,
  onSheet: (route: Extract<GoRoute, { kind: "sheet" | "booking" }>) => void,
  onPage: (page: GoPage) => void,
  offered: (page: GoPage) => boolean,
): CardTap {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [ended, setEnded] = useState<GoPage | null>(null);
  const settling = ended && offered(ended) ? ended.cardId : null;
  // Go took the button off: the wait is over for good, also if Go offers the same button again later (after a log out).
  if (ended && !settling) setEnded(null);
  useEffect(() => {
    if (!settling) return;
    const timer = window.setTimeout(() => setEnded(null), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [settling]);

  function follow(url: string) {
    const route = parseGoRoute(url);
    if (!route) return;
    if (route.kind === "sheet" || route.kind === "booking") {
      if (route.tripId === tripId) onSheet(route);
      else router.push(`/trips/${route.tripId}/chat`);
      return;
    }
    const path = pathFor(route);
    if (path) router.push(path);
  }

  async function tap(cardId: string, actionId: string, opts: { optionId?: string; payload?: { trip: "oneway" | "round" } } = {}) {
    if (pending || cardId === settling) return null;
    const browser = OPENS_IN_BROWSER.has(actionId);
    const tab = browser ? preopenTab() : null;
    setPending(cardId);
    try {
      const result = await tapCard(tripId, cardId, actionId, opts);
      if (result.result === "open") {
        if (result.url.startsWith("go://")) {
          tab?.close();
          follow(result.url);
        } else if (browser) openIn(tab, result.url);
        else if (/^https:\/\//i.test(result.url)) onPage({ cardId, actionId, url: result.url });
      } else {
        tab?.close();
        if (result.toast) toastGo(result.toast);
      }
      return result;
    } catch (err) {
      tab?.close();
      toastGo(buttonGone(tripId, err) ? copy.changed : errorMessage(err));
      return null;
    } finally {
      setPending(null);
    }
  }

  return { pending, settling, pageEnded: setEnded, tap, follow };
}
