"use client";

import { useRouter } from "next/navigation";
import { EmojiTile } from "@/components/common/EmojiTile";
import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PRESETS, type PresetGroup } from "@/data/presets";
import { prototype as copy } from "@/data/seed/copy";
import { useStore } from "@/store";

const GROUPS = [...new Set(PRESETS.map((p) => p.group))] as PresetGroup[];

/** Profile-bottom demo tools (PLAN §9.6): reset the demo, jump to any of the 72 artboards. */
export function PrototypeControls() {
  const router = useRouter();
  const applyPreset = useStore((s) => s.applyPreset);
  const resetDemo = useStore((s) => s.resetDemo);

  return (
    <div className="mt-6 flex flex-col gap-2.5">
      <SectionHeader title={copy.title} meta={copy.meta} />
      <ListCard padding="rows">
        <ListRow
          className="py-[13px]"
          leading={<EmojiTile emoji={copy.reset.emoji} size={36} shape="circle" tint="surface-2" />}
          title={copy.reset.title}
          sub={copy.reset.sub}
          chevron
          onClick={() => {
            resetDemo();
            router.replace("/");
          }}
        />
        <div className="relative border-t border-line">
          <ListRow
            className="py-[13px]"
            leading={<EmojiTile emoji={copy.jump.emoji} size={36} shape="circle" tint="surface-2" />}
            title={copy.jump.title}
            sub={copy.jump.sub}
            chevron
          />
          <select
            aria-label={copy.jump.title}
            value=""
            onChange={(e) => {
              if (e.target.value) router.replace(applyPreset(e.target.value));
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          >
            <option value="" disabled />
            {GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {PRESETS.filter((p) => p.group === group).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} · {p.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </ListCard>
    </div>
  );
}
