import { Button } from "@/components/ui/button";

type SuggestionStripProps = {
  emoji: string;
  text: string;
  cta: string;
  /** Opens the `cab` sheet. */
  onAction: () => void;
};

/** Grey strip under the who-lands rows: 🚕 "You and Arjun land together. Share a cab?" + tint "Book". */
export function SuggestionStrip({ emoji, text, cta, onAction }: SuggestionStripProps) {
  return (
    <div className="mx-4 mt-0.5 flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2.5 text-14 leading-[1.35]">
      <span aria-hidden className="w-[18px] shrink-0 text-15">
        {emoji}
      </span>
      <span className="flex-1">{text}</span>
      <Button type="button" variant="tint" size="2xs" className="px-[14px] tracking-sm" onClick={onAction}>
        {cta}
      </Button>
    </div>
  );
}
