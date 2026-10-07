import { EmojiTile } from "@/components/common/EmojiTile";
import { Card } from "@/components/ui/card";
import { crew } from "@/data/seed/copy";

/** Dashed "suggestions show up later" row under the invite card. */
export function SuggestionsPlaceholder() {
  return (
    <Card variant="dashed" radius="2xl" className="flex items-center gap-3 px-4 py-3.5">
      <EmojiTile emoji="👥" size={40} shape="circle" tint="white" />
      <div>
        <div className="text-15 leading-[1.3] font-semibold">{crew.suggestions.title}</div>
        <div className="text-13 text-muted">{crew.suggestions.sub}</div>
      </div>
    </Card>
  );
}
