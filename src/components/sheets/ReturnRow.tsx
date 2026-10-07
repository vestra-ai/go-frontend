import { ListRow } from "@/components/common/ListRow";
import { EmojiTile } from "@/components/common/EmojiTile";
import { Card } from "@/components/ui/card";

type ReturnRowProps = { emoji: string; title: string; sub: string };

/** Non-interactive return-flight summary under the boarding card (F-travel.md §1.4). */
export function ReturnRow({ emoji, title, sub }: ReturnRowProps) {
  return (
    <Card variant="shadow" radius="2xl">
      <ListRow
        className="px-3.5"
        leading={<EmojiTile emoji={emoji} size={40} shape="circle" className="text-[19px]" />}
        title={<span className="text-16 tracking-body leading-[1.3]">{title}</span>}
        sub={sub}
      />
    </Card>
  );
}
