import { Spinner } from "@/components/icons/custom/Spinner";
import { Eye, Lock } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PrivateTeaserCardProps = {
  label: string;
  lines: string[];
  cta: string;
  onView: () => void;
  /** The press is on its way to Go: the button shows a spinner until Go answers. */
  pending?: boolean;
};

/** F6 "only you can see this" teaser: blurred lines + CTA that opens the private sheet (F-travel.md §1.4). */
export function PrivateTeaserCard({ label, lines, cta, onView, pending }: PrivateTeaserCardProps) {
  return (
    <Card variant="dashed" radius="2xl" className="ml-[38px] mr-4 flex flex-col gap-2.5 border-line-3 bg-white p-3.5">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-ink text-white">
          <Lock className="size-3.5" strokeWidth={2} />
        </span>
        <span className="flex-1 text-13 font-bold tracking-tag text-ink">{label}</span>
      </div>
      <div aria-hidden className="flex flex-col gap-2 blur-[5px] select-none">
        {lines.map((line) => (
          <span key={line} className="text-15 font-semibold">
            {line}
          </span>
        ))}
      </div>
      <Button type="button" variant="primary" className="h-[46px] px-[18px] text-15 leading-[1.3] tracking-h4" aria-busy={pending} onClick={onView}>
        {pending ? <Spinner className="size-[18px] border-white/30 border-t-white border-r-white" /> : <Eye className="size-[18px]" strokeWidth={2} />}
        {cta}
      </Button>
    </Card>
  );
}
