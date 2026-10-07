import Link from "next/link";
import { AvatarStack } from "@/components/common/AvatarStack";
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
      className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] left-1/2 z-[3] h-[58px] -translate-x-1/2 gap-2.5 pl-2 pr-3 shadow-fab"
    >
      <Link href={`/trips/${tripId}/chat`}>
        <AvatarStack
          className="pl-3"
          size={36}
          overlap={12}
          ring="black"
          avatars={avatars.map((a) =>
            a === "go"
              ? { name: "Go", kind: "go", src: assets.goAvatar.src }
              : { name: a.name, src: a.avatar, tone: a.tone },
          )}
        />
        <span className="flex flex-col items-start">
          <span className="text-15 font-semibold tracking-sub leading-[1.25]">Chat</span>
          <span className="text-12 text-white/70 tracking-[0.01em] leading-[1.3] whitespace-nowrap">{preview}</span>
        </span>
        {unread > 0 && (
          <Badge variant="terracotta" size="count" aria-label={`${unread} unread`}>
            {unread}
          </Badge>
        )}
      </Link>
    </Button>
  );
}
