import { Avatar } from "@/components/ui/avatar";
import { Toggle, toggleVariants } from "@/components/ui/toggle";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import type { Seat, User } from "@/data/types";

const aria = CHECKIN_COPY.seat.aria;

type SeatCellProps = {
  seat: Seat;
  selected: boolean;
  /** Who sits in a `friend` seat (the companion on the same booking). */
  friend: User | null;
  onPick: (id: string) => void;
};

/** One 40px seat. State precedence: selected > taken > paid > free; the friend's seat is a non-interactive image. */
export function SeatCell({ seat, selected, friend, onPick }: SeatCellProps) {
  if (seat.state === "friend") {
    return (
      <span
        role="img"
        aria-label={aria.friend(seat.id, friend?.firstName ?? "")}
        className={toggleVariants({ variant: "seat", seatState: "friend" })}
      >
        {friend && <Avatar size={28} name={friend.name} src={friend.avatar} tone={friend.tone} />}
      </span>
    );
  }

  const taken = seat.state === "taken";
  const state = selected ? "selected" : seat.state;
  const label = aria.seat(seat.id) + (taken ? aria.taken : seat.state === "paid" ? aria.paid(seat.price ?? "") : aria.free);

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
