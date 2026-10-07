import type { ComponentProps } from "react";
import { ProgressiveBlur } from "@/components/common/ProgressiveBlur";
import { cn } from "@/lib/utils";

const variantClass = {
  /** Sheet footers, chat composer: canvas from 35%. */
  gradient: "bg-linear-to-b from-canvas/0 to-canvas to-35%",
  /** App-home bottom fade: canvas from 70%. */
  fade: "bg-linear-to-b from-canvas/0 to-canvas to-70%",
  /** B1/B6 dock: progressive blur (3/8/18px) under a canvas tint. */
  blur: "",
} as const;

type FadeDockProps = ComponentProps<"div"> & {
  variant?: keyof typeof variantClass;
};

// Absolute bottom dock inside the nearest positioned ancestor. The dock itself lets
// taps through; its children (CTAs) take pointer events and stack above the fade layers.
export function FadeDock({ variant = "gradient", className, children, ...props }: FadeDockProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 flex flex-col pb-safe [&>:not([data-fade-layer])]:pointer-events-auto [&>:not([data-fade-layer])]:relative",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {variant === "blur" && (
        <>
          <ProgressiveBlur layers="dock" data-fade-layer="" />
          <span
            aria-hidden
            data-fade-layer=""
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-canvas/0 via-canvas/80 via-60% to-canvas"
          />
        </>
      )}
      {children}
    </div>
  );
}
