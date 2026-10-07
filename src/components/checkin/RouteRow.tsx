import { cn } from "@/lib/utils";

type RouteRowProps = {
  /** sm: sheet route card (code + time, 20/700). lg: boarding pass (code only, 34/800). */
  size: "sm" | "lg";
  from: string;
  fromTime?: string;
  fromSub: string;
  to: string;
  toTime?: string;
  toSub: string;
  className?: string;
};

/** BLR → GOX with a dashed rule and ✈️ in between (K2 route card, K4 pass). */
export function RouteRow({ size, from, fromTime, fromSub, to, toTime, toSub, className }: RouteRowProps) {
  const lg = size === "lg";
  const code = lg ? "text-34 font-extrabold tracking-h2" : "text-20 font-bold tabular-nums";
  const rule = <span className="flex-1 border-t-[1.5px] border-dashed border-line-4" />;

  return (
    <div className={cn("flex items-center", lg ? "gap-2.5" : "gap-3", className)}>
      <div className="flex flex-col">
        <span className={code}>{lg ? from : `${from} ${fromTime}`}</span>
        <span className="text-13 text-muted">{fromSub}</span>
      </div>
      <div className={cn("flex flex-1 items-center text-faint", lg ? "gap-1" : "gap-1")}>
        {rule}
        <span aria-hidden>✈️</span>
        {rule}
      </div>
      <div className="flex flex-col items-end text-right">
        <span className={code}>{lg ? to : `${to} ${toTime}`}</span>
        <span className="text-13 text-muted">{toSub}</span>
      </div>
    </div>
  );
}
