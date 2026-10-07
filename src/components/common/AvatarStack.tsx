import { cn } from "@/lib/utils"
import { Avatar, avatarSizes, type AvatarSize, type AvatarTone } from "@/components/ui/avatar"

const overlapMap = {
  5: "-ml-[5px]",
  6: "-ml-[6px]",
  7: "-ml-[7px]",
  8: "-ml-2",
  12: "-ml-3",
} as const

type StackAvatar = {
  name: string
  src?: string
  tone?: AvatarTone
  kind?: "user" | "go" | "trip"
  /** Fallback text instead of the initials derived from `name`. */
  initials?: string
}

type AvatarStackProps = Omit<React.ComponentProps<"div">, "children"> & {
  avatars: StackAvatar[]
  size?: AvatarSize
  overlap?: keyof typeof overlapMap
  /** Show at most this many avatars, then a "+N" count. */
  max?: number
  ring?: "none" | "white" | "white-thin" | "black"
  /** Earlier avatars sit on top of later ones. */
  reverse?: boolean
}

function AvatarStack({
  avatars,
  size = 28,
  overlap = 8,
  max,
  ring = "white",
  reverse = false,
  className,
  ...props
}: AvatarStackProps) {
  const shown = max === undefined ? avatars : avatars.slice(0, max)
  const extra = avatars.length - shown.length
  const total = shown.length + (extra > 0 ? 1 : 0)
  const layer = (i: number) => (reverse ? total - i : i)

  return (
    <div data-slot="avatar-stack" className={cn("flex items-center", className)} {...props}>
      {shown.map((a, i) => (
        <Avatar
          key={`${a.name}-${i}`}
          size={size}
          ring={ring}
          tone={a.tone}
          kind={a.kind}
          initials={a.initials}
          src={a.src}
          name={a.name}
          className={cn(i > 0 && overlapMap[overlap])}
          style={{ zIndex: layer(i) }}
        />
      ))}
      {extra > 0 && (
        <span
          aria-label={`${extra} more`}
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-semibold text-muted tabular-nums",
            avatarSizes[size],
            ring === "white" && "border-2 border-white",
            ring === "white-thin" && "border-[1.5px] border-white",
            ring === "black" && "border-2 border-black",
            overlapMap[overlap]
          )}
          style={{ zIndex: layer(shown.length) }}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}

export { AvatarStack, type StackAvatar }
