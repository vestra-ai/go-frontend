"use client";

import { Spinner } from "@/components/icons/custom/Spinner";
import { PRIVATE_COPY } from "@/data/seed/bookings";
import { useRecent } from "@/lib/useRecent";

/** How long after Go books a booking's file can still be on its way. It usually lands within two seconds. */
const FILE_MS = 60_000;

/**
 * Where a booking's "Open ticket PDF" button will be: Go's booking is answered at once, its file follows a moment
 * later (`trip_changed kinds:["booking"]`). Shows nothing once the booking is too old for a file to still be coming.
 * Key it by `since`.
 */
export function FileOnItsWay({ since }: { since: string }) {
  const recent = useRecent(since, FILE_MS);
  if (!recent) return null;
  return (
    <span role="status" className="flex h-[42px] items-center justify-center gap-2 text-15 text-muted">
      <Spinner aria-hidden role={undefined} aria-label={undefined} className="size-4 border-ink/15 border-t-ink border-r-ink" />
      {PRIVATE_COPY.onItsWay}
    </span>
  );
}
