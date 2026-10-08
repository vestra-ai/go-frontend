"use client";

import { Eyebrow } from "@/components/common/Eyebrow";
import { Chip } from "@/components/ui/chip";

type ChoiceChipGroupProps<T extends string> = {
  /** Eyebrow text and the group's aria-label. */
  label: string;
  options: readonly { id: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  /** Pressing the selected chip clears it. */
  allowDeselect?: boolean;
};

/** Single-select chip row under an eyebrow (Quick start vibe / spend). One line: it scrolls sideways, edge to edge, like the city strip. */
export function ChoiceChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  allowDeselect = false,
}: ChoiceChipGroupProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <Eyebrow className="px-1">{label}</Eyebrow>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto overscroll-x-contain px-4 scrollbar-none">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <Chip
              key={o.id}
              size="lg"
              pressed={on}
              onClick={() => onChange(on && allowDeselect ? null : o.id)}
              className="shrink-0 transition-colors duration-160"
            >
              {o.label}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
