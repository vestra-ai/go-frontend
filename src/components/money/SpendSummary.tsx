import Link from "next/link";
import { Pencil } from "@/components/icons/generated";
import { SplitBar } from "@/components/common/SplitBar";
import { CategoryTile } from "@/components/trip/CategoryTile";
import { Button } from "@/components/ui/button";
import { MONEY_COPY } from "@/data/seed/money";
import type { TripId } from "@/data/types";
import { inr } from "@/lib/format";
import type { MoneyView } from "@/store";

type SpendSummaryProps = {
  tripId: TripId;
  view: MoneyView;
};

/** Expenses total, split bar, Stay / Travel tiles and (Just me) the budget footnote. */
export function SpendSummary({ tripId, view }: SpendSummaryProps) {
  const { bar } = view;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3 pl-1 pt-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-44 font-bold leading-[1.05] tracking-display tabular-nums">{inr(view.total)}</span>
          <span className="text-15 text-muted">{view.caption}</span>
        </div>
        {view.showEditBudget && (
          <Button variant="white" size="sm" asChild className="h-10 shrink-0 gap-1.5 pl-3 pr-3.5 shadow-card">
            <Link href={`/trips/${tripId}/chat?sheet=budget`}>
              <Pencil className="size-[15px]" />
              {MONEY_COPY.editBudget}
            </Link>
          </Button>
        )}
      </div>
      <SplitBar
        label={bar.aria}
        track={bar.track}
        segments={[
          { pct: bar.stayPct, color: "bg-stay" },
          { pct: bar.travelPct ?? 100 - bar.stayPct, color: "bg-travel" },
        ]}
      />
      <div className="grid grid-cols-2 gap-2.5">
        <CategoryTile tone="stay" emoji="🏡" label={MONEY_COPY.stay} amount={inr(view.tiles.stay)} />
        <CategoryTile tone="travel" emoji="🧳" label={MONEY_COPY.travel} amount={inr(view.tiles.travel)} />
      </div>
      {view.footnote && <p className="px-1 text-13 tracking-caption text-muted">{view.footnote}</p>}
    </div>
  );
}
