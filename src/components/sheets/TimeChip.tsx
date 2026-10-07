import { Chip } from "@/components/ui/chip";
import { timeChipLabel } from "@/lib/routes";

type TimeChipProps = {
  /** Committed slots (onward + return when round): solid when > 0. */
  count: number;
  /** Opens the nested Preferred times sheet. */
  onOpen: () => void;
};

/** "🕘 Time" / "🕘 Time · N" chip at the end of the route filter row. */
export function TimeChip({ count, onOpen }: TimeChipProps) {
  const label = timeChipLabel(count);
  const space = label.indexOf(" ");
  return (
    <Chip size="lg" pressed={count > 0} aria-haspopup="dialog" onClick={onOpen} className="transition-colors duration-160">
      {/* One flex child keeps the design's text spacing; the clock emoji is hidden from AT. */}
      <span>
        <span aria-hidden>{label.slice(0, space)}</span>
        {label.slice(space)}
      </span>
    </Chip>
  );
}
