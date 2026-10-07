import { KVRow } from "@/components/common/KVRow";
import { ListCard } from "@/components/common/ListCard";

type FactRowsProps = {
  rows: { label: string; value: string }[];
};

/** Outlined label / value card (stay details: Dates, Total for 4, Your share, Cancellation). */
export function FactRows({ rows }: FactRowsProps) {
  return (
    <ListCard variant="outline" radius="lg" className="py-1">
      {rows.map((row) => (
        <KVRow key={row.label} label={row.label} value={row.value} size={14} />
      ))}
    </ListCard>
  );
}
