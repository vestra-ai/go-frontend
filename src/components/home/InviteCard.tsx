"use client";

import Link from "next/link";
import { AvatarStack } from "@/components/common/AvatarStack";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { home as copy } from "@/data/seed/copy";
import type { User } from "@/data/types";

type InviteCardProps = {
  title: string;
  sub: string;
  members: User[];
  membersLine: string;
  thumb: { src: string; tintClass: string };
  acceptHref: string;
  onDecline: () => void;
};

/** Pending trip invite on App home: thumb, who is in, Accept (link) and Decline. */
export function InviteCard({ title, sub, members, membersLine, thumb, acceptHref, onDecline }: InviteCardProps) {
  return (
    <Card variant="shadow" radius="2xl" className="flex flex-col gap-3 p-3.5">
      <div className="flex items-center gap-3">
        <span className={`flex size-[52px] shrink-0 items-center justify-center rounded-2xl ${thumb.tintClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG illustration */}
          <img src={thumb.src} alt="" className="size-11" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-16 leading-[1.3] font-semibold tracking-body wrap-anywhere">{title}</span>
          <span className="text-13 tracking-caption text-muted wrap-anywhere">{sub}</span>
          <span className="flex min-w-0 items-center gap-1.5 text-13 tracking-caption text-muted">
            <AvatarStack
              size={20}
              overlap={6}
              ring="white"
              avatars={members.map((u) => ({ name: u.name, src: u.avatar, tone: u.tone }))}
            />
            <span className="min-w-0 wrap-anywhere">{membersLine}</span>
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="base" asChild className="flex-1 px-[18px] tracking-h4">
          <Link href={acceptHref}>{copy.accept}</Link>
        </Button>
        <Button variant="secondary" size="base" className="flex-1 px-3.5 tracking-sm" onClick={onDecline}>
          {copy.decline}
        </Button>
      </div>
    </Card>
  );
}
