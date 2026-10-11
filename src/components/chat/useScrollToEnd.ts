import { useCallback, useEffect, useRef, useState } from "react";
import { LONG_PRESS_MS, SCROLL_DELAY_MS } from "@/data/timing";
import { scrollBehavior } from "@/lib/motion";

/** Up to this far (px) from the end the reader is "at" the latest messages: anything new scrolls them down. */
const FOLLOW_PX = 150;
/** Within this of the end, the reader has seen the newest message. */
const REACHED_PX = 48;
/** No scroll event for this long: the scroll has stopped. */
const SETTLE_MS = 140;

// The page's laid-out height, not `scrollHeight`: the page slide-up is a transform, and the room it adds below the
// page while it runs is not the thread's end.
const distanceToEnd = () => document.documentElement.offsetHeight - window.scrollY - window.innerHeight;

function scrollToEnd(anchor: HTMLElement | null) {
  try {
    // A page in the background runs no animation: a smooth scroll started there never moves.
    anchor?.scrollIntoView({ behavior: document.visibilityState === "visible" ? scrollBehavior() : "auto", block: "end" });
  } catch {
    // Older engines reject the options object; staying put is fine.
  }
}

interface ThreadRow {
  /** Stable from sending to stored. */
  key: string;
  mine: boolean;
  /** Set on a send of mine the Server has not stored yet: it sits under every stored message. */
  sending?: unknown;
}

function newestStoredKey(rows: readonly ThreadRow[]): string | undefined {
  for (let i = rows.length - 1; i >= 0; i--) if (!rows[i].sending) return rows[i].key;
  return undefined;
}

/**
 * Keeps the reader of the thread with its latest messages (C-chat-kickoff.md §1.2). The room opens at its end, with no
 * animation. From then on a reader at the end (or sending a message of their own) is taken to the new end, after
 * `SCROLL_DELAY_MS`, whenever it moves away from them: a new row, Go's typing row, a card that grew in place, a photo
 * that loaded, the reply tray opening. A reader further up is left where they are, and the messages they have not seen
 * are counted for a "N new messages" button. The count goes when they reach the end again, by hand or through `jumpToEnd`.
 *
 * It watches the page's height, not only the newest row: a scroll aimed at where the end was when a message arrived
 * stops short of an end that moved afterwards.
 *
 * `hold` / `release` are for the long-press (the 3A contract: `useLongPress` cancels on any scroll): nothing scrolls
 * while a press is armed, and the thread catches up when it ends.
 */
