import { Chip } from "@/components/ui/chip";

type AmenityChipsProps = {
  /** Seed strings like "🏊 Private pool": split at the first space into the chip's emoji + label. */
  items: string[];
};

/** Wrapping row of non-interactive amenity chips (stay details sheet). */
export function AmenityChips({ items }: AmenityChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const space = item.indexOf(" ");
        return (
          <Chip key={item} size="sm" variant="plain" emoji={space > 0 ? item.slice(0, space) : undefined}>
            {space > 0 ? item.slice(space + 1) : item}
          </Chip>
        );
      })}
    </div>
  );
}
