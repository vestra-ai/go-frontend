import Link from "next/link";
import { AvatarStack } from "@/components/common/AvatarStack";
import { ChevronRight } from "@/components/icons/generated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TripId, User } from "@/data/types";
import { assets } from "@/lib/assets";

export interface ChatPreview {
  avatars: Array<"go" | User>;
  text: string;
  unread: number;
}

type ChatFabProps = {
  tripId: TripId;
  avatars: ChatPreview["avatars"];
  preview: string;
  unread: number;
};

export function ChatFab({ tripId, avatars, preview, unread }: ChatFabProps) {
  return (
    <Button
      asChild
      variant="primary"
      size="base"
      // The right padding mirrors the 20px the avatars sit from the left edge; the unread badge and the chevron are their own weight there, so they keep the tighter 12px.
      className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] left-1/2 z-[3] h-[58px] max-w-[80%] -translate-x-1/2 gap-2 pl-2 pr-3 shadow-fab"
    >
      <Link href={`/trips/${tripId}/chat`}>
        <AvatarStack
          className="shrink-0 pl-2"
          size={32}
          overlap={14}
          ring="black"
          avatars={avatars.map((a) =>
            a === "go"
              ? { name: "Go", kind: "go", src: assets.goAvatar.src }
              : { name: a.name, src: a.avatar, tone: a.tone },
          )}
        />
        {/* min-w-0 lets the column shrink with the button's max width, so a long last message ends in an ellipsis; the 168px cap keeps the pill compact. */}
        <span className="flex min-w-0 max-w-[168px] flex-col">
          <span className="text-15 font-semibold tracking-sub leading-[1.25]">Chat</span>
          <span className="truncate text-12 text-white/70 tracking-[0.01em] leading-[1.3]">{preview}</span>
        </span>
        {unread > 0 ? (
          <Badge variant="terracotta" size="count" className="shrink-0" aria-label={`${unread} unread`}>
            {unread}
          </Badge>
        ) : (
          <ChevronRight aria-hidden className="size-5 shrink-0 text-white" strokeWidth={2.4} />
        )}
      </Link>
    </Button>
  );
}
