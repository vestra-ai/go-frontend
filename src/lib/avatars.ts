import type { StackAvatar } from "@/components/common/AvatarStack";
import type { User } from "@/data/types";

/** A person as an AvatarStack entry: first name (alt), photo, initials + tone for the fallback. */
export function stackAvatar(u: User): StackAvatar {
  return { name: u.firstName, initials: u.initials, src: u.avatar, tone: u.tone, kind: "user" };
}
