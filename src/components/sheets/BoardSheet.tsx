"use client";

import { BoardRow } from "@/components/board/BoardRow";
import { GoReminderRow } from "@/components/board/GoReminderRow";
import { PollRow } from "@/components/board/PollRow";
import { SpendVsBudgetCard } from "@/components/board/SpendVsBudgetCard";
import { BottomSheet, SheetBody, SheetHeader } from "@/components/shell/BottomSheet";
import { Card } from "@/components/ui/card";
import { board as copy } from "@/data/seed/copy";
import type { TripId } from "@/data/types";
import { useBoard } from "@/store/hooks";
import type { BoardTarget } from "@/store/selectors";

type BoardSheetProps = {
  tripId: TripId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Row / reminder / Vote tap; the host closes the sheet and deep-links into the chat. */
  onAction: (target: BoardTarget) => void;
};

export function BoardSheet({ tripId, open, onOpenChange, onAction }: BoardSheetProps) {
  const board = useBoard(tripId);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={150} aria-label={copy.title}>
      <SheetHeader title={copy.title} subtitle={board.subtitle} closeLabel={copy.close} className="px-5 pt-2" />
      <SheetBody className="gap-3 px-4 pt-2 pb-7">
        <Card variant="float-sm" radius="2xl" className="divide-y divide-line overflow-hidden px-4">
          {board.reminder && (
            <GoReminderRow
              eyebrow={board.reminder.eyebrow}
              value={board.reminder.value}
              sub={board.reminder.sub}
              cta={board.reminder.cta}
              onAction={() => onAction(board.reminder!.target)}
            />
          )}
          {board.rows.map((r) =>
            r.kind === "poll" ? (
              <PollRow
                key={r.key}
                emoji={r.emoji}
                eyebrow={r.eyebrow}
                value={r.value}
                sub={r.sub}
                cta={r.cta}
                options={r.options}
                onAction={() => onAction(r.key)}
              />
            ) : (
              <BoardRow
                key={r.key}
                emoji={r.emoji}
                eyebrow={r.eyebrow}
                value={r.value}
                sub={r.sub}
                trailing={r.trailing}
                onAction={() => onAction(r.key)}
              />
            ),
          )}
        </Card>
        <SpendVsBudgetCard spend={board.spend} />
      </SheetBody>
    </BottomSheet>
  );
}
