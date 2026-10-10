"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

const segmentedListVariants = cva("flex items-center", {
  variants: {
    variant: {
      hero: "gap-0.5 rounded-full bg-white p-[5px] shadow-tabs",
      compact: "gap-1 rounded-full bg-surface-2 p-1",
      contained: "gap-1 rounded-full border border-line bg-white p-1",
      icon: "w-fit gap-0.5 rounded-full border border-line bg-white p-1",
      scope: "w-fit gap-0.5 rounded-full bg-white/92 p-1 shadow-[0_2px_10px_rgb(11_27_63/0.12)]",
      separated: "gap-1.5",
    },
  },
  defaultVariants: { variant: "hero" },
})

const segmentedItemVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full outline-none transition-[background-color,color,border-color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // min-w-0 + light padding: the row must shrink to the phone (the trip tabs overflowed their pill below ~360px).
        hero: "h-[42px] min-w-0 flex-1 px-1.5 text-15 font-semibold",
        compact: "h-9 min-w-0 flex-1 px-1.5 text-14 font-semibold",
        contained: "h-10 flex-1 px-3 text-15 font-semibold",
        icon: "size-10",
        scope: "h-[34px] px-3 text-13 font-semibold",
        separated: "h-10 flex-1 border border-line-2 bg-white px-3 text-15 font-semibold",
      },
      active: {
        true: "bg-black text-white",
        false: "bg-transparent text-muted",
      },
    },
    compoundVariants: [
      { variant: "separated", active: true, className: "border-black" },
      { variant: "separated", active: false, className: "bg-white" },
    ],
    defaultVariants: { variant: "hero", active: false },
  }
)

type SegmentedVariant = NonNullable<
  VariantProps<typeof segmentedListVariants>["variant"]
>

type SegmentedControlContextValue = {
  variant: SegmentedVariant
  value: string
  tab: boolean
}

const SegmentedControlContext =
  React.createContext<SegmentedControlContextValue>({
    variant: "hero",
    value: "",
    tab: false,
  })

type SegmentedControlProps = Omit<
  React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
  "type" | "value" | "defaultValue" | "onValueChange" | "role"
> & {
  variant?: SegmentedVariant
  /** `tablist` for Everyone/Just me; `radiogroup` (default) for trip type, mode, view, map area. */
  role?: "radiogroup" | "tablist"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

function SegmentedControl({
  className,
  variant = "hero",
  role = "radiogroup",
  value: valueProp,
  defaultValue = "",
  onValueChange,
  children,
  ...props
}: SegmentedControlProps) {
  const [inner, setInner] = React.useState(defaultValue)
  const value = valueProp ?? inner

  return (
    <ToggleGroupPrimitive.Root
      type="single"
      role={role}
      data-slot="segmented-control"
      data-variant={variant}
      value={value}
      onValueChange={(next) => {
        // a segmented control always has a selection; ignore re-tap deselect
        if (!next) return
        setInner(next)
        onValueChange?.(next)
      }}
      className={cn(segmentedListVariants({ variant }), className)}
      {...props}
    >
      <SegmentedControlContext.Provider
        value={{ variant, value, tab: role === "tablist" }}
      >
        {children}
      </SegmentedControlContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function SegmentedControlItem({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const ctx = React.useContext(SegmentedControlContext)
  const active = ctx.value === value

  return (
    <ToggleGroupPrimitive.Item
      value={value}
      data-slot="segmented-control-item"
      className={cn(segmentedItemVariants({ variant: ctx.variant, active }), className)}
      {...(ctx.tab
        ? { role: "tab", "aria-selected": active, "aria-checked": undefined }
        : {})}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export {
  SegmentedControl,
  SegmentedControlItem,
  segmentedListVariants,
  segmentedItemVariants,
}
