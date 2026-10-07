import { CheckBadge } from "@/components/common/CheckBadge";
import { Spinner } from "@/components/icons/custom/Spinner";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type GlassStatusPillProps = {
  variant: "progress" | "done";
  label: string;
  /** `progress` only: bar fill, 0-100. */
  value?: number;
  /** Position and animation delay are passed here. */
  className?: string;
};

/** Frosted floating status pill on the Welcome orbit: a progress card or a done chip. */
export function GlassStatusPill({ variant, label, value = 0, className }: GlassStatusPillProps) {
  if (variant === "done") {
    return (
      <Card
        variant="glass"
        className={cn(
          "flex h-[38px] animate-rise items-center gap-2 rounded-full pr-3.5 pl-2.5 text-13 font-semibold tracking-caption whitespace-nowrap [animation-duration:420ms]",
          className,
        )}
      >
        <CheckBadge size={18} />
        {label}
      </Card>
    );
  }
  return (
    <Card
      variant="glass"
      radius="3xl"
      className={cn("flex animate-rise flex-col gap-2 px-3 py-2.5 [animation-duration:420ms]", className)}
    >
      <div className="flex items-center gap-2 text-13 font-semibold tracking-caption whitespace-nowrap">
        <Spinner />
        {label}
      </div>
      <Progress value={value} animate aria-label={label} />
    </Card>
  );
}
