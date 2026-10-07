"use client"

import { Avatar } from "@/components/ui/avatar"
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control"
import { AvatarStack } from "@/components/common/AvatarStack"
import { scopeToggle } from "@/data/seed/copy"
import type { User } from "@/data/types"

export type ScopeValue = "everyone" | "me"

type ScopeToggleProps = Omit<
  React.ComponentProps<typeof SegmentedControl>,
  "value" | "onValueChange" | "variant" | "role" | "defaultValue"
> & {
  value: ScopeValue
  onValueChange: (value: ScopeValue) => void
  /** Avatars shown beside "Everyone" (the other members). */
  others: User[]
  /** Avatar shown beside "Just me". */
  me: User
}

/** Everyone / Just me tablist; `aria-label` defaults to "Whose plan" (Expenses passes "Whose view"). */
function ScopeToggle({
  value,
  onValueChange,
  others,
  me,
  "aria-label": ariaLabel = scopeToggle.label,
  ...props
}: ScopeToggleProps) {
  return (
    <SegmentedControl
      variant="contained"
      role="tablist"
      aria-label={ariaLabel}
      value={value}
      onValueChange={(v) => onValueChange(v as ScopeValue)}
      {...props}
    >
      <SegmentedControlItem value="everyone">
        <AvatarStack
          size={20}
          overlap={7}
          ring="white"
          avatars={others.map((u) => ({ name: u.name, src: u.avatar, tone: u.tone }))}
        />
        {scopeToggle.everyone}
      </SegmentedControlItem>
      <SegmentedControlItem value="me">
        <Avatar size={22} name={me.name} src={me.avatar} tone={me.tone} />
        {scopeToggle.me}
      </SegmentedControlItem>
    </SegmentedControl>
  )
}

export { ScopeToggle }
