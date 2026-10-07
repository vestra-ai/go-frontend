import Image from "next/image";
import { Eyebrow } from "@/components/common/Eyebrow";
import { Button } from "@/components/ui/button";

type PollRowProps = {
  emoji: string;
  eyebrow: string;
  value: string;
  sub: string;
  cta: string;
  options: { id: string; name: string; img: string; votes: number }[];
  /** Deep-links to the stay poll in the chat; no vote is cast here. */
  onAction: () => void;
};

export function PollRow({ emoji, eyebrow, value, sub, cta, options, onAction }: PollRowProps) {
  return (
    <div className="flex flex-col gap-2.5 pt-3 pb-3.5">
      <div className="flex items-center gap-3">
        <span aria-hidden className="w-5 shrink-0 text-center text-16 leading-none">
          {emoji}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Eyebrow tone="go">{eyebrow}</Eyebrow>
          <span className="text-16 leading-[1.3] font-semibold tracking-body">{value}</span>
          <span className="text-13 tracking-caption text-muted">{sub}</span>
        </div>
        <Button variant="primary" size="sm" className="h-[34px] px-[18px] tracking-h4" onClick={onAction}>
          {cta}
        </Button>
      </div>
      <div className="flex gap-1.5 pl-8">
        {options.map((o) => (
          <div key={o.id} className="flex flex-1 flex-col gap-1">
            <Image
              src={o.img}
              alt={o.name}
              width={160}
              height={52}
              className="h-[52px] w-full rounded-lg object-cover"
            />
            <span className="text-12 font-semibold">
              {o.name} · {o.votes}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
