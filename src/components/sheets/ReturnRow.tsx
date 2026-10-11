import { ListRow } from "@/components/common/ListRow";
import { EmojiTile } from "@/components/common/EmojiTile";
import { FileText } from "@/components/icons/generated";
import { Card } from "@/components/ui/card";

type ReturnRowProps = {
  emoji: string;
  title: string;
  sub: string;
  /** The way back has its own e-ticket: the row is then the button that opens it. */
  open?: { label: string; onPress: () => void };
};

/** Return-flight summary under the boarding card (F-travel.md §1.4). A tap opens the return leg's e-ticket, when there is one. */
export function ReturnRow({ emoji, title, sub, open }: ReturnRowProps) {
  return (
    <Card variant="shadow" radius="2xl" className="overflow-hidden">
      <ListRow
        className="px-3.5"
        leading={<EmojiTile emoji={emoji} size={40} shape="circle" className="text-[19px]" />}
        titleSize={16}
        title={title}
        sub={sub}
        {...(open ? { onClick: open.onPress, "aria-label": open.label, trailing: <FileText aria-hidden className="size-4 shrink-0 text-muted" />, chevron: true } : {})}
      />
    </Card>
  );
}
