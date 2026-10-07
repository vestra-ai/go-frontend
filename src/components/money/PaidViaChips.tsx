import { Chip } from "@/components/ui/chip";
import { MONEY_COPY, PAYMENT_METHODS } from "@/data/seed/money";
import type { PaymentMethod } from "@/data/types";

type PaidViaChipsProps = {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
};

/** Record-payment "Paid via" radio group: UPI · Cash · Bank transfer · Other. */
export function PaidViaChips({ value, onChange }: PaidViaChipsProps) {
  return (
    <div role="radiogroup" aria-label={MONEY_COPY.recordSheet.paidViaLabel} className="flex flex-wrap gap-2">
      {PAYMENT_METHODS.map((m) => {
        const selected = m === value;
        return (
          <Chip
            key={m}
            size="lg"
            role="radio"
            aria-checked={selected}
            variant={selected ? "solid" : "outline"}
            className={selected ? undefined : "border-0 shadow-[inset_0_0_0_1px_var(--color-line-2)]"}
            onClick={() => onChange(m)}
          >
            {m}
          </Chip>
        );
      })}
    </div>
  );
}
