"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CardActionResult } from "@/api/contract";
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

/** Where a `go://` link leads when it is one of the app's own screens on another route. */
function pathFor(route: GoRoute): string | null {
  if (route.kind === "tab") return `/trips/${route.tripId}/${route.tab}`;
  if (route.kind === "checkin") return `/trips/${route.tripId}?checkin=${encodeURIComponent(route.bookingId)}`;
  return null;
}

export interface CardTap {
  /** The card whose tap is on its way: disable its buttons meanwhile (CONTRACT-APP §4.7). */
  pending: string | null;
  tap(cardId: string, actionId: string, opts?: { optionId?: string; payload?: { trip: "oneway" | "round" } }): Promise<CardActionResult | null>;
  /** Follows a `go://` link (a card button, or a notice's link): a sheet of this room, or another screen. */
  follow(url: string): void;
}

/**
 * One press of a Go card button: sends it, then does what Go answered. `done` / `refused` show the toast; `open` opens
 * one of the app's own screens for a `go://` link, or an `https://` page at once: framed in a sheet (`onPage`), except
 * the vault and the listen-in page, which open in the browser. Never retried on its own.
 */
export function useCardTap(
  tripId: string,
  onSheet: (route: Extract<GoRoute, { kind: "sheet" | "booking" }>) => void,
  onPage: (page: GoPage) => void,
): CardTap {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

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
    if (pending) return null;
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

  return { pending, tap, follow };
}
