"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { stageAt, stageIndexOf } from "@/data/scenario/engine";
import { BOOKINGS } from "@/data/seed/bookings";
import { PLACES } from "@/data/seed/places";
import { STAYS } from "@/data/seed/stays";
import type { CardKind, StageId, TripId } from "@/data/types";
import { dropQueryParams } from "@/lib/query";
import { useStore } from "@/store";
import type { BoardTarget } from "@/store/selectors";

// Sheet state for the chat route (C-chat-kickoff.md §1.1, E-deciding.md §1.1, F-travel.md §1.5, G-bali.md §1.3,
// H-board.md §1.4). Which content sheet is open lives in component state and opens only from a tap: no query param
// opens, names or closes a sheet.

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
  | "share"
  | "attachment";

// G-bali.md §1.3: the Bali board icon toasts instead of opening the sheet.
const BOARDLESS: ReadonlySet<TripId> = new Set<TripId>(["bali"]);

// Sheets that fast-forward the scenario when they open (E-deciding.md §1.1, H-board.md §1.4).
const ENSURE: Partial<Record<ChatSheet, StageId>> = { budget: "budget", stay: "stays", route: "travel" };

// Board rows that close the board, fast-forward, then scroll to their card (H-board.md §1.4).
const BOARD_CARDS: Partial<Record<BoardTarget, { stage: StageId; card: CardKind }>> = {
  where: { stage: "places", card: "place-poll" },
  when: { stage: "dates-poll", card: "dates-poll" },
  stay: { stage: "stays", card: "stay-poll" },
};
// Board rows that swap the board for another sheet.
const BOARD_SHEETS: Partial<Record<BoardTarget, { stage: StageId; sheet: ChatSheet }>> = {
  budget: { stage: "budget", sheet: "budget" },
  travel: { stage: "travel", sheet: "route" },
};

/**
 * Writes the chat query string with the native History API (Next syncs `useSearchParams` with it, no RSC round trip).
 * `push` adds an entry; `replace` rewrites the current one. Used by the composer's reply / ask-Go tray, not by sheets.
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

/** Guards: false means the sheet is not opened (unknown id, or a sheet that can't open in this trip/stage). */
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
    case "attachment":
      return true;
  }
}

export interface ChatSheets {
  /** The open content sheet after the guards; QuickStart auto-opens while it is pending in `kickoff`. */
  sheet: ChatSheet | null;
  /** The id for the place / stay / ticket sheets. */
  sheetId: string | null;
  open(sheet: ChatSheet, id?: string): void;
  /** Swaps the open sheet for another (board → budget / route, private → ticket). */
  swap(sheet: ChatSheet, id?: string): void;
  close(): void;
  /** Board row / reminder / Vote: close or swap, fast-forward, then scroll to the row's card. */
  boardAction(target: BoardTarget): void;
}

type Open = { sheet: ChatSheet; id: string | null };

export function useChatSheets(tripId: TripId, opts: { onScrollToCard(card: CardKind): void }): ChatSheets {
  const params = useSearchParams();
  const stageIndex = useStore((s) => s.chat[tripId].stageIndex);
  const quickStart = useStore((s) => s.chat[tripId].quickStart);
  const bookingOpen = useStore((s) => s.chat[tripId].stayBooking.status === "open");
  const stageId = stageAt(tripId, stageIndex).id;

  const [current, setCurrent] = useState<Open | null>(null);

  const guard: Guard = { tripId, stageIndex, stageId, bookingOpen };
  const allowed = current !== null && sheetAllowed(current.sheet, current.id, guard);
  // A sheet that can't open here (unknown id, wrong stage) is forgotten, so it can't pop open later.
  if (current !== null && !allowed) setCurrent(null);

  // DESIGN-ASSUMPTION (H-board.md §1.1): an open sheet suppresses the QuickStart auto-open
  // (C-chat-kickoff.md §1.1 says pending wins; only one content sheet can be open at a time).
  const autoQuickStart = current === null && stageId === "kickoff" && quickStart === "pending";
  const sheet: ChatSheet | null = allowed ? current.sheet : autoQuickStart ? "quickstart" : null;

  // Opening `budget|stay|route` fast-forwards first (forward-only, no timers).
  const ensure = allowed ? ENSURE[current.sheet] : undefined;
  useEffect(() => {
    if (ensure) useStore.getState().ensureStage(tripId, ensure);
  }, [ensure, tripId]);

  // `?stage=<id>` demo jump (PLAN §8): fast-forward once, then drop the param.
  const jump = params.get("stage");
  useEffect(() => {
    if (jump === null) return;
    const target = jump as StageId;
    if (hasStage(tripId, target)) useStore.getState().ensureStage(tripId, target);
    dropQueryParams("stage");
  }, [jump, tripId]);

  function swap(next: ChatSheet, id?: string) {
    setCurrent({ sheet: next, id: id ?? null });
  }

  function open(next: ChatSheet, id?: string) {
    swap(next, id);
    // Opening a sheet closes the composer's reply / ask-Go tray.
    if (params.has("mode") || params.has("msg")) {
      writeChatQuery((p) => {
        p.delete("mode");
        p.delete("msg");
      });
    }
  }

  function close() {
    setCurrent(null);
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
    sheetId: allowed ? current.id : null,
    open,
    swap,
    close,
    boardAction,
  };
}
