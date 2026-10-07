import { SystemPill } from "@/components/chat/SystemPill";

type ProgressPillProps = {
  text: string;
};

/** F1 centred status pill with the Go avatar, e.g. "Rahul and Priya added theirs". Not interactive. */
export function ProgressPill({ text }: ProgressPillProps) {
  return <SystemPill text={text} />;
}
