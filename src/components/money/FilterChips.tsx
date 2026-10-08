import { Chip } from "@/components/ui/chip";
import { MONEY_COPY } from "@/data/seed/money";

export type TransactionFilter = "all" | "booking" | "payback" | "mine";

type FilterChipsProps = {
  value: TransactionFilter;
  onChange: (value: TransactionFilter) => void;
  /** Total transactions, for the "All n" label. */
  count: number;
};

const T = MONEY_COPY.transactions;

/** Transactions page filter row: All n · Bookings · Paybacks · Mine. */
export function FilterChips({ value, onChange, count }: FilterChipsProps) {
  const options: { value: TransactionFilter; label: string }[] = [
    { value: "all", label: T.filters.all(count) },
    { value: "booking", label: T.filters.booking },
    { value: "payback", label: T.filters.payback },
    { value: "mine", label: T.filters.mine },
  ];
  return (
    <div role="group" aria-label={T.filterLabel} className="flex gap-1.5 overflow-x-auto overscroll-x-contain px-4 scrollbar-none">
      {options.map((o) => (
        <Chip
          key={o.value}
          size="lg"
          variant={o.value === value ? "solid" : "outline"}
          aria-pressed={o.value === value}
          className="shrink-0"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Chip>
      ))}
    </div>
  );
}
