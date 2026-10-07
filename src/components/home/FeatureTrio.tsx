import { EmojiTile } from "@/components/common/EmojiTile";

/** Three feature highlights under the Welcome copy. */
export function FeatureTrio({ items }: { items: { emoji: string; label: string }[] }) {
  return (
    <div className="relative mt-[22px] flex gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-1.5">
          <EmojiTile emoji={item.emoji} size={44} shape="rounded-2xl" tint="white" className="shadow-card" />
          <span className="text-center text-13 leading-[1.3] font-semibold text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
