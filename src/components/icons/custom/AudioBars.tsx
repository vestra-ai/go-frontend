import { cn } from "@/lib/utils";

const DEFAULT_HEIGHTS = [8, 16, 24, 12, 20, 28, 14, 22, 10, 18, 26, 12, 16, 8];

type AudioBarsProps = React.ComponentProps<"div"> & {
  heights?: number[];
  stepMs?: number;
};

export function AudioBars({
  heights = DEFAULT_HEIGHTS,
  stepMs = 90,
  className,
  ...props
}: AudioBarsProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex h-[30px] items-center gap-[3px]", className)}
      {...props}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] shrink-0 rounded-full bg-success animate-wave [animation-delay:var(--d)]"
          style={{ height: h, "--d": `${i * stepMs}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
