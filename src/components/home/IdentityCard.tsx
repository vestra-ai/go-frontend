import { CheckBadge } from "@/components/common/CheckBadge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { User } from "@/data/types";

/** Profile header: avatar, name, email and the sign-in provider line. */
export function IdentityCard({ user, providerLabel }: { user: User; providerLabel: string }) {
  return (
    <Card variant="shadow" radius="3xl" className="flex items-center gap-3.5 p-5">
      <Avatar size={64} name={user.name} src={user.avatar} tone={user.tone} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-22 font-semibold tracking-h2">{user.name}</span>
        {user.email && <span className="text-13 tracking-caption text-muted">{user.email}</span>}
        <span className="flex items-center gap-[5px] text-12 font-semibold text-success-ink">
          <CheckBadge size={14} />
          {providerLabel}
        </span>
      </div>
    </Card>
  );
}
