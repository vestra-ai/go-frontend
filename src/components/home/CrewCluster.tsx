import { DashedAvatar } from "@/components/common/DashedAvatar";
import { Avatar } from "@/components/ui/avatar";
import type { User } from "@/data/types";

type CrewClusterProps = { user: User; placeholders?: number };

/** You plus dashed "add" slots, overlapped. */
export function CrewCluster({ user, placeholders = 3 }: CrewClusterProps) {
  return (
    <div className="flex pl-3.5 *:-ml-3.5">
      <Avatar size={52} name={user.name} src={user.avatar} tone={user.tone} className="ring-[3px] ring-white" />
      {Array.from({ length: placeholders }, (_, i) => (
        <DashedAvatar key={i} size={52} />
      ))}
    </div>
  );
}
