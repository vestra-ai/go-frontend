import { Note } from "@/components/ui/alert";
import { CheckBadge } from "@/components/common/CheckBadge";
import { cn } from "@/lib/utils";

type OutcomeBannerProps = Omit<React.ComponentProps<typeof Note>, "children" | "variant" | "icon"> & {
  headline: string;
  body: string;
};

/** Green outcome note at the top of the recording sheet: check + headline, then the detail line (§1.4). */
export function OutcomeBanner({ headline, body, className, ...props }: OutcomeBannerProps) {
  return (
    <Note
      variant="green"
      data-slot="outcome-banner"
      className={cn("flex-col items-stretch gap-2 rounded-6xl px-4 py-3.5", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        <CheckBadge size={22} />
        <span className="text-16 font-semibold">{headline}</span>
      </div>
      <p className="text-14 leading-[1.45]">{body}</p>
    </Note>
  );
}
