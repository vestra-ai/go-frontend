import { CountdownMeta } from "@/components/common/CountdownMeta";
import { ListRow } from "@/components/common/ListRow";
import { StatusPill } from "@/components/common/StatusPill";
import { Avatar } from "@/components/ui/avatar";
import { baliVisa } from "@/data/seed/visa";
import type { User, VisaMember } from "@/data/types";
import { InChatCard } from "../InChatCard";

type VisaStatusCardProps = {
  emoji: string;
  title: string;
  /** 'due 10 Dec'; absent when the checklist has no due date. */
  due?: string;
  /** One row a person. `label` is the row's own words when Go sent any, else the status's. */
  rows: { user: User; isYou: boolean; sub: string; status: VisaMember["status"]; label?: string }[];
};

const pillStatus = { "not-yet": "peach", sent: "success", started: "neutral" } as const;

/** Who in the group has something ready (the `checklist` card: a visa, a document); rows are not interactive. */
export function VisaStatusCard({ emoji, title, due, rows }: VisaStatusCardProps) {
  return (
    <InChatCard right={16} className="flex flex-col gap-1.5 pt-3.5 pb-2.5">
      <div className="flex items-center justify-between gap-2 px-4">
        <span className="text-18 font-semibold tracking-h4">
          <span aria-hidden>{emoji}</span> {title}
        </span>
        {due && <CountdownMeta text={due} />}
      </div>
      <div className="px-4">
        {rows.map(({ user, isYou, sub, status, label }) => (
          <ListRow
            key={user.id}
            dense
            leading={<Avatar size={32} tone={user.tone} name={user.name} src={user.avatar} />}
            title={isYou ? baliVisa.you : user.firstName}
            sub={sub}
            trailing={<StatusPill status={pillStatus[status]}>{label ?? baliVisa.statusLabel[status]}</StatusPill>}
          />
        ))}
      </div>
    </InChatCard>
  );
}
