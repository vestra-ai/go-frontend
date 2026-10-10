import { Eyebrow } from "@/components/common/Eyebrow";
import { Card } from "@/components/ui/card";

/** One itinerary day: eyebrow label ("FRI 6 NOV") over its timeline rows. */
export function DayCard({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card variant="shadow" radius="2xl" className="p-[12px_14px_8px_4px]">
      <Eyebrow tone="muted" className="pb-1 pl-3">
        {label}
      </Eyebrow>
      {children}
    </Card>
  );
}
