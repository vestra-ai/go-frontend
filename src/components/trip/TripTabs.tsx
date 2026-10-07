import Link from "next/link";
import type { TripId } from "@/data/types";
import { segmentedItemVariants, segmentedListVariants } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

export type TripTab = "home" | "itinerary" | "bookings" | "expenses";

const tabs: { id: TripTab; label: string; path: string }[] = [
  { id: "home", label: "Home", path: "" },
  { id: "itinerary", label: "Itinerary", path: "/itinerary" },
  { id: "bookings", label: "Bookings", path: "/bookings" },
  { id: "expenses", label: "Expenses", path: "/expenses" },
];

type TripTabsProps = {
  tripId: TripId;
  active: TripTab;
  variant: "hero" | "compact";
  className?: string;
};

export function TripTabs({ tripId, active, variant, className }: TripTabsProps) {
  return (
    <div role="tablist" aria-label="Trip sections" className={cn(segmentedListVariants({ variant }), className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`/trips/${tripId}${tab.path}`}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            className={cn(segmentedItemVariants({ variant, active: isActive }), "active:scale-[0.97]")}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
