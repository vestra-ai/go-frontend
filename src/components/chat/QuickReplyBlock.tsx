import { Eyebrow } from "@/components/common/Eyebrow";
import { Chip } from "@/components/ui/chip";

type QuickReplyBlockProps = {
  /** "TAP TO REPLY" */
  eyebrow: string;
  /** Emoji stays inline in the label, e.g. "🏖️ Beach". */
  chips: { label: string; onPress(): void }[];
};

/** Tap-to-reply chips under Go's bubble, inset to the bubble column (C2). */
export function QuickReplyBlock({ eyebrow, chips }: QuickReplyBlockProps) {
  return (
    <div className="ml-[38px] flex flex-col gap-2">
      <Eyebrow tone="muted">{eyebrow}</Eyebrow>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Chip key={chip.label} type="button" size="lg" variant="outline" onClick={chip.onPress}>
            {chip.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
