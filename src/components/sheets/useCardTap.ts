"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CardActionResult } from "@/api/contract";
import { errorMessage } from "@/api/http";
import { openIn, parseGoRoute, preopenTab, type GoRoute } from "@/lib/links";
import { toastGo } from "@/lib/toast";
import { tapCard } from "@/state";

/** Actions whose answer is a page to open (the vault, Go's live view): the tab is opened inside the tap. */
const OPENS_A_PAGE = new Set(["approve", "watch", "listen"]);

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
 * an `https://` page at once, or one of the app's own screens for a `go://` link. Never retried on its own.
 */
export function useCardTap(tripId: string, onSheet: (route: Extract<GoRoute, { kind: "sheet" | "booking" }>) => void): CardTap {
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
    const tab = OPENS_A_PAGE.has(actionId) ? preopenTab() : null;
    setPending(cardId);
    try {
      const result = await tapCard(tripId, cardId, actionId, opts);
      if (result.result === "open") {
        if (result.url.startsWith("go://")) {
          tab?.close();
          follow(result.url);
        } else openIn(tab, result.url);
      } else {
        tab?.close();
        if (result.toast) toastGo(result.toast);
      }
      return result;
    } catch (err) {
      tab?.close();
      toastGo(errorMessage(err));
      return null;
    } finally {
      setPending(null);
    }
  }

  return { pending, tap, follow };
}
