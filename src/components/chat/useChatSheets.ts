"use client";

import { useSearchParams } from "next/navigation";
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
  | "recording";

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
 */
export function useChatSheets(autoQuickStart: boolean): ChatSheets {
  const params = useSearchParams();
  const [current, setCurrent] = useState<ChatSheet | null>(null);
  const sheet: ChatSheet | null = current ?? (autoQuickStart ? "quickstart" : null);

  function open(next: ChatSheet) {
    setCurrent(next);
    // Opening a sheet closes the composer's reply / ask-Go tray.
    if (params.has("mode") || params.has("msg")) {
      writeChatQuery((p) => {
        p.delete("mode");
        p.delete("msg");
      });
    }
  }

  return { sheet, open, swap: setCurrent, close: () => setCurrent(null) };
}
