import { cloneElement, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type GlassIconButtonProps = Omit<React.ComponentProps<typeof Button>, "variant" | "size" | "children"> & {
  icon: ReactNode;
  /** Accessible name (icon-only button). */
  label: string;
  /** With `asChild`, the single element to render as (e.g. a `<Link>`); `icon` becomes its content. */
  children?: ReactElement<{ children?: ReactNode }>;
};

/** 40px frosted round button over hero photos (back / share). Position it via className. */
export function GlassIconButton({ icon, label, asChild, children, ...props }: GlassIconButtonProps) {
  return (
    <Button variant="glass" size="icon-sm" aria-label={label} asChild={asChild} {...props}>
      {asChild && children ? cloneElement(children, undefined, icon) : icon}
    </Button>
  );
}
