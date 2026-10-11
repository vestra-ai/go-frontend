"use client";

import { TicketFileRow } from "@/components/chat/cards/TicketFileRow";
import { BottomSheet, SheetBody, SheetHeader } from "@/components/shell/BottomSheet";
import type { PrivateDetails } from "@/data/types";
import { BoardingInfoCard } from "./BoardingInfoCard";
import { FileOnItsWay } from "./FileOnItsWay";
import { ReturnRow } from "./ReturnRow";

type PrivateSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sub: string;
  /** Kept by the caller while the sheet animates out. */
  details: PrivateDetails | null;
  /** The booking's files that no leg owns, listed under the card. */
  files?: { documentId: string; name: string; sub: string; openLabel: string }[];
  /** The booking's `created_at`, while it has no file yet and one may still be on its way. */
  pendingSince?: string;
  /** Opens one of the booking's files in the ticket viewer, over the chat. */
  onOpenFile: (documentId: string) => void;
};

/**
 * F7 "Just for you": the viewer's own booking, opened from its ticket in the room. A flight shows its onward leg and
 * the way back, each with its own e-ticket; a stay its dates and its voucher. Content-height, no footer
 * (F-travel.md §1.4, §1.7 #8).
 */
export function PrivateSheet({ open, onOpenChange, title, sub, details, files = [], pendingSince, onOpenFile }: PrivateSheetProps) {
  const file = details?.file;
  const back = details?.ret?.file;
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} aria-label={title}>
      <SheetBody className="gap-3 px-4 pt-2 pb-7">
        <SheetHeader title={title} subtitle={sub} />
        {details && <BoardingInfoCard details={details} onOpenTicket={file ? () => onOpenFile(file.documentId) : undefined} pendingSince={pendingSince} />}
        {details?.ret && (
          <ReturnRow
            emoji={details.ret.emoji}
            title={details.ret.title}
            sub={details.ret.sub}
            open={back ? { label: back.label, onPress: () => onOpenFile(back.documentId) } : undefined}
          />
        )}
        {files.map((f) => (
          <TicketFileRow key={f.documentId} name={f.name} sub={f.sub} openLabel={f.openLabel} onOpen={() => onOpenFile(f.documentId)} />
        ))}
        {!details && files.length === 0 && pendingSince && <FileOnItsWay key={pendingSince} since={pendingSince} />}
      </SheetBody>
    </BottomSheet>
  );
}
