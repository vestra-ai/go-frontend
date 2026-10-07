import { cn } from "@/lib/utils";

export function Spinner({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-3.5 shrink-0 rounded-full border-2 border-success-ring border-t-success border-r-success animate-spin-slow",
        className,
      )}
      {...props}
    />
  );
}
