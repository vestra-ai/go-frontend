"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Slider as SliderPrimitive } from "radix-ui"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  minStepsBetweenThumbs = 1,
  thumbLabels,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  /** Accessible name per thumb, e.g. ["Minimum budget", "Maximum budget"]. */
  thumbLabels?: string[]
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      minStepsBetweenThumbs={minStepsBetweenThumbs}
      className={cn(
        "relative flex h-11 w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1 w-full grow overflow-hidden rounded-full bg-line"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-black select-none"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={thumbLabels?.[index]}
          className="block size-7 shrink-0 rounded-full border-2 border-black bg-white shadow-thumb outline-none select-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
