import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LONG_PRESS_MS, SCROLL_DELAY_MS } from "@/data/timing";
import { scrollBehavior } from "@/lib/motion";

/** Up to this far (px) from the end the reader is "at" the latest messages: anything new scrolls them down. */
const FOLLOW_PX = 150;
/** Within this of the end, the reader has seen the newest message. */
const REACHED_PX = 48;
/** No scroll event for this long: the scroll has stopped. */
const SETTLE_MS = 140;
/** A scroll we asked for has this long to send its first scroll event. */
const START_MS = 300;
/** Scrolls made for one move of the end: an animated one, then instant ones. After those the page is as far down as the browser takes it. */
const MAX_TRIES = 3;
/** For this long after it opens the room gets to its end without animation: the page is still settling under it. */
const OPENING_MS = 1000;
/** A viewport that gets shorter this soon after the reader scrolled up is their doing (the browser's bars sliding back in). */
const BARS_MS = 500;

interface Place {
  /** The page's laid-out height, not `scrollHeight`: the page slide-up is a transform, and the room it adds below the page while it runs is not the thread's end. */
  height: number;
  /** The viewport's height. An iOS browser's bars sliding in and out change it. */
  view: number;
  y: number;
}

const place = (): Place => ({ height: document.documentElement.offsetHeight, view: window.innerHeight, y: window.scrollY });
const toEnd = (p: Place) => p.height - p.y - p.view;
const distanceToEnd = () => toEnd(place());

// The scroll position is worked out here and not left to `scrollIntoView({ block: "end" })` on the thread's end: iOS
// Safari stops that some 60px short of the end (it counts the status bar the page is drawn under), and every further
// call moves the page 20-50px up or down from there.
function scrollToEnd(animated: boolean) {
  const { height, view } = place();
  // A page in the background runs no animation: a smooth scroll started there never moves.
  window.scrollTo({ top: Math.max(0, height - view), behavior: animated && document.visibilityState === "visible" ? scrollBehavior() : "auto" });
}

interface FollowEvents {
  /** The reader went up the thread (`true`), or was brought back to its end by a send or the button. */
  left(left: boolean): void;
  /** The reader is at the end: they have seen the newest message. */
  reached(): void;
}

/**
 * The scrolling itself, outside React. Every scroll, resize and change of the page's height is compared with the
 * `Place` seen before it, which says who moved: the reader (the scroll position went up) or the end (it is further
 * away and the reader did not go up). The order the browser reports them in does not matter, and it is not the same
 * on iOS, where a scroll event can arrive after the page has already grown.
 */
