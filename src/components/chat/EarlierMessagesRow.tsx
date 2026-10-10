import { ChevronDown } from "@/components/icons/generated";
import { Spinner } from "@/components/icons/custom/Spinner";
import { Button } from "@/components/ui/button";

type EarlierMessagesRowProps = {
  /** "Show earlier messages" */
  label: string;
  /** The page above is on its way: the arrow becomes a spinner. The button stays live (a repeat tap is the caller's no-op). */
  loading: boolean;
  onPress(): void;
};

/** Top of the thread: a Go-coloured "↑ Show earlier messages" link centred between two hairlines. */
export function EarlierMessagesRow({ label, loading, onPress }: EarlierMessagesRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="h-px flex-1 bg-line" />
      <Button type="button" variant="link" size="sm" className="gap-1.5 px-2" aria-busy={loading} onClick={onPress}>
        {/* One 16px slot for both, so swapping the arrow for the spinner does not shift the label. */}
        <span aria-hidden className="flex size-4 items-center justify-center">
          {loading ? (
            <Spinner aria-hidden role="presentation" className="size-3.5 border-go/25 border-t-go border-r-go" />
          ) : (
            <ChevronDown className="size-4 rotate-180" strokeWidth={2.4} />
          )}
        </span>
        {label}
      </Button>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}
