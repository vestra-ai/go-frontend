import { Eyebrow } from "@/components/common/Eyebrow";
import { StatusPill } from "@/components/common/StatusPill";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { board as copy } from "@/data/seed/copy";
import { assets } from "@/lib/assets";
import type { BoardTrailing } from "@/state/boardView";

type BoardRowProps = {
  emoji: string;
  eyebrow: string;
  value: string;
  sub: string;
  trailing: BoardTrailing;
  /** ask / change only; status is inert. */
  onAction?: () => void;
};

export function BoardRow({ emoji, eyebrow, value, sub, trailing, onAction }: BoardRowProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span aria-hidden className="w-5 shrink-0 text-center text-16 leading-none">
        {emoji}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Eyebrow tone="muted">{eyebrow}</Eyebrow>
        <span className="text-16 leading-[1.3] font-semibold tracking-body">{value}</span>
        <span className="text-13 tracking-caption text-muted">{sub}</span>
      </div>
      {trailing.kind === "ask" && (
        <Button variant="tint" size="xs" className="gap-1.5 pr-3 pl-1.5" onClick={onAction}>
          <Avatar kind="go" size={20} src={assets.goAvatar.src} />
          {trailing.label}
        </Button>
      )}
      {trailing.kind === "change" && (
        <Button variant="tint" size="xs" className="px-3.5" onClick={onAction}>
          {copy.change}
        </Button>
      )}
      {trailing.kind === "status" && <StatusPill status={trailing.tone}>{trailing.label}</StatusPill>}
    </div>
  );
}
