import { Avatar } from "@/components/ui/avatar"
import { Note } from "@/components/ui/alert"
import { assets } from "@/lib/assets"

type GoNoteProps = Omit<React.ComponentProps<typeof Note>, "icon">

/** Note led by Go's 28px avatar; `variant` (peach | green | outline) and `trailing` pass through. */
function GoNote({ variant = "peach", ...props }: GoNoteProps) {
  return (
    <Note
      variant={variant}
      icon={<Avatar size={28} kind="go" src={assets.goAvatar.src} />}
      {...props}
    />
  )
}

export { GoNote }
