import { InChatCard } from "@/components/chat/InChatCard";
import { CheckBadge } from "@/components/common/CheckBadge";
import { Avatar } from "@/components/ui/avatar";
import { useRoomUsers } from "@/components/chat/RoomContext";
import type { WhoLandsRow } from "@/data/types";
import { cn } from "@/lib/utils";
import { SuggestionStrip } from "./SuggestionStrip";

type WhoLandsCardProps = {
  title: string;
  status: string;
  rows: WhoLandsRow[];
  /** Go's one suggestion under the rows; its button is a card action. */
  suggestion?: { emoji: string; text: string; cta: string };
  onSuggestion?: () => void;
};

/** F4 "Who lands when": one row per member (mode line, arrival, booked tick) + the shared-cab strip. */
export function WhoLandsCard({ title, status, rows, suggestion, onSuggestion }: WhoLandsCardProps) {
  const userOf = useRoomUsers();
  return (
    <InChatCard right={16} className="flex flex-col gap-1 py-3.5">
      <div className="flex items-center justify-between px-4">
        <span className="text-18 font-semibold tracking-h4">{title}</span>
        <span className="text-13 font-semibold text-success-ink">{status}</span>
      </div>
      <div className="px-4">
        {rows.map((row, i) => {
          const user = userOf(row.userId);
          return (
            <div key={row.userId} className={cn("flex items-center gap-2.5 py-2.5", i > 0 && "border-t border-line")}>
              <Avatar size={32} src={user.avatar} name={row.name} initials={user.initials} tone={user.tone} />
              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="text-15 leading-[1.3] font-semibold">{row.name}</span>
                <span className="text-13 leading-[1.35] tracking-caption text-muted">{row.mode}</span>
              </div>
              <span className="text-13 font-semibold whitespace-nowrap tabular-nums">{row.lands}</span>
              {row.booked && <CheckBadge size={24} />}
            </div>
          );
        })}
      </div>
      {suggestion && <SuggestionStrip emoji={suggestion.emoji} text={suggestion.text} cta={suggestion.cta} onAction={onSuggestion} />}
    </InChatCard>
  );
}
