import { Avatar } from "@/components/ui/avatar";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";

/** The "@Go" chip inside my bubbles. */
export function MentionChip({ name = "Go", className, ...props }: { name?: string } & Omit<React.ComponentProps<"span">, "children">) {
  return (
    <span
      className={cn("inline-flex h-6 items-center gap-[5px] rounded-full bg-white/16 pr-[9px] pl-0.5 font-semibold", className)}
      {...props}
    >
      <Avatar kind="go" size={20} src={assets.goAvatar.src} name={name} />
      {name}
    </span>
  );
}
