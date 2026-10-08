"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { stageAt, stageIndexOf } from "@/data/scenario/engine";
import { BOOKINGS } from "@/data/seed/bookings";
import { PLACES } from "@/data/seed/places";
import { STAYS } from "@/data/seed/stays";
import type { CardKind, StageId, TripId } from "@/data/types";
import { useStore } from "@/store";
import type { BoardTarget } from "@/store/selectors";

// URL ↔ sheet state for the chat route (PLAN §8; C-chat-kickoff.md §1.1, E-deciding.md §1.1, F-travel.md §1.5,
// G-bali.md §1.3, H-board.md §1.4). The query string is the source of truth for which content sheet is open.

export type ChatSheet =
  | "quickstart"
  | "from"
  | "place"
  | "budget"
  | "stay"
  | "pay"
  | "route"
  | "cab"
  | "private"
  | "ticket"
  | "visa"
  | "board"
  | "share";

const SHEETS: readonly ChatSheet[] = [
  "quickstart",
  "from",
  "place",
  "budget",
  "stay",
  "pay",
  "route",
  "cab",
  "private",
  "ticket",
  "visa",
  "board",
  "share",
];

/** Params a content sheet owns; closing a sheet strips them all. */
const SHEET_PARAMS = ["sheet", "id", "q"] as const;

// G-bali.md §1.3: the Bali board icon toasts instead of opening the sheet.
const BOARDLESS: ReadonlySet<TripId> = new Set<TripId>(["bali"]);

// `?sheet=` values that fast-forward the scenario before opening (E-deciding.md §1.1, H-board.md §1.4).
const ENSURE: Partial<Record<ChatSheet, StageId>> = { budget: "budget", stay: "stays", route: "travel" };

// Board rows that close the board, fast-forward, then scroll to their card (H-board.md §1.4).
const BOARD_CARDS: Partial<Record<BoardTarget, { stage: StageId; card: CardKind }>> = {
  where: { stage: "places", card: "place-poll" },
  when: { stage: "dates-poll", card: "dates-poll" },
  stay: { stage: "stays", card: "stay-poll" },
};
// Board rows that swap the board for another sheet in one URL replace.
const BOARD_SHEETS: Partial<Record<BoardTarget, { stage: StageId; sheet: ChatSheet }>> = {
  budget: { stage: "budget", sheet: "budget" },
  travel: { stage: "travel", sheet: "route" },
};

/**
 * Writes the chat query string with the native History API (Next syncs `useSearchParams` with it, no RSC round trip).
 * `push` adds an entry so Back closes the sheet first; `replace` rewrites the current one (PLAN §8).
 */
