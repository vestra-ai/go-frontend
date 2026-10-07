"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"
import { useFrame } from "@/components/shell/FrameContext"

// Every drawer portals into #app-frame (FrameContext), never document.body, so the
// overlay and the sheet stay inside the 450px column. Overlay and content are
// `absolute` against the frame (which is `relative`), so containment does not rely
// on the frame's transform. `noBodyStyles`: the page never scrolls (globals), and
// vaul's iOS `position:fixed` body hack would collapse the h-full frame.
function Drawer({
  container,
  noBodyStyles = true,
  shouldScaleBackground = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  const frame = useFrame()
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      container={container ?? frame}
      noBodyStyles={noBodyStyles}
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

// Renders nothing until the frame element exists, so a sheet that is open on the
// first client render never flashes into document.body.
function DrawerPortal({
  container,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  const frame = useFrame()
  const target = container ?? frame
  if (!target) return null
  return <DrawerPrimitive.Portal data-slot="drawer-portal" container={target} {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn("absolute inset-0 z-30 bg-scrim", className)}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  overlayClassName,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  overlayClassName?: string
}) {
  return (
    <DrawerPortal>
      <DrawerOverlay className={overlayClassName} />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-8xl bg-canvas text-ink shadow-sheet outline-none",
          className
        )}
        {...props}
      >
        <span aria-hidden className="mx-auto mt-2 h-[5px] w-10 shrink-0 rounded-full bg-line-2" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-22 font-semibold tracking-h2", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-14 leading-[1.4] tracking-sm text-pretty text-muted", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
}
