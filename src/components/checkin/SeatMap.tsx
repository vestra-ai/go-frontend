import { Eyebrow } from "@/components/common/Eyebrow";
import { SeatCell } from "@/components/checkin/SeatCell";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import type { Seat, SeatCol, UserId } from "@/data/types";

const LEFT: SeatCol[] = ["A", "B", "C"];
const RIGHT: SeatCol[] = ["D", "E", "F"];
const colHead = "w-10 text-center text-12 font-bold text-muted";

type SeatMapProps = {
  seats: Seat[];
  selected: string;
  friendSeat: string;
  friendId: UserId;
  onPick: (id: string) => void;
};

/** Front-of-plane label, A B C · D E F header and one row per seat row; the aisle column carries the row number. */
export function SeatMap({ seats, selected, friendSeat, friendId, onPick }: SeatMapProps) {
  const rows = [...new Set(seats.map((s) => s.row))].sort((a, b) => a - b);
  const cells = (row: number, cols: SeatCol[]) => (
    <div className="flex gap-1.5">
      {cols.map((col) => {
        const seat = seats.find((s) => s.row === row && s.col === col)!;
        return (
          <SeatCell
            key={seat.id}
            seat={seat}
            selected={seat.id === selected && seat.id !== friendSeat}
            friendId={friendId}
            onPick={onPick}
          />
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <Eyebrow className="self-center">{CHECKIN_COPY.seat.front}</Eyebrow>
      <div aria-hidden className="flex justify-center gap-1.5">
        {LEFT.map((c) => (
          <span key={c} className={colHead}>
            {c}
          </span>
        ))}
        <span className="w-7" />
        {RIGHT.map((c) => (
          <span key={c} className={colHead}>
            {c}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row} className="flex items-center justify-center gap-1.5">
          {cells(row, LEFT)}
          <span className="w-7 text-center text-12 font-bold text-faint tabular-nums">{row}</span>
          {cells(row, RIGHT)}
        </div>
      ))}
    </div>
  );
}
