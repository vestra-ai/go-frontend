"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { Check } from "@/components/icons/generated"

const radioIndicatorVariants = cva(
  "peer relative flex shrink-0 items-center justify-center rounded-full border-2 border-line-3 bg-white outline-none transition-[border-width,background-color,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        ring: "size-[22px] data-[state=checked]:border-[7px] data-[state=checked]:border-success",
        check:
          "size-[26px] text-white data-[state=checked]:border-success data-[state=checked]:bg-success",
      },
    },
    defaultVariants: { variant: "ring" },
  }
)

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  variant = "ring",
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> &
  VariantProps<typeof radioIndicatorVariants>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      data-variant={variant}
      className={cn(radioIndicatorVariants({ variant }), className)}
      {...props}
    >
      {variant === "check" && (
        <RadioGroupPrimitive.Indicator
          data-slot="radio-group-indicator"
          className="flex items-center justify-center"
        >
          <Check className="size-4" strokeWidth={3.2} />
        </RadioGroupPrimitive.Indicator>
      )}
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem, radioIndicatorVariants }
