import { CheckBadge } from "@/components/common/CheckBadge";
import { ListRow } from "@/components/common/ListRow";
import type { PastTrip } from "@/data/types";
import { cn } from "@/lib/utils";

/** Static past-trip row; place inside `ListCard padding="tight"`. */
export function PastTripRow({ trip }: { trip: PastTrip }) {
  return (
    <ListRow
      dense
      leading={
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", trip.tintClass)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG illustration */}
          <img src={trip.img} alt="" className="size-9" />
        </span>
      }
      title={trip.title}
      sub={trip.sub}
      trailing={<CheckBadge size={22} />}
    />
  );
}
