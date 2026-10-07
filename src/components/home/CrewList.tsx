import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { LiveDot } from "@/components/common/LiveDot";
import { Avatar } from "@/components/ui/avatar";
import type { User } from "@/data/types";

type CrewListRow = { user: User; name: string; status: string; joined: boolean };

/** Who is in: organizer first, then each joiner with a green status. New rows ease in. */
export function CrewList({ rows }: { rows: CrewListRow[] }) {
  return (
    <ListCard padding="rows">
      {rows.map(({ user, name, status, joined }) => (
        <ListRow
          key={user.id}
          dense
          className="transition-[opacity,transform] duration-220 starting:translate-y-1.5 starting:opacity-0"
          leading={<Avatar size={44} name={user.name} src={user.avatar} tone={user.tone} />}
          title={<span className="text-16 leading-[1.3] tracking-body">{name}</span>}
          sub={
            joined ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-success-ink">
                <LiveDot size={7} pulse={false} />
                {status}
              </span>
            ) : (
              status
            )
          }
        />
      ))}
    </ListCard>
  );
}
