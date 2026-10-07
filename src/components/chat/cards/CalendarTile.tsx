type CalendarTileProps = {
  /** 'NOV' */
  month: string;
  /** '6–9' */
  range: string;
};

/** 46px tear-off calendar: black month band over the day range (E5 poll rows). */
export function CalendarTile({ month, range }: CalendarTileProps) {
  return (
    <span className="flex w-[46px] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-tile">
      <span className="flex h-4 items-center justify-center bg-calendar text-9 font-bold tracking-eyebrow text-white">
        {month}
      </span>
      <span className="flex h-7 items-center justify-center text-13 font-bold tabular-nums">{range}</span>
    </span>
  );
}
