import * as React from "react"
import { Search, X } from "@/components/icons/generated"
import { InputField, type InputFieldProps } from "@/components/common/InputField"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SearchFieldProps = Omit<InputFieldProps, "type" | "icon" | "trailing" | "shape"> & {
  /** Called when the clear button is pressed; the button shows only when `value` is non-empty. */
  onClear?: () => void
}

/** Search-shaped InputField: 18px search icon, 36px clear button. Name it with `label` (eyebrow) or `srLabel`. */
function SearchField({ value, onClear, shellClassName, ...props }: SearchFieldProps) {
  const showClear = Boolean(onClear) && String(value ?? "").length > 0

  return (
    <InputField
      shape="search"
      type="search"
      value={value}
      icon={<Search className="size-[18px]" />}
      shellClassName={cn("pr-2", shellClassName)}
      trailing={
        showClear ? (
          <Button
            type="button"
            variant="soft"
            size="icon-xs"
            aria-label="Clear search"
            onClick={onClear}
            className="text-muted"
          >
            <X className="size-3.5" />
          </Button>
        ) : undefined
      }
      {...props}
    />
  )
}

export { SearchField }
export type { SearchFieldProps }
