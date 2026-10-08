"use client";

import { CheckBadge } from "@/components/common/CheckBadge";
import { EmojiTile } from "@/components/common/EmojiTile";
import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { CALL_CHIPS, CALL_COPY } from "@/data/seed/calls";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import type { LastCall, VendorId } from "@/data/types";
import type { DoneRow, LiveCall } from "@/store/selectors";
import type { OpenRow } from "@/store/state";
import { CallOptionsPanel } from "./CallOptionsPanel";
import { CheckinPreviewLink } from "./CheckinPreviewLink";
import { LastCallRow } from "./LastCallRow";
import { ExpandableBookingRow } from "./ExpandableBookingRow";
import { VendorLivePanel } from "./VendorLivePanel";

type BookingRow = Exclude<OpenRow, null>;

// Which vendor each expandable row calls, and the strings its body shows (§1.2 E.1). The booking details live in the Listen sheet.
const BOOKING_ROWS = {
  stay: { vendor: "villa", options: CALL_COPY.options.stay },
  fly: { vendor: "indigo", options: CALL_COPY.options.fly },
} as const;

type DoneListProps = Omit<React.ComponentProps<typeof ListCard>, "children" | "onToggle"> & {
  /** `selectDone` result. */
  rows: DoneRow[];
  openRow: OpenRow;
  onToggle(row: BookingRow): void;
  /** Live calls: a row whose vendor is live shows "On a call" and the green panel. */
  calls: LiveCall[];
  /** `home.askForm.chips` / `drafts` (only `stay` and `fly` are read). */
  chips: Record<BookingRow, string | null>;
  drafts: Record<BookingRow, string>;
  onChip(key: BookingRow, label: string): void;
  onDraft(key: BookingRow, text: string): void;
  /** Options "📞 Call" → `startCall(vendor, key)`. */
  onCall(vendor: VendorId, key: BookingRow): void;
  onListen(vendor: VendorId): void;
  onEnd(vendor: VendorId): void;
  /** The latest finished call: its row (with the Recording button) shows in that vendor's card. */
  pastCall: LastCall;
  /** Recording button → `?sheet=recording&call={vendor}`. */
  onRecording(vendor: VendorId): void;
  /** Flights "Preview" → `previewCheckin()` + `toggleRow(null)` + scroll to top. */
  onPreviewCheckin(): void;
};

/** The "Done" card: Stay and Flights expand (one at a time), the rest are static done rows (§1.2 E). */
export function DoneList({
  rows,
  openRow,
  onToggle,
  calls,
  chips,
  drafts,
  onChip,
  onDraft,
  onCall,
  onListen,
  onEnd,
  pastCall,
  onRecording,
  onPreviewCheckin,
  ...props
}: DoneListProps) {
  return (
    <ListCard padding="tight" data-slot="done-list" {...props}>
      {rows.map((row) => {
        if (!row.expandable) {
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
        const key = row.expandable;
        const { vendor, options } = BOOKING_ROWS[key];
        const live = calls.find((c) => c.id === vendor);
        return (
          <ExpandableBookingRow
            key={row.key}
            emoji={row.emoji}
            title={row.title}
            sub={row.sub}
            live={live !== undefined}
            open={openRow === key}
            onToggle={() => onToggle(key)}
          >
            {live ? (
              <VendorLivePanel
                who={live.who}
                asking={live.asking}
                onListen={() => onListen(vendor)}
                onEnd={() => onEnd(vendor)}
              />
            ) : (
              <CallOptionsPanel
                eyebrow={options.eyebrow}
                placeholder={options.placeholder}
                srLabel={options.srLabel}
                chips={CALL_CHIPS[key]}
                selected={chips[key]}
                onChip={(label) => onChip(key, label)}
                draft={drafts[key]}
                onDraft={(text) => onDraft(key, text)}
                onCall={() => onCall(vendor, key)}
              />
            )}
            {pastCall.vendor === vendor && (
              <LastCallRow lastCall={pastCall} onRecording={() => onRecording(vendor)} />
            )}
            {key === "fly" && <CheckinPreviewLink {...CHECKIN_COPY.preview} onPreview={onPreviewCheckin} />}
          </ExpandableBookingRow>
        );
      })}
    </ListCard>
  );
}
