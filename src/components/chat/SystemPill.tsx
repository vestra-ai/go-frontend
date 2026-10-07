import { Avatar } from "@/components/ui/avatar";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";

type SystemPillProps = {
  text: string;
  /** Leading Go avatar (20px). Default true. */
  avatar?: boolean;
};

/** Centred event pill, e.g. "Trip created · Rahul joined". */
export function SystemPill({ text, avatar = true }: SystemPillProps) {
  return (
    <div
      className={cn(
        "my-0.5 flex items-center gap-1.5 self-center rounded-full bg-white py-[5px] pr-3 text-13 leading-[1.35] tracking-caption text-muted shadow-bubble",
        avatar ? "pl-[5px]" : "pl-3",
      )}
    >
      {avatar && <Avatar kind="go" size={20} src={assets.goAvatar.src} />}
      {text}
    </div>
  );
}
