"use client";

import { BottomSheet, SheetBody, SheetHeader } from "@/components/shell/BottomSheet";
import type { PrivateDetails } from "@/data/types";
import { BoardingInfoCard } from "./BoardingInfoCard";
import { ReturnRow } from "./ReturnRow";

type PrivateSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sub: string;
  details: PrivateDetails;
  ticketHref: string;
};

/** F7 "Just for you": the viewer's own flight details. Content-height, no footer (F-travel.md §1.4, §1.7 #8). */
export function PrivateSheet({ open, onOpenChange, title, sub, details, ticketHref }: PrivateSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} aria-label={title}>
      <SheetBody className="gap-3 px-4 pt-2 pb-7">
        <SheetHeader title={title} subtitle={sub} />
        <BoardingInfoCard details={details} ticketHref={ticketHref} />
        <ReturnRow {...details.ret} />
      </SheetBody>
    </BottomSheet>
  );
}
