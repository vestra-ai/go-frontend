"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import { useFrame } from "@/components/shell/FrameContext"
import { menuItemVariants } from "@/components/common/MenuItem"

import { Check, ChevronRight } from "@/components/icons/generated"

const menuContentClass =
  "z-50 w-[220px] overflow-hidden rounded-4xl bg-white p-0 text-ink shadow-pop outline-none duration-220 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-1.5 data-[side=top]:slide-in-from-bottom-1.5"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  container,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  const frame = useFrame()
  return (
    <DropdownMenuPrimitive.Portal
      data-slot="dropdown-menu-portal"
      container={container ?? frame}
      {...props}
    />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

// Portaled into #app-frame and kept inside the column (collision boundary = frame).
function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 8,
  collisionBoundary,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  const frame = useFrame()
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        collisionBoundary={collisionBoundary ?? frame}
        className={cn(
          "max-h-(--radix-dropdown-menu-content-available-height) origin-(--radix-dropdown-menu-content-transform-origin) overflow-y-auto",
          menuContentClass,
          className
        )}
        {...props}
      />
    </DropdownMenuPortal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

/**
 * A menu row. With `asChild`, the child (e.g. common/MenuItem) owns the styling.
 */
function DropdownMenuItem({
  className,
  variant,
  asChild,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> &
  VariantProps<typeof menuItemVariants>) {
  return (
    <DropdownMenuPrimitive.Item
      {...(asChild ? {} : { "data-slot": "menu-item" })}
      asChild={asChild}
      className={asChild ? className : cn(menuItemVariants({ variant }), className)}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="menu-item"
      className={cn(menuItemVariants({ variant: "menu" }), "relative pr-10", className)}
      checked={checked}
      {...props}
    >
      {children}
      <span
        className="pointer-events-none absolute right-3.5 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="size-4" strokeWidth={3} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="menu-item"
      className={cn(menuItemVariants({ variant: "menu" }), "relative pr-10", className)}
      {...props}
    >
      {children}
      <span
        className="pointer-events-none absolute right-3.5 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="size-4" strokeWidth={3} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn(
        "px-3.5 pt-3 pb-1 text-11 font-bold tracking-eyebrow text-muted",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("h-px bg-line", className)}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="menu-item"
      className={cn(menuItemVariants({ variant: "menu" }), className)}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto size-4 text-faint" strokeWidth={2.4} />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  collisionBoundary,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  const frame = useFrame()
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        collisionBoundary={collisionBoundary ?? frame}
        className={cn(
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          menuContentClass,
          className
        )}
        {...props}
      />
    </DropdownMenuPortal>
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
