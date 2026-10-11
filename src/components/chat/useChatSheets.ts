"use client";

import { useState } from "react";

// Sheet state for the chat route. Which content sheet is open lives in component state and opens only from a tap (or
// from Go's own `go://` link, which is the answer to a tap): no query param opens, names or closes a sheet.

export type ChatSheet =
  | "quickstart"
  | "from"
  | "place"
  | "budget"
  | "stay"
  | "route"
  | "cab"
  | "private"
  | "ticket"
  | "board"
  | "share"
  | "attachment"
  | "record"
  | "recording"
  | "live"
  | "page";

export interface ChatSheets {
  /** The open content sheet; QuickStart shows on its own while `autoQuickStart` holds and nothing else is open. */
  sheet: ChatSheet | null;
  open(sheet: ChatSheet): void;
  /** Swaps the open sheet for another (board → budget / route, private → ticket). */
  swap(sheet: ChatSheet): void;
  close(): void;
}

/**
 * @param autoQuickStart Quick start has not been answered or dismissed in this trip yet: it opens on its own, unless
 * another sheet is open (only one content sheet can be open at a time).
 * @param onOpen Called when a sheet is opened by a tap: the composer's reply / ask-Go tray closes then.
 */
export function useChatSheets(autoQuickStart: boolean, onOpen: () => void): ChatSheets {
  const [current, setCurrent] = useState<ChatSheet | null>(null);
  const sheet: ChatSheet | null = current ?? (autoQuickStart ? "quickstart" : null);

  function open(next: ChatSheet) {
    setCurrent(next);
    onOpen();
  }

  return { sheet, open, swap: setCurrent, close: () => setCurrent(null) };
}
