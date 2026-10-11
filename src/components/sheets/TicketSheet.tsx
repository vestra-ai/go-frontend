"use client";

import { PdfViewer } from "@/components/plan/PdfViewer";
import { BottomSheet } from "@/components/shell/BottomSheet";
import type { TicketDoc, TripId } from "@/data/types";

type TicketSheetProps = {
  tripId: TripId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kept by the caller while the sheet animates out. */
  ticket: TicketDoc | null;
};

/** The e-ticket PDF viewer as a tall sheet over the chat: the chat stays mounted and visible behind it. */
export function TicketSheet({ tripId, open, onOpenChange, ticket }: TicketSheetProps) {
  return (
    // No grab bar over the toolbar. A swipe down dismisses from the toolbar, or from the pages once they are back at the top.
    <BottomSheet open={open} onOpenChange={onOpenChange} top={96} grabber={false} aria-label={ticket?.title}>
      {ticket && <PdfViewer key={ticket.documentId} tripId={tripId} ticket={ticket} onClose={() => onOpenChange(false)} />}
    </BottomSheet>
  );
}
