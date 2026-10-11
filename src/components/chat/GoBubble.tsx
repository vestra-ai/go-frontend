import type { ReactNode } from "react";
import { Spinner } from "@/components/icons/custom/Spinner";
import { Lock } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import type { BubbleMaxWidth } from "@/data/types";
import { Bubble } from "./Bubble";

type GoBubbleProps = {
  children: ReactNode;
  maxWidth?: BubbleMaxWidth;
  /** Full-width black CTA under the text (budget / travel / visa asks). `pending`: the press is on its way, so the lock becomes a spinner. */
  cta?: { label: string; onPress(): void; pending?: boolean };
  /** Terracotta line under the CTA, e.g. "Only you and Go see what you add". */
  caption?: string;
};

/** Go bubble with an optional embedded CTA + caption (E-deciding.md §1.3, F-travel.md §1.3, G-bali.md §1.3). */
export function GoBubble({ children, maxWidth, cta, caption }: GoBubbleProps) {
  const hasFooter = Boolean(cta || caption);

  return (
    <Bubble
      author="go"
      maxWidth={maxWidth}
      // Design: padding 8 8 10 14, gap 6, text and caption padded 6 on the right.
      className={hasFooter ? "gap-1.5 pt-2 pr-2 pb-2.5 pl-3.5" : undefined}
      bodyClassName={hasFooter ? "pr-1.5" : undefined}
      footer={
        hasFooter && (
          <>
            {cta && (
              // Every in-bubble ask is a private input, so the CTA always leads with the lock (as designed).
              <Button type="button" variant="primary" size="base" weight="semibold" className="mt-1 gap-1.5" aria-busy={cta.pending} onClick={cta.onPress}>
                {cta.pending ? <Spinner className="size-[15px] border-white/30 border-t-white border-r-white" /> : <Lock className="size-[15px]" />}
                {cta.label}
              </Button>
            )}
            {caption && <span className="pr-1.5 text-12 leading-[1.35] text-go">{caption}</span>}
          </>
        )
      }
    >
      {children}
    </Bubble>
  );
}
