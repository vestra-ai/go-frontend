import { Eyebrow } from "@/components/common/Eyebrow";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LegSummaryCardProps = {
  legs: { eyebrow: string; value: string; meta: string }[];
};

/** Route ONWARD/RETURN and cab PICKUP/DROP summary rows, dashed between. Not interactive. */
export function LegSummaryCard({ legs }: LegSummaryCardProps) {
  return (
    <Card variant="outline" radius="lg" className="overflow-hidden">
      {legs.map((leg, i) => (
        <div
          key={leg.eyebrow}
          className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-dashed border-line-2")}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <Eyebrow>{leg.eyebrow}</Eyebrow>
            <span className="text-16 leading-[1.3] font-semibold tracking-body">{leg.value}</span>
          </div>
          <span className="text-13 font-semibold tracking-caption text-muted">{leg.meta}</span>
        </div>
      ))}
    </Card>
  );
}
