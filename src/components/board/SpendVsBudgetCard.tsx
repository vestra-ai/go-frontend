import { Eyebrow } from "@/components/common/Eyebrow";
import { SplitBar } from "@/components/common/SplitBar";
import { Card } from "@/components/ui/card";
import { board as copy } from "@/data/seed/copy";
import { inr } from "@/lib/format";
import type { BoardSpend } from "@/state/boardView";

const round1 = (x: number) => Math.round(x * 10) / 10;

export function SpendVsBudgetCard({ spend, eyebrow }: { spend: BoardSpend; /** Overrides "YOUR SPEND VS THE BUDGET" (the room's budget card is the whole trip's money). */ eyebrow?: string }) {
  const c = { ...copy.spend, eyebrow: eyebrow ?? copy.spend.eyebrow };

  if (spend.kind === "empty") {
    return (
      <Card variant="dashed" radius="2xl" className="flex flex-col gap-2.5 px-4 py-3.5">
        <Eyebrow tone="muted">{c.eyebrow}</Eyebrow>
        <div
          role="img"
          aria-label={c.emptyAria}
          className="h-3 rounded-full bg-[repeating-linear-gradient(135deg,var(--color-line)_0_6px,var(--color-surface-2)_6px_12px)]"
        />
        <p className="text-13 tracking-caption text-muted">{c.empty}</p>
      </Card>
    );
  }

  const { stay, travel, budget, left } = spend;
  const segments = [
    { pct: round1((stay / budget) * 100), color: "bg-info" },
    { pct: round1((travel / budget) * 100), color: "bg-travel" },
  ].filter((s) => s.pct > 0);

  return (
    <Card variant="float-sm" radius="2xl" className="flex flex-col gap-2.5 px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-2.5">
        <Eyebrow tone="muted">{c.eyebrow}</Eyebrow>
        <span className="text-16 font-semibold tracking-body tabular-nums">
          {inr(stay + travel)}
          <span className="font-medium text-muted">{c.of(inr(budget))}</span>
        </span>
      </div>
      <SplitBar track segments={segments} label={c.aria(inr(stay), inr(travel), inr(left))} />
      <div className="flex items-center gap-3.5 text-13 text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-info" />
          {c.stay}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-travel" />
          {c.travel}
        </span>
        <span className="ml-auto font-semibold text-success-ink tabular-nums">{c.left(inr(left))}</span>
      </div>
    </Card>
  );
}
