import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const rightClass = {
  16: "mr-4",
  22: "mr-[22px]",
  30: "mr-[30px]",
} as const;

type InChatCardProps = React.ComponentProps<"div"> & {
  /** Right margin in px: 16 (default), 22 (plan card), 30 (booking progress). */
  right?: keyof typeof rightClass;
};

/** White shell for every Go card in the thread, inset 38px to the bubble column. Padding/layout via className. */
export function InChatCard({ right = 16, className, ...props }: InChatCardProps) {
  return <Card variant="float" radius="2xl" className={cn("ml-[38px] overflow-hidden", rightClass[right], className)} {...props} />;
}
