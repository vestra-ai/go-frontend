import { Chip } from "@/components/ui/chip";

type FlexibleButtonProps = {
  pressed: boolean;
  /** off 'I’m flexible, any of these work' · on 'You’re flexible · any of these work' */
  labels: { off: string; on: string };
  onPress: () => void;
};

/** "🤷 I’m flexible" toggle under the dates poll: dashed when off, green when on (E5). */
export function FlexibleButton({ pressed, labels, onPress }: FlexibleButtonProps) {
  return (
    // Chip xl is the design's 42px / gap 8 / 14/600 "I’m flexible" size (PLAN §7.1).
    <Chip
      size="xl"
      variant={pressed ? "success" : "dashed"}
      pressed={pressed}
      emoji="🤷"
      className="mx-4 mt-1.5 mb-0.5 justify-center"
      onClick={onPress}
    >
      {pressed ? labels.on : labels.off}
    </Chip>
  );
}
