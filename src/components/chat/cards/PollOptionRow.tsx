"use client";

import { useId, type ComponentProps } from "react";
import { AvatarStack, type StackAvatar } from "@/components/common/AvatarStack";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { polls as copy } from "@/data/seed/copy";
import { USERS } from "@/data/seed/users";
import type { DateOption, UserId } from "@/data/types";
import { cn } from "@/lib/utils";
import { CalendarTile } from "./CalendarTile";

type PollOptionRowProps = Omit<ComponentProps<typeof RadioGroupItem>, "value" | "variant" | "children"> & {
  option: DateOption;
  /** Seed voters, plus 'aarav' last when `mine`. */
  voters: UserId[];
  mine: boolean;
  /** The first row has no top hairline. */
  first: boolean;
};

const fitToneClass: Record<DateOption["fitTone"], string> = {
  success: "text-success-ink",
  go: "text-go",
  muted: "text-muted",
};

function voterAvatar(id: UserId): StackAvatar {
  const u = USERS[id];
  return { name: u.firstName, initials: u.initials, src: u.avatar, tone: u.tone };
}

/**
 * One full-width dates-poll option: calendar tile, name + check radio, meta, fit + tally.
 * Must be rendered inside <RadioGroup>; extra props (e.g. `onClick` for re-tap to un-vote) go to the radio.
 */
export function PollOptionRow({ option, voters, mine, first, id, className, ...props }: PollOptionRowProps) {
  const autoId = useId();
  const itemId = id ?? autoId;

  return (
    <label
      htmlFor={itemId}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3.5 px-4 py-2 text-left transition-colors duration-160",
        !first && "border-t border-line",
        mine && "bg-success-tint",
        className,
      )}
    >
      <CalendarTile month={option.month} range={option.range} />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="flex items-center justify-between gap-2">
          <span className="text-15 leading-[1.3] font-semibold">{option.name}</span>
          <RadioGroupItem id={itemId} value={option.id} variant="check" {...props} />
        </span>
        <span className="text-13 font-medium text-muted">{option.meta}</span>
        <span className="flex justify-between gap-2 text-13 leading-[1.35]">
          <span className={cn("font-semibold", fitToneClass[option.fitTone])}>{option.fit}</span>
          <span className="flex items-center gap-1.5">
            {voters.length > 0 && (
              <AvatarStack aria-hidden avatars={voters.map(voterAvatar)} size={20} overlap={6} ring="white" max={3} />
            )}
            <span className="font-semibold whitespace-nowrap">{copy.dateVotes(voters.length)}</span>
          </span>
        </span>
      </span>
    </label>
  );
}
