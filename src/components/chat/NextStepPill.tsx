import Link from "next/link";
import { ChevronRight } from "@/components/icons/generated";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { assets } from "@/lib/assets";

type NextStepPillProps = {
  label: string;
  onPress?(): void;
  /** Renders a link instead of a button. */
  href?: string;
};

// Size 42 + semibold override the navy variant's font-medium; the pill rises in on mount.
const pillClass =
  "mt-1.5 gap-2 self-center pr-3.5 pl-1.5 shadow-pill transition-[scale,translate,box-shadow,opacity] duration-220 ease-out starting:translate-y-1.5 starting:opacity-0";

/** Navy "Next · …" / Go nudge pill. `GoNudgePill` is this same component (C-chat-kickoff.md §1.2). */
export function NextStepPill({ label, onPress, href }: NextStepPillProps) {
  const contents = (
    <>
      <Avatar kind="go" size={30} src={assets.goAvatar.src} />
      {label}
      <ChevronRight className="size-3.5" strokeWidth={2.6} />
    </>
  );

  if (href) {
    return (
      <Button asChild variant="navy" size="42" weight="semibold" className={pillClass}>
        <Link href={href} onClick={onPress}>
          {contents}
        </Link>
      </Button>
    );
  }

  return (
    <Button type="button" variant="navy" size="42" weight="semibold" className={pillClass} onClick={onPress}>
      {contents}
    </Button>
  );
}
