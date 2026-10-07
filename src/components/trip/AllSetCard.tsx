import { Check } from "@/components/icons/generated";
import { Card } from "@/components/ui/card";
import { tripHome as copy } from "@/data/seed/copy";
import { cn } from "@/lib/utils";

type AllSetCardProps = Omit<React.ComponentProps<typeof Card>, "children">;

/** "You’re all set" card that replaces Pending when nothing is left (J6/J7, J-triphome-calls.md §1.2 B). */
export function AllSetCard({ className, ...props }: AllSetCardProps) {
  return (
    <Card
      data-slot="all-set-card"
      // DESIGN-ASSUMPTION: 26px radius has no token (J-triphome-calls.md §1.7 #9).
      className={cn("flex items-center gap-3.5 rounded-[26px] px-[18px] py-[22px]", className)}
      {...props}
    >
      <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-success-soft text-success">
        <Check className="size-7" strokeWidth={3} />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-22 font-semibold tracking-h2">{copy.allSet.title}</span>
        <span className="text-14 leading-[1.4] text-muted">{copy.allSet.sub}</span>
      </div>
    </Card>
  );
}
