import { GoBubble } from "@/components/chat/GoBubble";

type BudgetAskBubbleProps = {
  /** "\n" = line break (blank line before "@Aarav please set this"); the @mention is highlighted like any other. */
  text: string;
  /** 'Add my budget' */
  cta: string;
  /** 'Only you and Go see what you add' */
  caption: string;
  /** Opens the budget sheet. */
  onCta: () => void;
};

/** E6 Go budget ask: GoBubble at max 80% with the lock CTA and the terracotta caption. */
export function BudgetAskBubble({ text, cta, caption, onCta }: BudgetAskBubbleProps) {
  return (
    <GoBubble maxWidth={80} cta={{ label: cta, onPress: onCta }} caption={caption}>
      {text}
    </GoBubble>
  );
}