export function useThreadFollow(anchorRef: React.RefObject<HTMLElement | null>, rows: readonly ThreadRow[]) {
  // True while the reader is at the end or on their way there. Our own scrolls only go down, and the page growing sends
  // no scroll event: only a move up takes the reader off the end.
  const following = useRef(true);
  // How far from the end the reader last stopped. Further than this, and the end has moved away from them.
  const rest = useRef(0);
  // The end moved away from a reader who is following, and they are not there yet.
  const owed = useRef(false);
  const pinTimer = useRef<number | null>(null);
  const holdTimer = useRef<number | null>(null);

  // The reader went up the thread and has not been back to its end.
  const [left, setLeft] = useState(false);
  const newestStored = newestStoredKey(rows);
  // The newest message that was in the room the last time the reader was at its end.
  const [seen, setSeen] = useState(newestStored);
  const newestRef = useRef(newestStored);

  const reached = useCallback(() => {
    setSeen(newestRef.current);
    setLeft(false);
  }, []);

  const pin = useCallback(() => {
    pinTimer.current = null;
    if (!following.current || !owed.current || holdTimer.current !== null) return;
    if (distanceToEnd() <= 1) owed.current = false;
    else scrollToEnd(anchorRef.current);
  }, [anchorRef]);
  const schedulePin = useCallback(() => {
    pinTimer.current ??= window.setTimeout(pin, SCROLL_DELAY_MS);
  }, [pin]);

  /** The page's height changed: a reader who is following goes with an end that moved away from them. */
  const endMoved = useCallback(() => {
    const distance = distanceToEnd();
    if (distance < rest.current) rest.current = distance;
    else if (following.current && distance > rest.current + 1) {
      owed.current = true;
      schedulePin();
    }
  }, [schedulePin]);

  useEffect(() => {
    const anchor = anchorRef.current;
    anchor?.scrollIntoView({ block: "end" });

    let lastY = window.scrollY;
    let settleTimer: number | undefined;
    // A smooth scroll aims at where the end was when it started, and a touch stops it: finish what is left.
    const onSettle = () => {
      if (!owed.current) return;
      if (distanceToEnd() <= 1) owed.current = false;
      else schedulePin();
    };
    const onScroll = () => {
      const y = window.scrollY;
      const distance = distanceToEnd();
      const up = y < lastY;
      lastY = y;
      if (distance <= FOLLOW_PX) following.current = true;
      else if (up) {
        following.current = false;
        setLeft(true);
      }
      if (up || distance <= 1) owed.current = false;
      if (!owed.current) rest.current = distance;
      if (distance <= REACHED_PX) reached();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(onSettle, SETTLE_MS);
    };
    // A taller viewport (the browser's bar sliding away) brings the end closer with no scroll.
    const onResize = () => {
      rest.current = Math.min(rest.current, distanceToEnd());
    };
    // Back from the background, where a smooth scroll that was under way stopped.
    const onVisible = () => {
      if (document.visibilityState === "visible" && owed.current) schedulePin();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisible);

    // The body is as tall as the page: every row, and the bottom padding the composer's tray resizes.
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(endMoved) : null;
    observer?.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisible);
      observer?.disconnect();
      window.clearTimeout(settleTimer);
      if (pinTimer.current !== null) window.clearTimeout(pinTimer.current);
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
      pinTimer.current = null;
      holdTimer.current = null;
    };
  }, [anchorRef, endMoved, reached, schedulePin]);

  const newest = rows[rows.length - 1];
  const newestKey = newest?.key;
  const newestMine = newest?.mine ?? false;
  const lastNewestKey = useRef(newestKey);
  const first = useRef(true);
  useEffect(() => {
    newestRef.current = newestStored;
    const sent = newestMine && lastNewestKey.current !== newestKey;
    lastNewestKey.current = newestKey;
    if (sent) {
      // A send of mine always brings me to the end.
      following.current = true;
      setLeft(false);
    }
    // A new message takes a reader who is following to the end, wherever in the follow range they had stopped.
    if (following.current && !first.current) {
      owed.current = true;
      schedulePin();
    }
    first.current = false;
    // A room shorter than the screen never scrolls, so no scroll event would say its newest message was seen.
    if (following.current && distanceToEnd() <= REACHED_PX) reached();
  }, [newestKey, newestMine, newestStored, reached, schedulePin]);

  const release = useCallback(() => {
    if (holdTimer.current === null) return;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (owed.current) schedulePin();
  }, [schedulePin]);
  const hold = useCallback(() => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    // The press has fired or ended by then. A release that never comes (the pointer went up somewhere else, the row
    // lost its handlers) must not hold the thread for good.
    holdTimer.current = window.setTimeout(release, LONG_PRESS_MS + 100);
  }, [release]);

  const jumpToEnd = useCallback(() => {
    following.current = true;
    owed.current = true;
    setLeft(false);
    scrollToEnd(anchorRef.current);
  }, [anchorRef]);

  // Counted from the stored message they last saw: a send of mine still on its way sits under the ones that came in.
  const from = seen === undefined ? -1 : rows.findIndex((r) => r.key === seen);
  const unread = left && (seen === undefined || from >= 0) ? rows.slice(from + 1).filter((r) => !r.mine).length : 0;

  return { unread, jumpToEnd, hold, release };
}
