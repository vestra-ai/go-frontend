import { Chip } from "@/components/ui/chip";
import { splitEmoji } from "@/lib/emoji";

type AmenityChipsProps = {
  /** Seed strings like "🏊 Private pool": split at the first space into the chip's emoji + label. */
  items: string[];
};

/** Wrapping row of non-interactive amenity chips (stay details sheet). */
export function AmenityChips({ items }: AmenityChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const { emoji, label } = splitEmoji(item);
        return (
          <Chip key={item} size="sm" variant="plain" emoji={emoji || undefined}>
            {label}
          </Chip>
        );
      })}
    </div>
  );
}
