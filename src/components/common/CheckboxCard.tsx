"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

type CheckboxCardProps = Omit<React.ComponentProps<typeof Checkbox>, "title"> & {
  title: React.ReactNode
  sub?: React.ReactNode
}

function CheckboxCard({ title, sub, id, className, ...props }: CheckboxCardProps) {
  const autoId = React.useId()
  const checkboxId = id ?? autoId

  return (
    <label
      htmlFor={checkboxId}
      data-slot="checkbox-card"
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-4xl border border-line bg-white p-[14px_16px]",
        className
      )}
    >
      <Checkbox id={checkboxId} {...props} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-15 font-semibold tracking-sub text-ink">{title}</span>
        {sub && <span className="text-13 tracking-caption text-muted">{sub}</span>}
      </span>
    </label>
  )
}

export { CheckboxCard }
export type { CheckboxCardProps }
