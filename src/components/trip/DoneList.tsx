"use client";

import type { CallModel, DoneRowModel } from "@/state/homeView";
import { CheckBadge } from "@/components/common/CheckBadge";
import { EmojiTile } from "@/components/common/EmojiTile";
import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { CALL_COPY } from "@/data/seed/calls";
import { CallOptionsPanel } from "./CallOptionsPanel";
import { LastCallRow } from "./LastCallRow";
import { ExpandableBookingRow } from "./ExpandableBookingRow";
import { VendorLivePanel } from "./VendorLivePanel";

export interface AskDraft {
  chip: string | null;
  draft: string;
}

type DoneListProps = Omit<React.ComponentProps<typeof ListCard>, "children" | "onToggle"> & {
  /** `buildDone` result. */
  rows: DoneRowModel[];
  /** Key of the open row (one at a time). */
  openRow: string | null;
  onToggle(key: string): void;
  /** The ask form of each expandable row, by row key. */
  asks: Record<string, AskDraft | undefined>;
  onChip(key: string, label: string): void;
  onDraft(key: string, text: string): void;
  /** "📞 Call": asks Go in the room to call this row's business. */
  onCall(row: DoneRowModel): void;
  /** Absent while `features.calls` is off: Listen in and the recording are hidden (CONTRACT-APP §7). */
  onListen?(call: CallModel): void;
  onEnd(call: CallModel): void;
  onRecording?(call: CallModel): void;
};

const NO_ASK: AskDraft = { chip: null, draft: "" };

/** The "Done" card: bookings (and Go's calls) expand one at a time, the rest are static done rows. */
export function DoneList({ rows, openRow, onToggle, asks, onChip, onDraft, onCall, onListen, onEnd, onRecording, ...props }: DoneListProps) {
  return (
    <ListCard padding="tight" data-slot="done-list" {...props}>
      {rows.map((row) => {
        const expand = row.expand;
        if (!expand) {
          return (
            <ListRow
              key={row.key}
              muted
              className="gap-2.5 py-[11px]"
              leading={<EmojiTile emoji={row.emoji} size={36} shape="circle" tint="surface-2" />}
              title={row.title}
              sub={row.sub}
              trailing={<CheckBadge size={22} />}
            />
          );
        }
        const { live, last } = expand;
        const ask = asks[row.key] ?? NO_ASK;
        return (
          <ExpandableBookingRow
            key={row.key}
            emoji={row.emoji}
            title={row.title}
            sub={row.sub}
            live={live !== undefined}
            open={openRow === row.key}
            onToggle={() => onToggle(row.key)}
          >
            {live ? (
              <VendorLivePanel
                who={live.who}
                asking={live.asking}
                onListen={onListen && live.canListen ? () => onListen(live) : undefined}
                onEnd={live.canStop ? () => onEnd(live) : undefined}
              />
            ) : (
              <CallOptionsPanel
                eyebrow={CALL_COPY.options.eyebrow(expand.who)}
                placeholder={CALL_COPY.options.placeholder}
                srLabel={CALL_COPY.options.srLabel(expand.who)}
                chips={expand.chips}
                selected={ask.chip}
                onChip={(label) => onChip(row.key, label)}
                draft={ask.draft}
                onDraft={(text) => onDraft(row.key, text)}
                onCall={() => onCall(row)}
              />
            )}
            {last?.outcome && (
              <LastCallRow who={last.who} outcome={last.outcome} onRecording={onRecording && last.card.recording_url ? () => onRecording(last) : undefined} />
            )}
          </ExpandableBookingRow>
        );
      })}
    </ListCard>
  );
}
