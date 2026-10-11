import { Spinner } from "@/components/icons/custom/Spinner";
import { Plus } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type HeroCardProps = {
  title: string;
  body: string;
  ctaLabel: string;
  onCta(): void;
  /** The trip is being created: the CTA shows a spinner. */
  ctaPending?: boolean;
  mascot: { src: string; alt: string };
};

/** First-run Home hero: Go mascot, headline and the Create-a-trip CTA. */
export function HeroCard({ title, body, ctaLabel, onCta, ctaPending = false, mascot }: HeroCardProps) {
  return (
    <Card
      variant="shadow"
      radius="4xl"
      className="relative flex flex-col gap-3.5 overflow-hidden bg-linear-to-b from-go-note to-white to-70% px-5 pt-[22px] pb-5"
    >
      <span aria-hidden className="absolute -top-[30px] -right-10 size-[210px] rounded-full border-[1.5px] border-dashed border-go-ring" />
      <span
        aria-hidden
        className="absolute top-1 -right-1.5 size-[140px] rounded-full bg-[radial-gradient(closest-side,var(--color-go-glow),rgb(251_233_226/0))]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG mascot */}
      <img src={mascot.src} alt={mascot.alt} className="absolute top-3.5 right-[34px] h-[132px] w-[58px]" />
      <h2 className="relative max-w-[230px] text-26 font-semibold tracking-[-0.022em] text-balance">{title}</h2>
      <p className="relative max-w-[240px] text-15 leading-[1.4] tracking-sub text-pretty text-muted">{body}</p>
      <div className="relative mt-1 flex flex-col gap-2">
        <Button variant="primary" size="xl" aria-busy={ctaPending} onClick={onCta}>
          {ctaPending ? <Spinner className="size-5 border-white/30 border-t-white border-r-white" /> : <Plus className="size-5" />}
          {ctaLabel}
        </Button>
      </div>
    </Card>
  );
}
