import { Plus } from "@/components/icons/generated";
import { Card } from "@/components/ui/card";
import { CALL_COPY } from "@/data/seed/calls";

type AddCallTileProps = {
  /** → `openForm()`. */
  onPress(): void;
};

/** 150px dashed tile closing the call carousel: "Ask Go to make another call" (§1.2 C.3). */
export function AddCallTile({ onPress }: AddCallTileProps) {
  return (
    <Card
      asChild
      variant="dashed"
      radius="2xl"
      className="flex w-[150px] shrink-0 snap-start cursor-pointer flex-col items-center justify-center gap-2 p-4 transition-[scale,box-shadow] duration-160 ease-out active:scale-[0.97] active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]"
    >
      <button type="button" onClick={onPress}>
        <span className="grid size-11 place-items-center rounded-full bg-white shadow-card">
          <Plus className="size-5" />
        </span>
        <span className="text-center text-14 leading-[1.3] font-semibold">{CALL_COPY.card.another}</span>
      </button>
    </Card>
  );
}