function createFollow(on: FollowEvents) {
  // True while the reader is at the end or within `FOLLOW_PX` of it. Only a scroll up takes them off it.
  let following = true;
  // The end is not where a reader who is following has it yet. The room opens owing its end.
  let owed = true;
  let tries = 0;
  let last = place();
  let lastUpAt = -Infinity;
  const openedAt = performance.now();
  let pinTimer: number | null = null;
  let holdTimer: number | null = null;
  let settleTimer: number | undefined;

  // Nothing is owed any more: the reader is at the end, went up the thread, or the browser takes the page no further.
  const clear = () => {
    owed = false;
    tries = 0;
  };

  const pin = () => {
    pinTimer = null;
    if (!following || !owed || holdTimer !== null) return;
    if (distanceToEnd() <= 1 || tries >= MAX_TRIES) return clear();
    tries += 1;
    scrollToEnd(tries === 1 && performance.now() - openedAt > OPENING_MS);
    // A scroll that never starts sends no event to wait on.
    settleSoon(START_MS);
  };
  const pinSoon = () => {
    pinTimer ??= window.setTimeout(pin, SCROLL_DELAY_MS);
  };
  /** The end moved away from a reader who is following: take them there. */
  const owe = () => {
    owed = true;
    tries = 0;
    pinSoon();
  };

  // A smooth scroll aims at where the end was when it started, a touch stops it, and one that iOS drops never moves:
  // finish what is left.
  const settle = () => {
    if (owed) pinSoon();
  };
  function settleSoon(ms = SETTLE_MS) {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, ms);
  }

  const sync = () => {
    const was = last;
    const now = (last = place());
    const distance = toEnd(now);
    const up = now.y < was.y - 0.5;
    if (up) lastUpAt = performance.now();

    if (distance <= FOLLOW_PX) following = true;
    else if (up) {
      following = false;
      clear();
      on.left(true);
    }

    if (distance <= 1) clear();
    else if (following && distance > toEnd(was) + 0.5 && !up) {
      // The end is further away and the reader did not go up: the page grew (a row, Go's typing row, a card that grew
      // in place, the tray), or the viewport got shorter (the browser's bars coming back after a page change, a
      // rotated phone). Bars that come back because the reader is scrolling up are left alone.
      const bars = now.view < was.view && now.height === was.height && performance.now() - lastUpAt < BARS_MS;
      if (!bars) owe();
    }
    if (distance <= REACHED_PX) on.reached();
  };

  const onScroll = () => {
    sync();
    settleSoon();
  };
  // Back from the background, where a smooth scroll that was under way stopped.
  const onVisible = () => {
    if (document.visibilityState === "visible" && owed) pinSoon();
  };

  // Next scrolls a new page to its top after the layout effect that opened the room at its end.
  scrollToEnd(false);
  last = place();
  pinSoon();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", sync, { passive: true });
  // iOS reports its bars here first, and not always as a window resize.
  window.visualViewport?.addEventListener("resize", sync, { passive: true });
  document.addEventListener("visibilitychange", onVisible);
  // The body is as tall as the page: every row, and the bottom padding the composer's tray resizes.
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
  observer?.observe(document.body);

  const release = () => {
    if (holdTimer === null) return;
    window.clearTimeout(holdTimer);
    holdTimer = null;
    if (owed) pinSoon();
  };

  return {
    /** The newest row changed. `sent`: it is a send of mine, which always brings me to the end. */
    rows(sent: boolean) {
      if (sent) {
        following = true;
        on.left(false);
      }
      if (!following) return;
      // A new message takes a reader who is following to the end, wherever in the follow range they had stopped.
      owe();
      // A room shorter than the screen never scrolls, so no scroll event would say its newest message was seen.
      if (distanceToEnd() <= REACHED_PX) on.reached();
    },
    hold() {
      if (holdTimer !== null) window.clearTimeout(holdTimer);
      // The press has fired or ended by then. A release that never comes (the pointer went up somewhere else, the row
      // lost its handlers) must not hold the thread for good.
      holdTimer = window.setTimeout(release, LONG_PRESS_MS + 100);
    },
    release,
    jumpToEnd() {
      following = true;
      owed = true;
      tries = 1;
      on.left(false);
      scrollToEnd(true);
      settleSoon(START_MS);
    },
    stop() {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      document.removeEventListener("visibilitychange", onVisible);
      observer?.disconnect();
      window.clearTimeout(settleTimer);
      if (pinTimer !== null) window.clearTimeout(pinTimer);
      if (holdTimer !== null) window.clearTimeout(holdTimer);
    },
  };
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
 * that loaded, the reply tray opening, the browser's bars taking room back from the viewport. A reader further up is
 * left where they are, and the messages they have not seen are counted for a "N new messages" button. The count goes
 * when they reach the end again, by hand or through `jumpToEnd`.
 *
 * A scroll that stops short of the end (the end moved on, a touch stopped it, iOS dropped it) is made again once the
 * page is still, without animation.
 *
 * `hold` / `release` are for the long-press (the 3A contract: `useLongPress` cancels on any scroll): nothing scrolls
 * while a press is armed, and the thread catches up when it ends.
 */
export function useThreadFollow(rows: readonly ThreadRow[]) {
  const follow = useRef<ReturnType<typeof createFollow> | null>(null);

  // The reader went up the thread and has not been back to its end.
  const [left, setLeft] = useState(false);
  const newestStored = newestStoredKey(rows);
  // The newest message that was in the room the last time the reader was at its end.
  const [seen, setSeen] = useState(newestStored);
  const newestRef = useRef(newestStored);

  // Before the first paint, so a room that replaces its skeleton in place is never seen from its top.
  useLayoutEffect(() => scrollToEnd(false), []);

  useEffect(() => {
    const started = createFollow({
      left: setLeft,
      reached: () => {
        setSeen(newestRef.current);
        setLeft(false);
      },
    });
    follow.current = started;
    return () => {
      started.stop();
      follow.current = null;
    };
  }, []);

  const newest = rows[rows.length - 1];
  const newestKey = newest?.key;
  const newestMine = newest?.mine ?? false;
  const lastNewestKey = useRef(newestKey);
  useEffect(() => {
    newestRef.current = newestStored;
    const sent = newestMine && lastNewestKey.current !== newestKey;
    lastNewestKey.current = newestKey;
    follow.current?.rows(sent);
  }, [newestKey, newestMine, newestStored]);

  const hold = useCallback(() => follow.current?.hold(), []);
  const release = useCallback(() => follow.current?.release(), []);
  const jumpToEnd = useCallback(() => follow.current?.jumpToEnd(), []);

  // Counted from the stored message they last saw: a send of mine still on its way sits under the ones that came in.
  const from = seen === undefined ? -1 : rows.findIndex((r) => r.key === seen);
  const unread = left && (seen === undefined || from >= 0) ? rows.slice(from + 1).filter((r) => !r.mine).length : 0;

  return { unread, jumpToEnd, hold, release };
}
