"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import { useFrame } from "@/components/shell/FrameContext"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

// Icon-button labels on hover (fine pointers; Radix skips touch). Portaled into #app-frame,
// collision boundary = frame.
function TooltipContent({
  className,
  sideOffset = 4,
  collisionBoundary,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const frame = useFrame()
  return (
    <TooltipPrimitive.Portal container={frame}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionBoundary={collisionBoundary ?? frame}
        className={cn(
          "z-50 w-fit max-w-[240px] origin-(--radix-tooltip-content-transform-origin) rounded-lg bg-ink px-2.5 py-1.5 text-13 font-medium text-white data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-ink" width={10} height={5} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
