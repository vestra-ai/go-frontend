import { KVRow } from "@/components/common/KVRow";
import type { DetailRow } from "@/data/types";
import { cn } from "@/lib/utils";

type DetailsListProps = Omit<React.ComponentProps<"div">, "children"> & {
  rows: DetailRow[];
};

/** Grey label/value list of a booking (stay 6 rows, flights 5), in done rows and the Listen sheet (§1.2 E.1.3). */
export function DetailsList({ rows, className, ...props }: DetailsListProps) {
  return (
    <div data-slot="details-list" className={cn("rounded-3xl bg-canvas px-3 py-0.5", className)} {...props}>
      {rows.map((row) => (
        <KVRow key={row.label} label={row.label} value={row.value} className="py-[9px]" />
      ))}
    </div>
  );
}
