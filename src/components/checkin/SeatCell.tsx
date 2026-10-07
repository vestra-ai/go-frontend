import { Avatar } from "@/components/ui/avatar";
import { Toggle, toggleVariants } from "@/components/ui/toggle";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import { USERS } from "@/data/seed/users";
import type { Seat, UserId } from "@/data/types";

const aria = CHECKIN_COPY.seat.aria;

type SeatCellProps = {
  seat: Seat;
  selected: boolean;
  friendId: UserId;
  onPick: (id: string) => void;
};

/** One 40px seat. State precedence: selected > taken > paid > free; the friend's seat is a non-interactive image. */
export function SeatCell({ seat, selected, friendId, onPick }: SeatCellProps) {
  if (seat.state === "friend") {
    const friend = USERS[friendId];
    return (
      <span
        role="img"
        aria-label={aria.friend(seat.id)}
        className={toggleVariants({ variant: "seat", seatState: "friend" })}
      >
        <Avatar size={28} name={friend.name} src={friend.avatar} tone={friend.tone} />
      </span>
    );
  }

  const taken = seat.state === "taken";
  const state = selected ? "selected" : seat.state;
  const label = aria.seat(seat.id) + (taken ? aria.taken : seat.state === "paid" ? aria.paid : aria.free);

  return (
    <Toggle
      variant="seat"
      seatState={state}
      pressed={selected}
      aria-label={label}
      // Taken seats stay enabled so the tap still reaches onPick (toast); aria-disabled marks them for AT.
      aria-disabled={taken || undefined}
      onClick={() => onPick(seat.id)}
    >
      {selected ? seat.id : seat.state === "paid" ? "₹" : ""}
    </Toggle>
  );
}
