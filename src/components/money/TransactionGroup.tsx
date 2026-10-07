import { Eyebrow } from "@/components/common/Eyebrow";
import { Card } from "@/components/ui/card";
import type { Transaction } from "@/data/types";
import { TransactionRow } from "./TransactionRow";

type TransactionGroupProps = {
  /** Date label, e.g. "16 Oct"; shown uppercase. */
  label: string;
  rows: Transaction[];
};

/** One date's transactions: eyebrow label over a card of rows (no per-row date). */
export function TransactionGroup({ label, rows }: TransactionGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow className="px-1 pt-1.5">{label.toUpperCase()}</Eyebrow>
      <Card variant="shadow" radius="2xl" className="px-3.5 py-0.5">
        {rows.map((tx, i) => (
          <TransactionRow key={tx.id} tx={tx} showDate={false} first={i === 0} />
        ))}
      </Card>
    </div>
  );
}
