import { MenuItem } from "@/components/common/MenuItem";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { chat as copy } from "@/data/seed/copy";
import { assets } from "@/lib/assets";
import type { MentionItem } from "@/lib/mentions";
import { cn } from "@/lib/utils";

type MentionSuggestionsProps = {
  /** The listbox id; a row is `${id}-${index}` (the input's `aria-activedescendant`). */
  id: string;
  items: MentionItem[];
  /** Index of the highlighted row. */
  active: number;
  onPick(item: MentionItem): void;
  /** Where it sits above its input (the caller's wrapper is the positioned ancestor). */
  className?: string;
};

/** The "@" list above a message input: Go, then the people in the trip. Rows are picked by tap, or Enter on the highlighted one. */
export function MentionSuggestions({ id, items, active, onPick, className }: MentionSuggestionsProps) {
  return (
    <div
      id={id}
      role="listbox"
      aria-label={copy.mention.label}
      className={cn("absolute z-10 max-h-[220px] overflow-y-auto overscroll-contain rounded-4xl bg-white shadow-pop scrollbar-none", className)}
      // A tap on a row must not take the focus (and the keyboard) away from the input.
      onMouseDown={(e) => e.preventDefault()}
    >
      {items.map((item, i) => (
        <MenuItem
          key={item.id}
          id={`${id}-${i}`}
          role="option"
          aria-selected={i === active}
          tabIndex={-1}
          data-highlighted={i === active ? "" : undefined}
          ref={i === active ? (row) => row?.scrollIntoView({ block: "nearest" }) : undefined}
          icon={
            item.user ? (
              <Avatar size={28} tone={item.user.tone} src={item.user.avatar}>
                <AvatarFallback>{item.user.initials}</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar kind="go" size={28} src={assets.goAvatar.src} />
            )
          }
          label={<span className="truncate">{item.name}</span>}
          onClick={() => onPick(item)}
        />
      ))}
    </div>
  );
}
