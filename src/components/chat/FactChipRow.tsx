import { Chip } from "@/components/ui/chip";
import type { ChipKey } from "@/data/types";

export interface FactChipData {
  key: ChipKey;
  emoji: string;
  /** Unset: the question ("Where?"). Set: the value ("Goa"); the ✓ is the chip's CheckBadge. */
  label: string;
  state: "unset" | "set";
  /** Its sheet is open: 2px black ring + 600. A set chip keeps its check. */
  active?: boolean;
  onPress(): void;
}

type FactChipRowProps = {
  /** Always where, when, stay, budget, from. */
  chips: FactChipData[];
};

/** Trip-facts chips under the chat header row. */
export function FactChipRow({ chips }: FactChipRowProps) {
  return (
    <div className="mt-3.5 flex gap-2 overflow-x-auto overscroll-x-contain px-5 scrollbar-none">
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          type="button"
          size="md"
          variant={chip.active ? "active" : "outline"}
          emoji={chip.emoji}
          check={chip.state === "set"}
          className="shrink-0"
          onClick={chip.onPress}
        >
          {chip.label}
        </Chip>
      ))}
    </div>
  );
}
