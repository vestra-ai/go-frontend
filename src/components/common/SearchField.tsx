import * as React from "react"
import { Search, X } from "@/components/icons/generated"
import { InputField, type InputFieldProps } from "@/components/common/InputField"

type SearchFieldProps = Omit<InputFieldProps, "type" | "icon" | "trailing" | "shape"> & {
  /** Called when the clear button is pressed; the button shows only when `value` is non-empty. */
  onClear?: () => void
}

function SearchField({ value, onClear, ...props }: SearchFieldProps) {
  const showClear = Boolean(onClear) && String(value ?? "").length > 0

  return (
    <InputField
      shape="search"
      type="search"
      value={value}
      icon={<Search className="size-5" />}
      trailing={
        showClear ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={onClear}
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted"
          >
            <X className="size-3.5" strokeWidth={2.5} />
          </button>
        ) : undefined
      }
      {...props}
    />
  )
}

export { SearchField }
export type { SearchFieldProps }
