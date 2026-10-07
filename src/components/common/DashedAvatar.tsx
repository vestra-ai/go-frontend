import { cn } from "@/lib/utils"
import { Avatar, type AvatarSize } from "@/components/ui/avatar"
import { Plus } from "@/components/icons/generated"

type DashedAvatarProps = Omit<React.ComponentProps<typeof Avatar>, "src" | "name" | "children" | "kind" | "tone"> & {
  size?: AvatarSize
}

function DashedAvatar({ size = 52, className, ...props }: DashedAvatarProps) {
  return (
    <Avatar
      size={size}
      className={cn("border-2 border-dashed border-line-3 bg-canvas", className)}
      {...props}
    >
      <Plus className="size-5 text-faint" strokeWidth={2} />
    </Avatar>
  )
}

export { DashedAvatar }
