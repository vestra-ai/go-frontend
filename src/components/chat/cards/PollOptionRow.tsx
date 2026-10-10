"use client";

import { useId, type ComponentProps } from "react";
import { AvatarStack } from "@/components/common/AvatarStack";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { polls as copy } from "@/data/seed/copy";
import type { DateOption, UserId } from "@/data/types";
import { stackAvatar } from "@/lib/avatars";
import { useRoomUsers } from "@/components/chat/RoomContext";
import { cn } from "@/lib/utils";
import { CalendarTile } from "./CalendarTile";

type PollOptionRowProps = Omit<ComponentProps<typeof RadioGroupItem>, "value" | "variant" | "children"> & {
  option: DateOption;
  /** Seed voters, plus 'aarav' last when `mine`. */
  voters: UserId[];
  mine: boolean;
  /** The first row has no top hairline. */
  first: boolean;
  /** The vote's result: green row and "· won" after the tally. */
  won: boolean;
  /** Mine, but another option won: the row and its check go grey. */
  lost: boolean;
};

const fitToneClass: Record<DateOption["fitTone"], string> = {
  success: "text-success-ink",
  go: "text-go",
  muted: "text-muted",
};

/**
 * One full-width dates-poll option: calendar tile, name + check radio, meta, fit + tally.
 * Must be rendered inside <RadioGroup>; extra props (e.g. `onClick` for re-tap to un-vote) go to the radio.
 */
export function PollOptionRow({ option, voters, mine, first, won, lost, id, className, ...props }: PollOptionRowProps) {
  const autoId = useId();
  const userOf = useRoomUsers();
  const itemId = id ?? autoId;

  return (
    <label
      htmlFor={itemId}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3.5 px-4 py-2 text-left transition-colors duration-160",
        !first && "border-t border-line",
        (won || (mine && !lost)) && "bg-success-tint",
        lost && "bg-surface-2",
        className,
      )}
    >
      {option.month && option.range && <CalendarTile month={option.month} range={option.range} />}
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="flex items-center justify-between gap-2">
          {/* wrap-anywhere: a long word wraps inside the row, where it would otherwise push the check and the tally off the card. */}
          <span className="min-w-0 text-15 leading-[1.3] font-semibold wrap-anywhere">{option.name}</span>
          <RadioGroupItem
            id={itemId}
            value={option.id}
            variant="check"
            className={cn("shrink-0", lost && "data-[state=checked]:border-faint data-[state=checked]:bg-faint")}
            {...props}
          />
        </span>
        <span className="text-13 font-medium text-muted wrap-anywhere">{option.meta}</span>
        {/* min-h-5 = the 20px avatar, so the first vote doesn't grow the row. */}
        <span className="flex min-h-5 items-center justify-between gap-2 text-13 leading-[1.35]">
          <span className={cn("min-w-0 font-semibold wrap-anywhere", fitToneClass[option.fitTone])}>{option.fit}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            {voters.length > 0 && (
              <AvatarStack aria-hidden avatars={voters.map((id) => stackAvatar(userOf(id)))} size={20} overlap={6} ring="white" max={3} />
            )}
            <span className="font-semibold whitespace-nowrap">
              {copy.dateVotes(voters.length)}
              {won && (
                <>
                  {" · "}
                  <span className="text-success-ink">{copy.wonTag}</span>
                </>
              )}
            </span>
          </span>
        </span>
      </span>
    </label>
  );
}
