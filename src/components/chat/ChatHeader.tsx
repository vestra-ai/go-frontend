import type { ReactNode } from "react";
import Link from "next/link";
import { AvatarStack } from "@/components/common/AvatarStack";
import { ArrowLeft, Board, Share } from "@/components/icons/generated";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { chat as copy } from "@/data/seed/copy";
import type { AvatarSpec, Trip } from "@/data/types";
import { assets } from "@/lib/assets";

type ChatHeaderProps = {
  /** `avatar`: the destination's photo (`photo`) or, without one, the trip's illustration. */
  trip: { name: string; avatar?: string; photo?: boolean; tint: Trip["tint"] };
  subtitle: string;
  /** Stage members, max 4, never Kabir. */
  members: AvatarSpec[];
  /** `/trips/${tripId}` (Bali: `/home`). Back always uses it; the title too unless `onTitlePress` is set. */
  backHref: string;
  /** Title block becomes a button (Bali toast) instead of a link to `backHref`. */
  onTitlePress?(): void;
  onBoard(): void;
  onShare(): void;
  /** `<FactChipRow/>` */
  children: ReactNode;
};

const titleClass = "flex h-[52px] min-w-0 flex-1 items-center gap-2.5 px-1 text-left";

// The stack is decorative (the subtitle names who joined).
function stackAvatar(spec: AvatarSpec) {
  if (spec.kind === "go") return { name: copy.goName, kind: "go" as const, src: assets.goAvatar.src };
  return { name: spec.initials, initials: spec.initials, src: spec.src, tone: spec.tone };
}

/**
 * Chat header: safe-area top (+16) + 52 row + 14 + 36 chips + 12, pinned with `sticky top-0`
 * (DESIGN-ASSUMPTION PLAN §12.1 #8: C2's 178px variant is dropped).
 */
export function ChatHeader({ trip, subtitle, members, backHref, onTitlePress, onBoard, onShare, children }: ChatHeaderProps) {
  const title = (
    <>
      {/* DESIGN-ASSUMPTION: the design's trip avatar is a circle; Avatar kind=trip defaults to rounded-xl. */}
      <Avatar kind="trip" shape="circle" size={36} tone={trip.tint} src={trip.avatar} photo={trip.photo} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-16 leading-[1.25] font-semibold tracking-body">{trip.name}</span>
        <span className="flex min-w-0 items-center gap-1.5">
          {members.length > 0 && (
            <AvatarStack aria-hidden avatars={members.map(stackAvatar)} size={18} overlap={5} ring="white-thin" />
          )}
          <span className="min-w-0 truncate text-13 text-muted">{subtitle}</span>
        </span>
      </span>
    </>
  );

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-white pt-safe pb-3 shadow-header">
      {/* The visible title is a button/link (avatar + name + crew line), so the page heading is announced separately. */}
      <h1 className="sr-only">{trip.name}</h1>
      <div className="flex items-center gap-1 pr-2 pl-3">
        <Button asChild variant="ghost" size="icon-xs" className="text-black">
          <Link href={backHref} aria-label={copy.header.back}>
            <ArrowLeft className="size-[22px]" strokeWidth={2} />
          </Link>
        </Button>
        {onTitlePress ? (
          <button type="button" className={titleClass} onClick={onTitlePress}>
            {title}
          </button>
        ) : (
          <Link href={backHref} className={titleClass}>
            {title}
          </Link>
        )}
        {/* 36px targets, touching: the icons sit close together and the last one lines up with the 16px page inset. */}
        <div className="flex shrink-0">
          <Button type="button" variant="ghost" size="icon-xs" className="text-black" aria-label={copy.header.board} onClick={onBoard}>
            <Board className="size-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" className="text-black" aria-label={copy.header.share} onClick={onShare}>
            <Share className="size-5" />
          </Button>
        </div>
      </div>
      {children}
    </header>
  );
}
