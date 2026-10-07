import { CountdownMeta } from "@/components/common/CountdownMeta";
import { ListRow } from "@/components/common/ListRow";
import { StatusPill } from "@/components/common/StatusPill";
import { Avatar } from "@/components/ui/avatar";
import { baliVisa } from "@/data/seed/visa";
import type { User, VisaMember } from "@/data/types";
import { assets } from "@/lib/assets";
import { InChatCard } from "../InChatCard";

type VisaStatusCardProps = {
  emoji: string;
  title: string;
  due: string;
  rows: { user: User; isYou: boolean; sub: string; status: VisaMember["status"] }[];
};

// Pill palette: not-yet → peach, sent → success, started → neutral (G-bali.md §1.3).
const pillStatus = { "not-yet": "peach", sent: "success", started: "neutral" } as const;

/** G2 per-member e-VOA status; rows are not interactive (G-bali.md §1.3). */
export function VisaStatusCard({ emoji, title, due, rows }: VisaStatusCardProps) {
  return (
    <InChatCard right={16} className="flex flex-col gap-1.5 pt-3.5 pb-2.5">
      <div className="flex items-center justify-between gap-2 px-4">
        <span className="text-18 font-semibold tracking-h4">
          <span aria-hidden>{emoji}</span> {title}
        </span>
        <CountdownMeta text={due} />
      </div>
      <div className="px-4">
        {rows.map(({ user, isYou, sub, status }) => (
          <ListRow
            key={user.id}
            dense
            leading={<Avatar size={32} tone={user.tone} name={user.name} src={user.avatar ?? assets.avatars[user.id].src} />}
            title={isYou ? baliVisa.you : user.firstName}
            sub={sub}
            trailing={<StatusPill status={pillStatus[status]}>{baliVisa.statusLabel[status]}</StatusPill>}
          />
        ))}
      </div>
    </InChatCard>
  );
}
