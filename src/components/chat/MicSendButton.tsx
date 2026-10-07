import { MicSendIcon } from "@/components/icons/custom/MicSendIcon";
import { Button } from "@/components/ui/button";
import { chat as copy } from "@/data/seed/copy";

type MicSendButtonProps = {
  hasDraft: boolean;
  recording: boolean;
  onPress(): void;
};

/** 48px composer action: send arrow with a draft, otherwise mic (black, red while recording). */
export function MicSendButton({ hasDraft, recording, onPress }: MicSendButtonProps) {
  const label = hasDraft ? copy.composer.send : recording ? copy.composer.stopAndSend : copy.composer.voice;

  return (
    <Button type="button" size="icon-lg" variant={recording ? "danger" : "primary"} aria-label={label} onClick={onPress}>
      <MicSendIcon hasDraft={hasDraft} />
    </Button>
  );
}
