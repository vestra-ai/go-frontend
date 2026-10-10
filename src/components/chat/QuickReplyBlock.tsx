import { Eyebrow } from "@/components/common/Eyebrow";
import { Chip } from "@/components/ui/chip";

type QuickReplyBlockProps = {
  /** "TAP TO REPLY" */
  eyebrow: string;
  /** Emoji stays inline in the label, e.g. "🏖️ Beach". */
  chips: { label: string; onPress(): void }[];
};

/**
 * Tap-to-reply chips under Go's bubble (C2): one row that scrolls sideways, no scrollbar. The eyebrow and the first chip
 * line up with the bubble column (30px avatar + 8px gap = 38px in); the row itself runs to both edges of the screen
 * (`-mx-4` cancels the thread's 16px padding), so chips slide out past it instead of stopping at the padding.
 */
export function QuickReplyBlock({ eyebrow, chips }: QuickReplyBlockProps) {
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow tone="muted" className="ml-[38px]">
        {eyebrow}
      </Eyebrow>
      {/* The vertical padding (cancelled by the negative margin) leaves room for the focus ring, which overflow would clip. */}
      <div className="-mx-4 -my-1 flex gap-1.5 overflow-x-auto overscroll-x-contain py-1 pr-4 pl-[54px] scrollbar-none">
        {chips.map((chip) => (
          <Chip key={chip.label} type="button" size="lg" variant="outline" className="shrink-0" onClick={chip.onPress}>
            {chip.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
