import { buttonVariants } from "@/components/ui/button";

type CheckinPreviewLinkProps = {
  emoji: string;
  title: string;
  sub: string;
  cta: string;
  /** → `previewCheckin()` + `toggleRow(null)` + scroll to top (K1). */
  onPreview(): void;
};

/** "Web check-in opens Wed 4 Nov · Preview" row in the opened Flights done row (§1.2 E.1.2). */
export function CheckinPreviewLink({ emoji, title, sub, cta, onPreview }: CheckinPreviewLinkProps) {
  return (
    <button
      type="button"
      data-slot="checkin-preview-link"
      onClick={onPreview}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-3xl bg-go-note px-3 py-2.5 text-left transition-[scale] duration-160 ease-out active:scale-[0.985]"
    >
      <span aria-hidden className="text-18 leading-none">
        {emoji}
      </span>
      <span className="flex flex-1 flex-col gap-px">
        <span className="text-14 font-semibold">{title}</span>
        <span className="text-13 tracking-caption text-muted">{sub}</span>
      </span>
      {/* A styled span, not a nested button: the whole row is the control. */}
      <span className={buttonVariants({ variant: "tint", size: "2xs" })}>{cta}</span>
    </button>
  );
}
