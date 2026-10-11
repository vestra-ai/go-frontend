import { Spinner } from "@/components/icons/custom/Spinner";
import { ChevronRight } from "@/components/icons/generated";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { assets } from "@/lib/assets";

type AskGoRowProps = { title: string; sub: string; onPress(): void; pending?: boolean };

/** "Not sure where? Ask Go" row under the ideas carousel. Starts a trip and opens its chat: a spinner takes the chevron's place meanwhile. */
export function AskGoRow({ title, sub, onPress, pending = false }: AskGoRowProps) {
  return (
    <Card
      asChild
      variant="shadow"
      radius="2xl"
      className="flex cursor-pointer items-center gap-3 px-3.5 py-3 text-left transition-[transform,box-shadow] duration-160 active:scale-[0.97] active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]"
    >
      <button type="button" aria-busy={pending} onClick={onPress}>
        <Avatar size={40} kind="go" src={assets.goAvatar.src} />
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-16 leading-[1.3] font-semibold tracking-body">{title}</span>
          <span className="text-13 tracking-caption text-muted">{sub}</span>
        </span>
        {pending ? (
          <Spinner className="size-4 border-line-2 border-t-ink border-r-ink" />
        ) : (
          <ChevronRight className="size-4 text-faint" strokeWidth={2.4} />
        )}
      </button>
    </Card>
  );
}
