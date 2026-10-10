"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/common/Eyebrow";
import { InputField } from "@/components/common/InputField";
import { PaidViaChips } from "@/components/money/PaidViaChips";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage, newKey } from "@/api/http";
import { MONEY_COPY } from "@/data/seed/money";
import type { PaymentMethod, User } from "@/data/types";
import { inr } from "@/lib/format";
import { toastGo } from "@/lib/toast";
import { recordPayment } from "@/state";
import { METHOD_TO_API } from "@/state/moneyView";
import { toMinor } from "@/state/view";

const copy = MONEY_COPY.recordSheet;

/** Digits only, at most 6, grouped en-IN ("5800" -> "5,800"); empty stays empty. */
const formatAmount = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  return digits ? Number(digits).toLocaleString("en-IN") : "";
};
const toNumber = (formatted: string) => Number(formatted.replace(/\D/g, "")) || 0;

/** Whom the payment goes to and what I owe them right now (a transfer from `GET …/money`). */
export interface RecordTarget {
  tripId: string;
  me: User;
  payee: User;
  /** Whole rupees. */
  owed: number;
  currency: string;
}

type RecordPaymentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kept by the caller while the sheet animates out. */
  target: RecordTarget | null;
};

/** Record a payment you made outside Go (CONTRACT-APP §4.9). Content mounts per open, so the form resets each time. */
export function RecordPaymentSheet({ open, onOpenChange, target }: RecordPaymentSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={120} aria-label={copy.title}>
      {target && <RecordPaymentForm target={target} onDone={() => onOpenChange(false)} />}
    </BottomSheet>
  );
}

function RecordPaymentForm({ target, onDone }: { target: RecordTarget; onDone: () => void }) {
  const { me, payee } = target;
  // Frozen at open so the status line does not jump while the sheet animates out after recording.
  const [owed] = useState(target.owed);
  const [amount, setAmount] = useState(() => formatAmount(String(Math.round(owed))));
  const [via, setVia] = useState<PaymentMethod>("UPI");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  // One key for this form: a second tap, or a retry after a dropped answer, records the payment once (§1.4).
  const [key] = useState(newKey);
  const n = toNumber(amount);

  const record = async () => {
    if (pending || n === 0) return;
    setPending(true);
    try {
      const trimmed = note.trim();
      await recordPayment(
        target.tripId,
        {
          to_person_id: payee.id,
          amount_minor: toMinor(n),
          currency: target.currency,
          method: METHOD_TO_API[via as keyof typeof METHOD_TO_API] ?? "other",
          ...(trimmed ? { note: trimmed.slice(0, 120) } : {}),
        },
        key,
      );
      toastGo(copy.recorded(payee.firstName));
      onDone();
    } catch (err) {
      setPending(false);
      toastGo(errorMessage(err, copy.failed));
    }
  };

  return (
    <>
      <SheetBody className="pb-[150px]">
        <SheetHeader title={copy.title} subtitle={copy.sub} />
        <Card variant="float-sm" radius="2xl" className="flex flex-col items-center gap-3.5 border border-line px-4 py-[18px]">
          <div className="flex items-center gap-2.5 self-stretch">
            <div className="flex flex-col items-center gap-1">
              <Avatar size={48} name={me.name} src={me.avatar} tone={me.tone} />
              <span className="text-13 font-semibold">{copy.you}</span>
            </div>
            <span aria-hidden className="mb-5 h-0.5 flex-1 bg-line-2" />
            <div className="flex flex-col items-center gap-1">
              <Avatar size={48} name={payee.name} src={payee.avatar} tone={payee.tone} />
              <span className="text-13 font-semibold">{payee.firstName}</span>
            </div>
          </div>
          <label htmlFor="ramt" className="flex items-baseline gap-1">
            <span aria-hidden className="text-30 font-bold text-muted">
              {copy.currency}
            </span>
            <span className="sr-only">{copy.amountLabel}</span>
            <Input
              id="ramt"
              shape="bare"
              type="text"
              inputMode="numeric"
              value={amount}
              placeholder="0"
              onChange={(e) => setAmount(formatAmount(e.target.value))}
            />
          </label>
          <span className="text-13 text-muted">{n >= owed ? copy.settles(payee.firstName) : copy.left(inr(owed - n))}</span>
        </Card>
        <Eyebrow className="px-1">{copy.paidVia}</Eyebrow>
        <PaidViaChips value={via} onChange={setVia} />
        <InputField
          shape="field"
          id="rnote"
          label={copy.noteLabel}
          placeholder={copy.notePlaceholder}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </SheetBody>
      <SheetFooter>
        <Button variant="primary" size="xl" className="w-full" disabled={n === 0 || pending} aria-busy={pending} onClick={record}>
          {copy.cta(amount || "0")}
        </Button>
        <p className="flex items-center gap-1.5 self-center text-13 text-muted">
          <Avatar size={18} name={payee.name} src={payee.avatar} tone={payee.tone} />
          {copy.helper(payee.firstName)}
        </p>
      </SheetFooter>
    </>
  );
}
