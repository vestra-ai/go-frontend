import { ChevronDown } from "@/components/icons/generated";
import { StickyDock } from "@/components/shell/StickyDock";
import { Button } from "@/components/ui/button";

type NewMessagesPillProps = {
  /** "3 new messages" */
  label: string;
  /** Matches the thread's bottom padding (the composer or the tray), so the pill rides just above it. */
  bottomPadding: number;
  onPress(): void;
};

// Rises in on mount, like the thread's own pills.
const pillClass =
  "pointer-events-auto gap-1 pr-3 pl-3.5 shadow-pill transition-[scale,translate,box-shadow,opacity] duration-220 ease-out starting:translate-y-1.5 starting:opacity-0";

/**
 * A thin navy pill floating above the composer: "↓ 3 new messages", shown while the reader is up the thread and newer
 * messages arrived. Tapping it takes them to the end.
 */
export function NewMessagesPill({ label, bottomPadding, onPress }: NewMessagesPillProps) {
  return (
    <StickyDock>
      <div
        className="pointer-events-none absolute inset-x-0 flex justify-center"
        // 12px of the composer's gradient pad sits under the pill; a tall bottom inset lifts it with the composer.
        style={{ bottom: `calc(${bottomPadding - 12}px + var(--dock-rise))` }}
      >
        <Button type="button" variant="navy" size="xs" weight="semibold" className={pillClass} onClick={onPress}>
          {label}
          <ChevronDown className="size-3.5" strokeWidth={2.6} />
        </Button>
      </div>
    </StickyDock>
  );
}
