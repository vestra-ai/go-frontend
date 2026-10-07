import { Lock } from "@/components/icons/generated"
import { Note } from "@/components/ui/alert"

type InfoNoteProps = Omit<React.ComponentProps<typeof Note>, "icon">

/** Privacy note: Note (peach by default) led by a 16px lock. */
function InfoNote({ variant = "peach", ...props }: InfoNoteProps) {
  return <Note variant={variant} icon={<Lock className="size-4 shrink-0" />} {...props} />
}

export { InfoNote }