export function writeChatQuery(mutate: (params: URLSearchParams) => void, how: "push" | "replace" = "replace") {
  const params = new URLSearchParams(window.location.search);
  mutate(params);
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  if (how === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

interface Guard {
  tripId: TripId;
  stageIndex: number;
  stageId: StageId;
  bookingOpen: boolean;
}

const hasStage = (tripId: TripId, id: StageId) => stageIndexOf(tripId, id) >= 0;
const reached = (g: Guard, id: StageId) => hasStage(g.tripId, id) && g.stageIndex >= stageIndexOf(g.tripId, id);

/** Query guards: false strips the params (unknown sheet or id, or a sheet that can't open in this trip/stage). */
function sheetAllowed(sheet: ChatSheet, id: string | null, g: Guard): boolean {
  switch (sheet) {
    case "quickstart":
      return g.stageId === "kickoff";
    case "place":
      // Valid from `places` on: the poll stays in the history, so its sheet keeps working.
      return reached(g, "places") && PLACES.some((p) => p.id === id);
    case "stay":
      return hasStage(g.tripId, "stays") && STAYS.some((s) => s.id === id);
    case "pay":
      return g.stageId === "pay" && g.bookingOpen;
    case "route":
      return hasStage(g.tripId, "travel");
    case "cab":
      return hasStage(g.tripId, "route-confirm");
    case "private":
      return reached(g, "private");
    case "ticket":
      // The e-ticket viewer opens from the private sheet, so it needs that stage and a booking that has a ticket.
      return reached(g, "private") && BOOKINGS.some((b) => b.id === id && b.ticket);
    case "visa":
      return hasStage(g.tripId, "visa");
    case "board":
      return !BOARDLESS.has(g.tripId);
    case "from":
    case "budget":
    case "share":
      return true;
  }
}

const isSheet = (value: string | null): value is ChatSheet => SHEETS.includes(value as ChatSheet);

export interface ChatSheets {
  /** The open content sheet after the guards; QuickStart auto-opens while it is pending in `kickoff`. */
  sheet: ChatSheet | null;
  /** `?id=` for the place / stay sheets. */
  sheetId: string | null;
  /** `?q=`: the QuickStart / From sheet opens in search mode with this query. */
  query: string | null;
  /** Opens by tap: pushes an entry so Back closes the sheet first. */
  open(sheet: ChatSheet, id?: string): void;
  /** Swaps the open sheet for another in one URL replace (board → budget / route, private → ticket). */
  swap(sheet: ChatSheet, id?: string): void;
  /** Closes the open sheet: `history.back()` when this screen pushed it, otherwise a replace that strips it. */
  close(): void;
  /** Board row / reminder / Vote: close or swap, fast-forward, then scroll to the row's card. */
  boardAction(target: BoardTarget): void;
}

export function useChatSheets(tripId: TripId, opts: { onScrollToCard(card: CardKind): void }): ChatSheets {
  const params = useSearchParams();
  const stageIndex = useStore((s) => s.chat[tripId].stageIndex);
  const quickStart = useStore((s) => s.chat[tripId].quickStart);
  const bookingOpen = useStore((s) => s.chat[tripId].stayBooking.status === "open");
  const stageId = stageAt(tripId, stageIndex).id;

  const raw = params.get("sheet");
  const rawId = params.get("id");
  const guard: Guard = { tripId, stageIndex, stageId, bookingOpen };
  const allowed = isSheet(raw) && sheetAllowed(raw, rawId, guard);

  // DESIGN-ASSUMPTION (H-board.md §1.1): an explicit `?sheet=` suppresses the QuickStart auto-open
  // (C-chat-kickoff.md §1.1 says pending wins; only one content sheet can be open at a time).
  const autoQuickStart = raw === null && stageId === "kickoff" && quickStart === "pending";
  const sheet: ChatSheet | null = allowed ? raw : autoQuickStart ? "quickstart" : null;

  // True while the open sheet's history entry was pushed by this screen (a tap), so closing pops it.
  const pushed = useRef(false);
  useEffect(() => {
    const onPop = () => {
      pushed.current = false;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // `?sheet=budget|stay|route` fast-forward first (forward-only, no timers).
  const ensure = isSheet(raw) ? ENSURE[raw] : undefined;
  useEffect(() => {
    if (ensure) useStore.getState().ensureStage(tripId, ensure);
  }, [ensure, tripId]);

  // Unknown sheets / ids and sheets that can't open here are stripped from the URL.
  const strip = raw !== null && !allowed;
  useEffect(() => {
    if (!strip) return;
    writeChatQuery((p) => SHEET_PARAMS.forEach((k) => p.delete(k)));
  }, [strip]);

  // `?stage=<id>` demo jump (PLAN §8): fast-forward once, then drop the param.
  const jump = params.get("stage");
  useEffect(() => {
    if (jump === null) return;
    const target = jump as StageId;
    if (hasStage(tripId, target)) useStore.getState().ensureStage(tripId, target);
    writeChatQuery((p) => p.delete("stage"));
  }, [jump, tripId]);

  function open(next: ChatSheet, id?: string) {
    writeChatQuery((p) => {
      p.set("sheet", next);
      if (id) p.set("id", id);
      else p.delete("id");
      p.delete("q");
      p.delete("mode");
      p.delete("msg");
    }, "push");
    pushed.current = true;
  }

  function swap(next: ChatSheet, id?: string) {
    writeChatQuery((p) => {
      p.set("sheet", next);
      if (id) p.set("id", id);
      else p.delete("id");
      p.delete("q");
    });
  }

  function close() {
    if (!new URLSearchParams(window.location.search).has("sheet")) return; // auto-opened QuickStart has no param
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
      return;
    }
    writeChatQuery((p) => SHEET_PARAMS.forEach((k) => p.delete(k)));
  }

  function boardAction(target: BoardTarget) {
    const store = useStore.getState();
    const toSheet = BOARD_SHEETS[target];
    if (toSheet) {
      store.ensureStage(tripId, toSheet.stage);
      swap(toSheet.sheet);
      return;
    }
    const toCard = BOARD_CARDS[target];
    close();
    if (!toCard) return;
    store.ensureStage(tripId, toCard.stage);
    opts.onScrollToCard(toCard.card);
  }

  return {
    sheet,
    sheetId: allowed ? rawId : null,
    query: params.get("q"),
    open,
    swap,
    close,
    boardAction,
  };
}
