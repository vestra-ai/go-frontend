import { Pencil } from "@/components/icons/generated";
import { SplitBar } from "@/components/common/SplitBar";
import { CategoryTile } from "@/components/trip/CategoryTile";
import { Button } from "@/components/ui/button";
import { MONEY_COPY } from "@/data/seed/money";
import { inr } from "@/lib/format";
import type { MoneyViewModel } from "@/state/moneyView";

type SpendSummaryProps = {
  view: MoneyViewModel;
  /** "Edit budget" (Just me): opens the group budget sheet over this page. */
  onEditBudget: () => void;
};

const SEGMENT_COLOR = { stay: "bg-stay", travel: "bg-travel", other: "bg-line-2" } as const;

/** Expenses total, split bar, Stay / Travel tiles (plus Other when there is any) and (Just me) the budget footnote. */
export function SpendSummary({ view, onEditBudget }: SpendSummaryProps) {
  const { bar } = view;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3 pl-1 pt-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-44 font-bold leading-[1.05] tracking-display tabular-nums">{inr(view.total)}</span>
          <span className="text-15 text-muted">{view.caption}</span>
        </div>
        {view.showEditBudget && (
          <Button variant="white" size="sm" className="h-10 shrink-0 gap-1.5 pl-3 pr-3.5 shadow-card" onClick={onEditBudget}>
            <Pencil className="size-[15px]" />
            {MONEY_COPY.editBudget}
          </Button>
        )}
      </div>
      <SplitBar label={bar.aria} track={bar.track} segments={bar.segments.map((s) => ({ pct: s.pct, color: SEGMENT_COLOR[s.key] }))} />
      <div className="grid grid-cols-2 gap-2.5">
        <CategoryTile tone="stay" emoji="🏡" label={MONEY_COPY.stay} amount={inr(view.tiles.stay)} />
        <CategoryTile tone="travel" emoji="🧳" label={MONEY_COPY.travel} amount={inr(view.tiles.travel)} />
        {view.tiles.other > 0 && (
          <CategoryTile tone="other" emoji="🧾" label={MONEY_COPY.other} amount={inr(view.tiles.other)} className="col-span-2" />
        )}
      </div>
      {view.footnote && <p className="px-1 text-13 tracking-caption text-muted">{view.footnote}</p>}
    </div>
  );
}
