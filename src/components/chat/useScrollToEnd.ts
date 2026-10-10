import { useCallback, useEffect, useRef, useState } from "react";
import { SCROLL_DELAY_MS } from "@/data/timing";
import { scrollBehavior } from "@/lib/motion";

/** Within this many px of the page's end counts as reading the latest messages. */
const AT_END_PX = 64;

/** Up to this far (px) from the end the reader is "at" the latest messages: a new one scrolls them down. */
const FOLLOW_PX = 150;
/** Back within this of the end, the "new messages" button has done its job. */
const REACHED_PX = 48;

const distanceToEnd = () => document.documentElement.scrollHeight - window.scrollY - window.innerHeight;

function scrollToEnd(anchor: HTMLElement | null) {
  try {
    anchor?.scrollIntoView({ behavior: scrollBehavior(), block: "end" });
  } catch {
    // Older engines reject the options object; staying put is fine.
  }
}

/**
 * Keeps the message list pinned to its end sentinel (C-chat-kickoff.md §1.2).
 * First run jumps to the end with no animation; every later change of `deps`
 * (the newest message's key) smooth-scrolls after `SCROLL_DELAY_MS`, unless `follow` says the reader is somewhere else.
 */
export function useScrollToEnd(anchorRef: React.RefObject<HTMLElement | null>, deps: readonly unknown[], follow?: () => boolean): void {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      anchorRef.current?.scrollIntoView({ block: "end" });
      return;
    }
    if (follow && !follow()) return;
    const t = window.setTimeout(() => scrollToEnd(anchorRef.current), SCROLL_DELAY_MS);
    return () => window.clearTimeout(t);
    // The caller owns the dependency list (spec signature).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * For a change that only moves the bottom edge (the reply / ask-Go tray resizing the list's bottom padding): follows
 * it to the end only if the page was already there, so the last message stays above the tray. Anywhere else in the
 * thread the scroll position is left alone.
 */
export function useStayAtEnd(anchorRef: React.RefObject<HTMLElement | null>, key: unknown): void {
  // Tracked from scroll events, so it still holds the position from before `key` changed the page height.
  const atEnd = useRef(true);
  useEffect(() => {
    const update = () => {
      atEnd.current = document.documentElement.scrollHeight - window.scrollY - window.innerHeight <= AT_END_PX;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!atEnd.current) return;
    const t = window.setTimeout(() => scrollToEnd(anchorRef.current), SCROLL_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [anchorRef, key]);
}

interface ThreadRow {
  /** Stable from sending to stored. */
  key: string;
  mine: boolean;
}

/**
 * Who a new message may move: a reader at the end of the thread (or a send of their own) is scrolled down to it; a
 * reader further up is left where they are, and the messages they have not seen are counted for a "N new messages"
 * button. The count goes when they reach the end again, by hand or through `jumpToEnd`.
 *
 * `follow` is for `useScrollToEnd`. It holds where the reader was before the message moved the page's end.
 */
export function useThreadFollow(anchorRef: React.RefObject<HTMLElement | null>, rows: readonly ThreadRow[]) {
  // True while the reader is at the end or on their way there.
  const following = useRef(true);
  const lastY = useRef(0);
  // The newest row the reader had seen when the first message they did not see came in.
  const [missedFrom, setMissedFrom] = useState<string | null>(null);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const distance = distanceToEnd();
      // Our own scrolls only go down (and the page growing sends no scroll): only a move up takes the reader off the end.
      if (distance <= FOLLOW_PX) following.current = true;
      else if (y < lastY.current) following.current = false;
      lastY.current = y;
      if (distance <= REACHED_PX) setMissedFrom(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const newest = rows[rows.length - 1];
  const newestKey = newest?.key;
  const newestMine = newest?.mine ?? false;
  const seenNewest = useRef(newestKey);
  useEffect(() => {
    const before = seenNewest.current;
    seenNewest.current = newestKey;
    if (before === undefined || before === newestKey) return;
    if (newestMine) following.current = true; // a send of mine always brings me to the end
    if (following.current) setMissedFrom(null);
    else setMissedFrom((from) => from ?? before);
  }, [newestKey, newestMine]);

  const from = missedFrom === null ? -1 : rows.findIndex((r) => r.key === missedFrom);
  const unread = from < 0 ? 0 : rows.slice(from + 1).filter((r) => !r.mine).length;

  const follow = () => following.current || newestMine;
  const jumpToEnd = useCallback(() => {
    following.current = true;
    setMissedFrom(null);
    scrollToEnd(anchorRef.current);
  }, [anchorRef]);

  return { unread, follow, jumpToEnd };
}
