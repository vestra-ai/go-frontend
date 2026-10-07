import { GoBubble } from "@/components/chat/GoBubble";

type TravelAskBubbleProps = {
  text: string;
  cta: string;
  caption: string;
  /** Opens the `route` sheet. */
  onCta: () => void;
};

/** F1 Go ask: private "Add my travel details" CTA + caption (F-travel.md §1.3). */
export function TravelAskBubble({ text, cta, caption, onCta }: TravelAskBubbleProps) {
  return (
    <GoBubble maxWidth={80} cta={{ label: cta, onPress: onCta }} caption={caption}>
      {text}
    </GoBubble>
  );
}
