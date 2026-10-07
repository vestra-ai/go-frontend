import type { StackAvatar } from "@/components/common/AvatarStack";
import { USERS } from "@/data/seed/users";
import type { UserId } from "@/data/types";

/** A seed user as an AvatarStack entry: first name (alt), seed photo, initials + tone for the fallback. */
export function userStackAvatar(id: UserId): StackAvatar {
  const u = USERS[id];
  return { name: u.firstName, initials: u.initials, src: u.avatar, tone: u.tone, kind: "user" };
}
