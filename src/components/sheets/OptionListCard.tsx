import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type OptionListCardProps = {
  children: ReactNode;
};

/** White list card with hairlines between option rows (route and cab sheets). */
export function OptionListCard({ children }: OptionListCardProps) {
  return (
    <Card variant="float-sm" radius="2xl" className="divide-y divide-line overflow-hidden">
      {children}
    </Card>
  );
}
