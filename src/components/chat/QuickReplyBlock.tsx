import { ArrowRight } from "@/components/icons/generated";
import { Chip } from "@/components/ui/chip";

type QuickReplyBlockProps = {
  /** Emoji stays inline in the label, e.g. "🏖️ Beach". */
  chips: { label: string; onPress(): void }[];
};

/**
 * Tap-to-reply chips under Go's bubble (C2): one row that scrolls sideways, no scrollbar. The first chip lines up with
 * the bubble column (30px avatar + 8px gap = 38px in); the row itself runs to both edges of the screen (`-mx-4` cancels
 * the thread's 16px padding), so chips slide out past it instead of stopping at the padding.
 */
export function QuickReplyBlock({ chips }: QuickReplyBlockProps) {
  return (
    // The vertical padding (cancelled by the negative margin) leaves room for the focus ring, which overflow would clip.
    <div className="-mx-4 -my-1 flex gap-1.5 overflow-x-auto overscroll-x-contain py-1 pr-4 pl-[54px] scrollbar-none">
      {chips.map((chip) => (
        <Chip
          key={chip.label}
          type="button"
          size="lg"
          variant="outline"
          // 32px tall with a 1px grey border (the outline variant's lighter hairline, darkened), and a trailing Go-coloured arrow.
          className="h-8 shrink-0 gap-2 border-line-4"
          onClick={chip.onPress}
        >
          {chip.label}
          <ArrowRight className="size-4 text-go" strokeWidth={2.4} />
        </Chip>
      ))}
    </div>
  );
}
