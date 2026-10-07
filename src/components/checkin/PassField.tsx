import { Eyebrow } from "@/components/common/Eyebrow";
import { cn } from "@/lib/utils";

const alignClass = {
  start: "items-start text-left",
  center: "items-center text-center",
  end: "items-end text-right",
} as const;

type PassFieldProps = {
  /** Typed uppercase (PASSENGER, SEAT…). */
  label: string;
  value: string;
  align?: keyof typeof alignClass;
  className?: string;
};

/** One boarding-pass cell: 11/700 eyebrow label over a 17/700 value. */
export function PassField({ label, value, align = "start", className }: PassFieldProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-0.5", alignClass[align], className)}>
      <Eyebrow>{label}</Eyebrow>
      <span className="text-17 font-bold tabular-nums">{value}</span>
    </div>
  );
}
