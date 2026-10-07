import * as React from "react"
import { cn } from "@/lib/utils"
import { Input, inputShellVariants, type InputShape } from "@/components/ui/input"

type InputFieldProps = Omit<React.ComponentProps<"input">, "size"> & {
  shape?: Exclude<InputShape, "inline">
  /** Eyebrow caption above the field. */
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  /** Leading icon inside the field. */
  icon?: React.ReactNode
  /** Trailing slot inside the field (clear x, call button...). */
  trailing?: React.ReactNode
  /** Classes for the outer wrapper. */
  wrapperClassName?: string
}

function InputField({
  shape = "field",
  label,
  hint,
  error,
  icon,
  trailing,
  id,
  className,
  wrapperClassName,
  ...props
}: InputFieldProps) {
  const autoId = React.useId()
  const inputId = id ?? autoId
  const describedBy = error || hint ? `${inputId}-desc` : undefined
  const hasSlots = Boolean(icon || trailing)

  return (
    <div data-slot="input-field" className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-11 font-bold uppercase tracking-eyebrow text-muted"
        >
          {label}
        </label>
      )}
      {hasSlots ? (
        <div
          className={cn(
            inputShellVariants({ shape }),
            error && "border-danger focus-within:border-danger"
          )}
        >
          {icon && <span className="flex shrink-0 text-muted">{icon}</span>}
          <Input
            id={inputId}
            shape="inline"
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={className}
            {...props}
          />
          {trailing}
        </div>
      ) : (
        <Input
          id={inputId}
          shape={shape}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={className}
          {...props}
        />
      )}
      {(error || hint) && (
        <p
          id={describedBy}
          className={cn("text-13 tracking-caption", error ? "text-danger" : "text-muted")}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export { InputField }
export type { InputFieldProps }
