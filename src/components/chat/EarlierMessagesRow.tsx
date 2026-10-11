import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "@/components/icons/generated";
import { Spinner } from "@/components/icons/custom/Spinner";
import { Button } from "@/components/ui/button";

type EarlierMessagesRowProps = {
  /** "Show earlier messages" */
  label: string;
  /** The page above is on its way: the arrow becomes a spinner. The button stays live (a repeat tap is the caller's no-op). */
  loading: boolean;
  onPress(): void;
  /** The oldest message on screen: a new page changes it, which is what lets the row fetch the next one on its own. */
  pageKey: string;
};

/** How far above the viewport the row still counts as reached, so the page starts loading just before the top. */
const REACH_MARGIN = "240px";

/** Top of the thread: a Go-coloured "↑ Show earlier messages" link centred between two hairlines. */
export function EarlierMessagesRow({ label, loading, onPress, pageKey }: EarlierMessagesRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  // The thread opens at its end, so the row is on screen for a moment before that scroll lands: only a reader who has scrolled triggers it.
  const scrolled = useRef(false);
  const fetchedFor = useRef<string | null>(null);
  const press = useRef(onPress);
  press.current = onPress;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      scrolled.current = true;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: `${REACH_MARGIN} 0px 0px 0px` });
    observer.observe(el);
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  // Once per page: a failed fetch is not retried in a loop, the button (or scrolling away and back) tries again.
  useEffect(() => {
    if (!near) {
      fetchedFor.current = null;
      return;
    }
    if (loading || !scrolled.current || fetchedFor.current === pageKey) return;
    fetchedFor.current = pageKey;
    press.current();
  }, [near, loading, pageKey]);

  return (
    <div ref={ref} className="flex items-center gap-3">
      <span aria-hidden className="h-px flex-1 bg-line" />
      <Button type="button" variant="link" size="sm" className="gap-1.5 px-2" aria-busy={loading} onClick={onPress}>
        {/* One 16px slot for both, so swapping the arrow for the spinner does not shift the label. */}
        <span aria-hidden className="flex size-4 items-center justify-center">
          {loading ? (
            <Spinner aria-hidden role="presentation" className="size-3.5 border-go/25 border-t-go border-r-go" />
          ) : (
            <ChevronDown className="size-4 rotate-180" strokeWidth={2.4} />
          )}
        </span>
        {label}
      </Button>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}
