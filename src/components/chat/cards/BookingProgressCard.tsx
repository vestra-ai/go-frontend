"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Bubble } from "@/components/chat/Bubble";
import { LiveDot } from "@/components/common/LiveDot";
import { SegmentedProgress } from "@/components/common/SegmentedProgress";
import { Lock } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { paySheet } from "@/data/seed/copy";
import type { Stay } from "@/data/types";
import { BOOKING_SEQ } from "@/data/timing";
import { cn } from "@/lib/utils";
import { BookedTicketCard, type BookedTicketCardProps } from "./BookedTicketCard";
import { ReceiptCard, type ReceiptCardProps } from "./ReceiptCard";

// Sequence steps: step n means the first n BOOKING_SEQ offsets have fired (E-deciding.md §1.2 `book`).
const SEG4_FILLS = 1; // 1600 ms
const PAYING_LEAVES = 2; // 1800 ms
const PAID_ENTERS = 3; // 1900 ms
const CARD_LEAVES = 4; // 2700 ms
const STACK_SHRINKS = 5; // 2750 ms
const TICKET_ENTERS = 6; // 2850 ms
const FINAL = BOOKING_SEQ.length; // 3300 ms: 🎉, late bubble, receipt, completeBooking()

// Scale and translate only run with motion allowed; globals.css already cuts durations under reduced motion.
const popLate = "motion-safe:animate-[popIn_380ms_var(--ease-out)_both]";

type BookingProgressCardProps = {
  stay: Stay;
  copy: {
    title: string;
    watch: string;
    url: string;
    line: string;
    lineSub: string;
    cardLabel: string;
    amount: string;
    paying: string;
    paid: string;
  };
  ticket: Omit<BookedTicketCardProps, "showReaction">;
  late: { text: string; maxWidth: 64 };
  receipt: ReceiptCardProps;
  /** `stayBooking.done`: true renders the final state, static. */
  done: boolean;
  /** Toast "Opens Go’s live view of the checkout page". */
  onWatch: () => void;
  /** `completeBooking()`, called once at 3300 ms. */
  onComplete: () => void;
};

/**
 * E15 booking stack: the live checkout card fills its last segment, flips to "Paid", then cross-fades into the
 * BookedTicketCard; the 🎉, Go's "Split 4 ways" bubble and the receipt follow. Plays once per mount while !done.
 */
export function BookingProgressCard({
  stay,
  copy,
  ticket,
  late,
  receipt,
  done,
  onWatch,
  onComplete,
}: BookingProgressCardProps) {
  const [played, setPlayed] = useState(0);
  // A mount that starts done shows the final state with no animation.
  const [animated, setAnimated] = useState(!done);
  const [wasDone, setWasDone] = useState(done);
  if (done !== wasDone) {
    setWasDone(done);
    // Reset back to not-done (a preset) while mounted: replay from the start.
    if (!done) {
      setPlayed(0);
      setAnimated(true);
    }
  }
  const step = done ? FINAL : played;
  const complete = useEffectEvent(onComplete);

  useEffect(() => {
    if (done) return;
    const timers = BOOKING_SEQ.map((ms, i) =>
      setTimeout(() => {
        setPlayed(i + 1);
        if (i + 1 === FINAL) complete();
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [done]);

  const cardLeaving = step >= CARD_LEAVES;

  return (
    <div className="flex flex-col">
      {/* The stack shrinks to 106px (ticket 104 + 2); min-h keeps the static final state at the same height. */}
      <div
        className={cn(
          "mr-[30px] ml-[38px] grid motion-safe:transition-[max-height] motion-safe:duration-380 motion-safe:ease-out",
          step >= STACK_SHRINKS ? "max-h-[106px] min-h-[106px]" : "max-h-[330px]",
        )}
      >
        {/* Unmounted once its 280 ms fade is over; the ticket takes the same grid cell. */}
        {step < FINAL && (
          <Card
            variant="float"
            radius="2xl"
            inert={cardLeaving}
            className={cn(
              "flex flex-col gap-3 self-start px-3.5 pt-3.5 pb-3 transition-[opacity,scale] duration-280 ease-out [grid-area:1/1]",
              cardLeaving && "opacity-0 motion-safe:scale-[0.97]",
            )}
          >
            <div className="flex items-center gap-2">
              <LiveDot size={10} pulse className="shadow-[0_0_0_4px_var(--color-success-soft)]" />
              <span className="flex-1 text-16 leading-[1.3] font-semibold tracking-body">{copy.title}</span>
              <Button type="button" variant="link" className="h-auto px-0 text-14" onClick={onWatch}>
                {copy.watch}
              </Button>
            </div>
            <div className="overflow-hidden rounded-3xl border border-line">
              <div className="flex items-center gap-1.5 bg-surface-2 px-3 py-[7px] text-13 text-muted">
                <Lock className="size-[13px] shrink-0" />
                {copy.url}
              </div>
              <div className="flex flex-col gap-3 p-3">
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo, thumb */}
                  <img src={stay.img} alt={paySheet.cardImgAlt} className="h-[52px] w-16 shrink-0 rounded-lg object-cover" />
                  <div className="flex flex-col">
                    <span className="text-16 font-semibold">{copy.line}</span>
                    <span className="text-13 text-muted">{copy.lineSub}</span>
                  </div>
                </div>
                <div className="flex justify-between rounded-xl border-[1.5px] border-ink px-3 py-2.5 text-15 leading-[1.3] font-semibold tracking-sub tabular-nums">
                  <span>{copy.cardLabel}</span>
                  <span>{copy.amount}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <SegmentedProgress
                segments={4}
                filled={step >= SEG4_FILLS ? 4 : 3}
                size="booking"
                tone="success"
                segmentClassName={(i) => (i === 3 ? "duration-300 ease-out" : undefined)}
              />
              <div aria-live="polite" className="grid text-right text-13 tabular-nums">
                <span
                  aria-hidden={step >= PAYING_LEAVES}
                  className={cn(
                    "text-muted transition-[opacity,scale] duration-200 ease-out [grid-area:1/1]",
                    step >= PAYING_LEAVES && "opacity-0 motion-safe:scale-[0.97]",
                  )}
                >
                  {copy.paying}
                </span>
                <span
                  aria-hidden={step < PAID_ENTERS}
                  className={cn(
                    "font-semibold text-success-ink transition-opacity duration-200 ease-out [grid-area:1/1]",
                    step < PAID_ENTERS && "opacity-0",
                  )}
                >
                  {copy.paid}
                </span>
              </div>
            </div>
          </Card>
        )}
        {step >= TICKET_ENTERS && (
          <div className={cn("self-start [grid-area:1/1]", animated && "motion-safe:animate-pop")}>
            <BookedTicketCard {...ticket} showReaction={step >= FINAL} animate={animated} />
          </div>
        )}
      </div>
      {step >= FINAL && (
        <div className={cn("mt-2 flex flex-col gap-2.5", animated && popLate)}>
          <Bubble author="go" maxWidth={late.maxWidth}>
            {late.text}
          </Bubble>
          <ReceiptCard {...receipt} />
        </div>
      )}
    </div>
  );
}
