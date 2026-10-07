import { GoBubble } from "../GoBubble";

type VisaAskBubbleProps = {
  text: string;
  cta: string;
  caption: string;
  onCta: () => void;
};

/** G2 Go ask: "Add my passport details" opens the visa sheet (G-bali.md §1.3). */
export function VisaAskBubble({ text, cta, caption, onCta }: VisaAskBubbleProps) {
  return (
    <GoBubble maxWidth={80} cta={{ label: cta, onPress: onCta }} caption={caption}>
      <span className="text-16 leading-[1.4] tracking-body text-pretty whitespace-pre-line">{text}</span>
    </GoBubble>
  );
}
