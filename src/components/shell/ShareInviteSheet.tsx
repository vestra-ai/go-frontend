"use client";

import { ChevronRight, MessageCircle } from "@/components/icons/generated";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DrawerTitle } from "@/components/ui/drawer";
import { share as copy } from "@/data/seed/copy";
import type { Trip } from "@/data/types";
import { copyInviteLink, inviteNative, inviteViaWhatsApp } from "@/lib/share";
import { cn } from "@/lib/utils";

export type ShareAction = "card-copy" | "recent" | "whatsapp" | "messages" | "gmail" | "copy-link" | "more";

type ShareInviteSheetProps = {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired for every action (the Copy on the link card keeps the sheet open). */
  onShared?: (action: ShareAction) => void;
  /** Stack above another open sheet. */
  nested?: boolean;
};

const tileClass = "size-14 rounded-4xl border border-line text-24";

export function ShareInviteSheet({ trip, open, onOpenChange, onShared, nested }: ShareInviteSheetProps) {
  // Handlers run navigator.share synchronously (inside the tap) before closing.
  function run(action: ShareAction, fn: () => Promise<void>) {
    void fn();
    onOpenChange(false);
    onShared?.(action);
  }

  function handlers(id: (typeof copy.targets)[number]["id"]): () => void {
    switch (id) {
      case "whatsapp":
        return () => run("whatsapp", () => inviteViaWhatsApp(trip));
      case "messages":
      case "gmail":
      case "more":
        return () => run(id, () => inviteNative(trip, id));
      case "copy-link":
        return () => run("copy-link", () => copyInviteLink(trip));
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} nested={nested} aria-label={copy.dialogLabel}>
      <DrawerTitle className="sr-only">{copy.dialogLabel}</DrawerTitle>
      <div className="flex flex-col gap-3.5 px-4 pt-3.5 pb-[max(30px,env(safe-area-inset-bottom))]">
        <Card variant="outline" radius="lg" className="flex items-center gap-3 p-3">
          <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", trip.tintClass)}>
            {trip.illustration ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={trip.illustration} alt="" className="size-11 object-contain" />
            ) : (
              <span aria-hidden className="text-20">{trip.emoji}</span>
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="text-15 font-semibold">{copy.title(trip.name)}</span>
            <span className="truncate text-13 text-muted">{trip.inviteUrl}</span>
          </div>
          <Button
            variant="soft"
            size="sm"
            className="px-3 text-13"
            onClick={() => {
              void copyInviteLink(trip);
              onShared?.("card-copy");
            }}
          >
            {copy.copy}
          </Button>
        </Card>

        <Card
          asChild
          variant="outline"
          radius="lg"
        >
          <button
            type="button"
            onClick={() => run("recent", () => inviteViaWhatsApp(trip))}
            className="flex items-center gap-3 px-3 py-2.5 text-left transition-transform active:scale-[0.97]"
          >
            <span className={cn("relative flex size-11 shrink-0 items-center justify-center rounded-full", trip.tintClass)}>
              <span aria-hidden className="text-20">{trip.emoji}</span>
              <span className="absolute -right-0.5 -bottom-0.5 size-[18px] rounded-full border-2 border-white bg-whatsapp" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-15 font-semibold">{trip.whatsappGroup}</span>
              <span className="text-13 text-muted">{copy.recentSub}</span>
            </span>
            <ChevronRight className="size-4 text-faint" strokeWidth={2.4} />
          </button>
        </Card>

        <div className="flex justify-between">
          {copy.targets.map((t) => (
            <Button
              key={t.id}
              variant="ghost"
              className="h-auto w-16 flex-col gap-1.5 px-0"
              onClick={handlers(t.id)}
            >
              <span
                className={cn(
                  "flex items-center justify-center",
                  tileClass,
                  t.id === "whatsapp" ? "bg-whatsapp" : "bg-white",
                )}
              >
                {t.id === "whatsapp" ? (
                  <MessageCircle className="size-7 text-white" />
                ) : "emoji" in t ? (
                  <span aria-hidden>{t.emoji}</span>
                ) : (
                  <span aria-hidden>{t.glyph}</span>
                )}
              </span>
              <span className="text-12 font-semibold text-ink">{t.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
