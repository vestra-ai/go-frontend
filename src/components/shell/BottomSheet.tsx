"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { Lock, X } from "@/components/icons/generated";
import { FadeDock } from "@/components/shell/FadeDock";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/** Height of the design artboards; sheet `top` values are measured on it. */
const DESIGN_FRAME_HEIGHT = 912;
/** Every sheet leaves at least this much of the screen above it (PLAN §4). */
const MIN_TOP = 96;

type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The sheet's `top` on the 912px design artboard (96, 150, 342, …) — pass the
   * artboard value, never a frame-derived one. The sheet gets the design height
   * (912 − top), clamped to the frame: `min(912 − top, frame − 96)`. Omit for a
   * content-height sheet.
   */
  top?: number;
  /** Content-height sheets only: an extra cap in px (Preferred times = 760). */
  maxHeight?: number;
  /** false: no drag-to-dismiss, scrim tap or Escape. */
  dismissible?: boolean;
  /**
   * Stacks above another open sheet (time sheet over route sheet, share sheet). Opens one frame after `open`,
   * so it stays on top even when the parent opens in the same commit.
   */
  nested?: boolean;
  /** Accessible name when there is no SheetHeader (the design's dialog aria-label). */
  "aria-label"?: string;
  className?: string;
  children: ReactNode;
};

// vaul drawer in the overlay layer: scrim + sheet are portaled into the 450px column by ui/drawer.
export function BottomSheet({
  open,
  onOpenChange,
  top,
  maxHeight,
  dismissible = true,
  nested = false,
  "aria-label": ariaLabel,
  className,
  children,
}: BottomSheetProps) {
  // A nested sheet rendered inside its parent registers its focus/dismiss layer first when both open in one
  // commit (child effects run first), so the parent's layer would leave it aria-hidden and pointer-events:none.
  // Opening it a frame later puts its layer on top; closing stays immediate.
  const [layered, setLayered] = useState(false);
  useEffect(() => {
    if (!nested) return;
    const frame = requestAnimationFrame(() => setLayered(open));
    return () => cancelAnimationFrame(frame);
  }, [nested, open]);

  const style =
    top !== undefined
      ? { height: `min(${DESIGN_FRAME_HEIGHT - top}px, 100% - ${MIN_TOP}px)` }
      : maxHeight !== undefined
        ? { maxHeight: `min(${maxHeight}px, 100% - ${MIN_TOP}px)` }
        : undefined;

  return (
    <Drawer open={nested ? open && layered : open} onOpenChange={onOpenChange} dismissible={dismissible}>
      <DrawerContent
        aria-label={ariaLabel}
        overlayClassName={nested ? "z-40" : undefined}
        className={cn(top === undefined && "max-h-[calc(100%-96px)]", nested && "z-40", className)}
        style={style}
      >
        {children}
      </DrawerContent>
    </Drawer>
  );
}

type SheetHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Slot before the title (e.g. the inviter's 36px avatar). */
  leading?: ReactNode;
  /** Renders the 40px white close button (closes via onOpenChange(false)). */
  close?: boolean;
  closeLabel?: string;
  className?: string;
};

export function SheetHeader({
  title,
  subtitle,
  leading,
  close = true,
  closeLabel = "Close",
  className,
}: SheetHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-0.5 px-1", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {leading}
          <DrawerTitle>{title}</DrawerTitle>
        </div>
        {close && (
          <DrawerClose asChild>
            <Button variant="white" size="icon-sm" aria-label={closeLabel} className="-mr-1.5">
              <X className="size-[18px]" />
            </Button>
          </DrawerClose>
        )}
      </div>
      {subtitle && <DrawerDescription>{subtitle}</DrawerDescription>}
    </div>
  );
}

/** The sheet's scroll region. Leaves room under the absolute footer via pb. */
export function SheetBody({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pt-2 pb-[120px] scrollbar-none *:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

/** Sticky footer: gradient from transparent to canvas at 35%, CTA column. */
export function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return <FadeDock variant="gradient" className={cn("gap-2.5 px-4 pt-10", className)} {...props} />;
}

/** Lock + 13px muted line under a footer CTA. */
export function TrustLine({ className, children, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("flex items-center gap-1.5 self-center text-13 tracking-caption text-muted", className)}
      {...props}
    >
      <Lock className="size-[13px] shrink-0" />
      {children}
    </p>
  );
}
