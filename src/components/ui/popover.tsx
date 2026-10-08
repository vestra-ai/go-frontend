"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import { useFrame } from "@/components/shell/FrameContext"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

// Portaled into the overlay layer and kept inside the column (collision boundary = layer).
function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  collisionBoundary,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const frame = useFrame()
  return (
    <PopoverPrimitive.Portal container={frame}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionBoundary={collisionBoundary ?? frame}
        className={cn(
          "z-50 w-[220px] origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-4xl bg-white p-0 text-ink shadow-pop outline-none duration-220 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-1.5 data-[side=top]:slide-in-from-bottom-1.5",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
