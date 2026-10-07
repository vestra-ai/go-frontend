import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingRowProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** 40px leading visual (avatar or composite emoji icon). */
  leading: React.ReactNode;
  title: string;
  sub: string;
  cta: { label: string; href: string };
};

/** One "Pending on you" row; place inside `ListCard padding="rows"` (divider from the second row on). */
export function PendingRow({ leading, title, sub, cta, className, ...props }: PendingRowProps) {
  return (
    <div
      data-slot="pending-row"
      className={cn("flex items-center gap-3 py-3 not-first:border-t not-first:border-line", className)}
      {...props}
    >
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-16 leading-[1.3] font-semibold tracking-body">{title}</span>
        <span className="text-13 tracking-caption text-muted">{sub}</span>
      </div>
      <Button variant="primary" size="sm" asChild className="px-[18px] tracking-h4">
        <Link href={cta.href}>{cta.label}</Link>
      </Button>
    </div>
  );
}
