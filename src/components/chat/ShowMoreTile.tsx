import { ArrowRight } from "@/components/icons/generated";
import { Card } from "@/components/ui/card";

type ShowMoreTileProps = {
  title: string;
  sub: string;
  onPress(): void;
};

/** 150px dashed tile closing a place/stay rail ("Show more places" / "Go has 6 more"). */
export function ShowMoreTile({ title, sub, onPress }: ShowMoreTileProps) {
  return (
    <Card
      asChild
      variant="dashed"
      radius="xl"
      className="flex w-[150px] shrink-0 snap-start cursor-pointer flex-col items-center justify-center gap-2 border-line-3 bg-white p-4 text-center transition-[scale,box-shadow] duration-160 ease-out active:scale-[0.97] active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]"
    >
      <button type="button" onClick={onPress}>
        <span className="flex size-11 items-center justify-center rounded-full bg-surface-2">
          <ArrowRight className="size-5" />
        </span>
        <span className="text-15 leading-[1.3] font-semibold">{title}</span>
        <span className="text-13 text-muted">{sub}</span>
      </button>
    </Card>
  );
}
