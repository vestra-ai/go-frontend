import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type GlassIconButtonProps = Omit<React.ComponentProps<typeof Button>, "variant" | "size" | "children"> & {
  icon: ReactNode;
  /** Accessible name (icon-only button). */
  label: string;
};

/** 40px frosted round button over hero photos (back / share). Position it via className. */
export function GlassIconButton({ icon, label, ...props }: GlassIconButtonProps) {
  return (
    <Button variant="glass" size="icon-sm" aria-label={label} {...props}>
      {icon}
    </Button>
  );
}
