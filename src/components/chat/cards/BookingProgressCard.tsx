"use client";

import { LiveDot } from "@/components/common/LiveDot";
import { SegmentedProgress } from "@/components/common/SegmentedProgress";
import { Expand, Lock } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type BookingProgressCardProps = {
  /** What Go is doing: 'Finding villas with a pool in North Goa'. */
  title: string;
  /** Go's buttons on the card (`watch`, `stop`), shown only to the people who may press them. */
  actions: Array<{ label: string; onPress: () => void }>;
  /** The page Go is on, when it sent a screenshot: its host, and the latest picture of its screen. */
  url?: string;
  screenshot?: string;
  /** The step Go is on, and the one before / after it. */
  line: string;
  lineSub: string;
  /** Steps done out of all steps. */
  steps: { filled: number; total: number };
  /** 'Working…' → 'Done' / 'Stopped'. */
  status: { text: string; tone: "muted" | "success" | "danger" };
  /** Go is still at it: the dot pulses. */
  live: boolean;
  /** Go's screen can be opened full height (its live stream, or the latest picture): the page panel becomes a button. */
  open?: { label: string; onPress: () => void };
};

const STATUS_TONE = { muted: "text-muted", success: "font-semibold text-success-ink", danger: "font-semibold text-danger" } as const;

/**
 * Go doing a longer job, step by step (the `working` card, CONTRACT-APP §5). Go replaces the card in place as steps
 * finish, so this draws whatever the card says now; the ticket and the expense that follow are messages of their own.
 */
export function BookingProgressCard({ title, actions, url, screenshot, line, lineSub, steps, status, live, open }: BookingProgressCardProps) {
  const Panel = open ? "button" : "div";
  return (
    <div className="mr-[30px] ml-[38px]">
      <Card variant="float" radius="2xl" className="flex flex-col gap-3 px-3.5 pt-3.5 pb-3">
        <div className="flex items-center gap-2">
          <LiveDot size={10} pulse={live} className="shadow-[0_0_0_4px_var(--color-success-soft)]" />
          <span className="flex-1 text-16 leading-[1.3] font-semibold tracking-body">{title}</span>
          {actions.map((action) => (
            <Button key={action.label} type="button" variant="link" className="h-auto px-0 text-14" onClick={action.onPress}>
              {action.label}
            </Button>
          ))}
        </div>
        <Panel
          {...(open ? { type: "button" as const, "aria-label": open.label, onClick: open.onPress } : {})}
          className={cn("flex flex-col overflow-hidden rounded-3xl border border-line text-left", open && "cursor-pointer")}
        >
          {url && (
            <div className="flex items-center gap-1.5 bg-surface-2 px-3 py-[7px] text-13 text-muted">
              <Lock className="size-[13px] shrink-0" />
              <span className="truncate">{url}</span>
            </div>
          )}
          <div className="flex gap-3 p-3">
            {screenshot && (
              // eslint-disable-next-line @next/next/no-img-element -- the latest picture of Go's screen, thumb
              <img src={screenshot} alt="" className="h-[52px] w-16 shrink-0 rounded-lg object-cover" />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-16 font-semibold">{line}</span>
              {lineSub && <span className="text-13 text-muted">{lineSub}</span>}
            </div>
            {open && <Expand className="size-4 shrink-0 self-center text-muted" />}
          </div>
        </Panel>
        <div className="flex items-center justify-between gap-2">
          <SegmentedProgress segments={Math.max(steps.total, 1)} filled={steps.filled} size="booking" tone="success" />
          <span aria-live="polite" className={cn("text-right text-13 tabular-nums", STATUS_TONE[status.tone])}>
            {status.text}
          </span>
        </div>
      </Card>
    </div>
  );
}
