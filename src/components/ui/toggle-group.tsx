"use client"

import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  Pick<VariantProps<typeof toggleVariants>, "variant">
>({
  variant: "chip",
})

function ToggleGroup({
  className,
  variant = "chip",
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  Pick<VariantProps<typeof toggleVariants>, "variant">) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  Pick<VariantProps<typeof toggleVariants>, "variant">) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        toggleVariants({ variant: variant ?? context.variant }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
