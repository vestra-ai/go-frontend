import { BOOKINGS_COPY } from "@/data/seed/bookings";

/** Floating "1 / 2" pill over the PDF viewer, above the bottom bar. */
export function PageCounterPill({ current, total }: { current: number; total: number }) {
  return (
    <div
      aria-label={BOOKINGS_COPY.viewer.pageLabel(current, total)}
      className="pointer-events-none absolute bottom-[100px] left-1/2 flex h-[30px] -translate-x-1/2 items-center rounded-full bg-ink/78 px-3 text-13 font-semibold tabular-nums text-white"
    >
      {BOOKINGS_COPY.viewer.page(current, total)}
    </div>
  );
}
