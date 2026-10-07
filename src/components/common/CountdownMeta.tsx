import { Stopwatch } from "@/components/icons/generated";
import { cn } from "@/lib/utils";

export function CountdownMeta({ text, className, ...props }: { text: string } & Omit<React.ComponentProps<"span">, "children">) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-13 font-medium whitespace-nowrap text-muted", className)}
      {...props}
    >
      <Stopwatch className="size-3.5 shrink-0" />
      {text}
    </span>
  );
}
