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
  /** Kept by the caller while the sheet animates out. */
  details: PrivateDetails | null;
  /** Opens the e-ticket viewer sheet over the chat. Absent when the booking carries no document for me. */
  onOpenTicket?: () => void;
};

/** F7 "Just for you": the viewer's own flight details. Content-height, no footer (F-travel.md §1.4, §1.7 #8). */
export function PrivateSheet({ open, onOpenChange, title, sub, details, onOpenTicket }: PrivateSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} aria-label={title}>
      <SheetBody className="gap-3 px-4 pt-2 pb-7">
        <SheetHeader title={title} subtitle={sub} />
        {details && <BoardingInfoCard details={details} onOpenTicket={onOpenTicket} />}
        {details?.ret && <ReturnRow {...details.ret} />}
      </SheetBody>
    </BottomSheet>
  );
}
