"use client";

import { EmojiTile } from "@/components/common/EmojiTile";
import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { Switch } from "@/components/ui/switch";

export type SettingsRow = { id: string; emoji: string; title: string; sub: string } & (
  | { kind: "link"; href: string }
  | { kind: "action"; onPress: () => void }
  | { kind: "switch"; checked: boolean; onCheckedChange: (v: boolean) => void; label: string }
);

/** Profile settings rows: links and actions get a chevron, switch rows are inert apart from the Switch. */
export function SettingsList({ rows }: { rows: SettingsRow[] }) {
  return (
    <ListCard padding="rows">
      {rows.map((row) => {
        const common = {
          className: "py-[13px]",
          leading: <EmojiTile emoji={row.emoji} size={36} shape="circle" tint="surface-2" />,
          title: row.title,
          sub: row.sub,
        };
        switch (row.kind) {
          case "link":
            return <ListRow key={row.id} {...common} href={row.href} chevron />;
          case "action":
            return <ListRow key={row.id} {...common} onClick={row.onPress} chevron />;
          case "switch":
            return (
              <ListRow
                key={row.id}
                {...common}
                trailing={<Switch checked={row.checked} onCheckedChange={row.onCheckedChange} aria-label={row.label} />}
              />
            );
        }
      })}
    </ListCard>
  );
}
