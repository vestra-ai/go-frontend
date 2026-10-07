"use client";

import { useState } from "react";
import { AvatarStack } from "@/components/common/AvatarStack";
import type { EmojiTileTint } from "@/components/common/EmojiTile";
import { Eyebrow } from "@/components/common/Eyebrow";
import { RadioOptionCard } from "@/components/common/RadioOptionCard";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader, TrustLine } from "@/components/shell/BottomSheet";
import { Note } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup } from "@/components/ui/radio-group";
import { paySheet as copy } from "@/data/seed/copy";
import { USERS } from "@/data/seed/users";
import type { Stay, UserId } from "@/data/types";

type PayMethod = "upi" | "card";

type PaySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stay: Stay;
  /** 'Villa Sol · 3 nights' / 'Fri 6 → Mon 9 Nov · 4 guests' / '₹43,200' */
  summary: { title: string; sub: string; amount: string };
  methods: readonly { id: PayMethod; emoji: string; title: string; sub: string; tint: string }[];
  split: { text: string; members: readonly UserId[] };
  /** 'Pay ₹43,200 & book' */
  cta: string;
  /** 'Paid straight to Villa Sol · free cancellation till 1 Nov' */
  trust: string;
  /** `payBooking()`; the method changes nothing else, as designed. */
  onPay: (method: PayMethod) => void;
};

/** E14 pay sheet (570 tall, top 342 on the design frame): summary, UPI / card radio, split note, pay CTA. */
export function PaySheet({ open, onOpenChange, stay, summary, methods, split, cta, trust, onPay }: PaySheetProps) {
  // Local, never persisted. DESIGN-ASSUMPTION (PLAN §12.1 #7): Rahul's instruments are shown to you as yours.
  const [method, setMethod] = useState<PayMethod>("upi");

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={342} aria-label={copy.label}>
      <SheetBody className="gap-3 pb-[150px]">
        <SheetHeader title={copy.title} subtitle={copy.sub} />
        <Card variant="outline" radius="xl" className="flex items-center gap-3 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo, decorative thumb */}
          <img src={stay.img} alt="" className="h-[52px] w-16 shrink-0 rounded-xl object-cover" />
          <div className="flex flex-1 flex-col gap-px">
            <span className="text-16 leading-[1.3] font-semibold tracking-body">{summary.title}</span>
            <span className="text-13 text-muted">{summary.sub}</span>
          </div>
          <span className="text-16 font-bold tabular-nums">{summary.amount}</span>
        </Card>
        <div className="flex flex-col gap-2">
          <Eyebrow className="px-1">{copy.payWith}</Eyebrow>
          <RadioGroup
            aria-label={copy.payWithLabel}
            value={method}
            onValueChange={(v) => setMethod(v as PayMethod)}
            className="flex flex-col gap-2"
          >
            {methods.map((m) => (
              <RadioOptionCard
                key={m.id}
                value={m.id}
                variant="ring"
                emoji={m.emoji}
                // Seed tints are `bg-<token>` classes ("bg-success-soft"); EmojiTile takes the token.
                emojiTint={m.tint.replace(/^bg-/, "") as EmojiTileTint}
                emojiShape="circle"
                title={m.title}
                sub={m.sub}
              />
            ))}
          </RadioGroup>
        </div>
        <Note
          variant="peach"
          icon={
            <AvatarStack
              avatars={split.members.map((id) => ({ name: USERS[id].name, src: USERS[id].avatar, tone: USERS[id].tone }))}
              size={22}
              overlap={7}
              ring="white"
              className="shrink-0"
            />
          }
        >
          {split.text}
        </Note>
      </SheetBody>
      <SheetFooter>
        <Button type="button" variant="primary" size="xl" className="w-full" onClick={() => onPay(method)}>
          {cta}
        </Button>
        <TrustLine>{trust}</TrustLine>
      </SheetFooter>
    </BottomSheet>
  );
}
