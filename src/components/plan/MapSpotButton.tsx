import { cn } from "@/lib/utils";

// Viewbox of the GoaMap art (388×480); spot coordinates are in these units.
const VIEW_W = 388;
const VIEW_H = 480;

export interface MapSpotButtonProps {
  x: number;
  y: number;
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Avatar spots: the selected ring is drawn inside the map art (layered with the avatars), not on this button. */
  ringless?: boolean;
}

/** 44px transparent hit target over a map pin or route badge; a terracotta ring marks the selected spot. */
export function MapSpotButton({ x, y, label, selected, onPress, ringless = false }: MapSpotButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onPress}
      className={cn(
        "absolute z-1 size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-transparent p-0 transition-[scale,box-shadow] duration-160 ease-[var(--ease-out)] active:scale-[0.97]",
        ringless
          ? "border-0"
          : selected
            ? "border-[3px] border-go shadow-[0_0_0_4px_rgb(164_79_58/0.18)]"
            : "border-0 active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]",
      )}
      // DESIGN-ASSUMPTION (L-itinerary-map.md §1.6 #2): percentage centres so hit targets track the pins at any card width.
      style={{ left: `${(x / VIEW_W) * 100}%`, top: `${(y / VIEW_H) * 100}%` }}
    />
  );
}
