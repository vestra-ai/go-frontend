import Link from "next/link";
import { ChevronRight } from "@/components/icons/generated";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { assets } from "@/lib/assets";

type AskGoRowProps = { title: string; sub: string; href: string };

/** "Not sure where? Ask Go" row under the ideas carousel. */
export function AskGoRow({ title, sub, href }: AskGoRowProps) {
  return (
    <Card
      asChild
      variant="shadow"
      radius="2xl"
      className="flex items-center gap-3 px-3.5 py-3 transition-[transform,box-shadow] duration-160 active:scale-[0.97] active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]"
    >
      <Link href={href}>
        <Avatar size={40} kind="go" src={assets.goAvatar.src} />
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-16 leading-[1.3] font-semibold tracking-body">{title}</span>
          <span className="text-13 tracking-caption text-muted">{sub}</span>
        </span>
        <ChevronRight className="size-4 text-faint" strokeWidth={2.4} />
      </Link>
    </Card>
  );
}
