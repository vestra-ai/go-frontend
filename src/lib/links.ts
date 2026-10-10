// Links a card action or the Server hands back (CONTRACT-APP §4.7): `https://` opens in the browser (Go's vault page,
// the listen-in page), `go://` names one of the app's own screens. Nothing else is ever followed.

export type GoRoute =
  | { kind: "sheet"; tripId: string; sheet: "budget" | "route" | "cab" }
  | { kind: "booking"; tripId: string; bookingId: string }
  | { kind: "checkin"; tripId: string; bookingId: string }
  | { kind: "tab"; tripId: string; tab: "itinerary" | "bookings" | "expenses" };

/** `go://trips/<trip>/sheet/budget` → the screen it names; null for anything this build does not know. */
export function parseGoRoute(url: string): GoRoute | null {
  const m = /^go:\/\/trips\/([^/?#]+)\/(.+?)\/?(?:[?#].*)?$/.exec(url);
  if (!m) return null;
  const tripId = decodeURIComponent(m[1]);
  const [head, tail] = m[2].split("/");
  if (head === "sheet" && (tail === "budget" || tail === "route" || tail === "cab")) return { kind: "sheet", tripId, sheet: tail };
  if (head === "bookings" && tail) return { kind: "booking", tripId, bookingId: decodeURIComponent(tail) };
  if (head === "checkin" && tail) return { kind: "checkin", tripId, bookingId: decodeURIComponent(tail) };
  if ((head === "itinerary" || head === "bookings" || head === "expenses") && !tail) return { kind: "tab", tripId, tab: head };
  return null;
}

export const isHttpUrl = (url: string): boolean => /^https?:\/\//i.test(url);

/**
 * A tab opened inside the tap, before the answer is known: browsers only allow a new tab from the tap itself, and the
 * link arrives a moment later. Point it with `openIn`, or close it when there turned out to be nothing to open.
 */
export function preopenTab(): Window | null {
  try {
    return window.open("about:blank", "_blank");
  } catch {
    return null;
  }
}

/** Opens an `https://` page at once (links expire in minutes: never ahead of time, never in a WebView). */
export function openIn(tab: Window | null, url: string): void {
  if (!isHttpUrl(url)) {
    tab?.close();
    return;
  }
  if (tab && !tab.closed) {
    tab.opener = null;
    tab.location.replace(url);
    return;
  }
  // The pre-opened tab was blocked: leave from this one instead (the person comes back with Back).
  window.location.assign(url);
}
