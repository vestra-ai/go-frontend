import { Camera } from "@/components/icons/generated";
import { Toggle } from "@/components/ui/toggle";

type UploadTileProps = { title: string; sub: string; pressed: boolean; onPress: () => void };

/** Dashed upload tile; pressed turns green (the border stays dashed, G-bali.md §1.4). */
export function UploadTile({ title, sub, pressed, onPress }: UploadTileProps) {
  return (
    <Toggle
      variant="upload"
      pressed={pressed}
      onPressedChange={onPress}
      // Controlled by the store: the upload is one-way, so every tap (even when pressed) just fires onPress.
      className="flex-1"
    >
      <Camera className="size-[22px]" strokeWidth={2} />
      <span className="text-14 font-semibold">{title}</span>
      <span className="text-13 font-normal text-muted">{sub}</span>
    </Toggle>
  );
}
