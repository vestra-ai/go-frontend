import Link from "next/link";
import { Eyebrow } from "@/components/common/Eyebrow";
import { LiveDot } from "@/components/common/LiveDot";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { paySheet } from "@/data/seed/copy";
import type { User } from "@/data/types";

export type ReceiptCardProps = {
  /** 'ADDED TO TRIP MONEY' */
  label: string;
  /** 'Villa Sol · 3 nights', rahul, '₹43,200' */
  item: { title: string; payer: User; amount: string };
  /** '₹10,800 each · split 4 ways' */
  split: string;
  /** 'Fix split' */
  cta: string;
  /** '/trips/goa/expenses' */
  href: string;
};

/** E15 trip-money receipt with scalloped edges: the villa line item, the split and "Fix split". */
export function ReceiptCard({ label, item, split, cta, href }: ReceiptCardProps) {
  return (
    <div className="mr-[30px] ml-[38px] drop-shadow-[0_4px_10px_rgb(11_27_63/0.07)]">
      <div className="flex flex-col gap-2.5 bg-white px-3.5 py-[18px] mask-scallop">
        <Eyebrow size={12} className="px-0.5">
          {label}
        </Eyebrow>
        <div className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-3.5 py-3">
          <LiveDot size={8} pulse={false} />
          <span className="flex-1 text-16 leading-[1.35] font-medium tracking-body">{item.title}</span>
          {/* DESIGN-ASSUMPTION (PLAN §12.1 #7): the payer is always Rahul, so the alt is the design's literal. */}
          <Avatar
            size={24}
            src={item.payer.avatar}
            name={paySheet.receiptPayerAlt}
            initials={item.payer.initials}
            tone={item.payer.tone}
          />
          <span className="text-16 font-semibold tabular-nums">{item.amount}</span>
        </div>
        <div className="flex items-center justify-between px-0.5">
          <span className="text-14 text-muted tabular-nums">{split}</span>
          <Button asChild variant="tint" size="sm">
            <Link href={href}>{cta}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
