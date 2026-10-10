import { Eyebrow } from "@/components/common/Eyebrow";
import { SeatCell } from "@/components/checkin/SeatCell";
import type { CheckIn, SeatCol, User } from "@/data/types";

const colHead = "w-10 text-center text-12 font-bold text-muted";

type SeatMapProps = {
  /** The airline's own layout: columns either side of the aisle, the rows, and each seat's state. */
  checkin: Pick<CheckIn, "seats" | "rows" | "colsLeft" | "colsRight" | "frontLabel">;
  selected: string;
  friendSeat: string;
  friend: User | null;
  onPick: (id: string) => void;
};

/** Front-of-plane label, the column letters and one row per seat row; the aisle column carries the row number. */
export function SeatMap({ checkin, selected, friendSeat, friend, onPick }: SeatMapProps) {
  const { seats, rows, colsLeft, colsRight, frontLabel } = checkin;
  const cells = (row: number, cols: SeatCol[]) => (
    <div className="flex gap-1.5">
      {cols.map((col) => {
        const seat = seats.find((s) => s.row === row && s.col === col);
        // A gap in the airline's map (an exit row, a missing seat) keeps its slot.
        if (!seat) return <span key={col} aria-hidden className="size-10" />;
        return <SeatCell key={seat.id} seat={seat} selected={seat.id === selected && seat.id !== friendSeat} friend={friend} onPick={onPick} />;
      })}
    </div>
  );
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow className="self-center">{frontLabel}</Eyebrow>
      <div aria-hidden className="flex justify-center gap-1.5">
        {colsLeft.map((c) => (
          <span key={c} className={colHead}>
            {c}
          </span>
        ))}
        <span className="w-7" />
        {colsRight.map((c) => (
          <span key={c} className={colHead}>
            {c}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row} className="flex items-center justify-center gap-1.5">
          {cells(row, colsLeft)}
          <span className="w-7 text-center text-12 font-bold text-faint tabular-nums">{row}</span>
          {cells(row, colsRight)}
        </div>
      ))}
    </div>
  );
}
