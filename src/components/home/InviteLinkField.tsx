import { Copy, Link as LinkIcon } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { crew as copy } from "@/data/seed/copy";

type InviteLinkFieldProps = { url: string; onCopy: () => void };

/** Static pill showing the invite link with an inline Copy button (not an input). */
export function InviteLinkField({ url, onCopy }: InviteLinkFieldProps) {
  return (
    <div
      role="group"
      aria-label={copy.linkLabel}
      className="flex h-[52px] items-center gap-2.5 rounded-full bg-surface-2 pr-1.5 pl-4"
    >
      <LinkIcon className="size-[18px] shrink-0 text-muted" />
      <span className="min-w-0 flex-1 truncate text-left text-15 font-medium">{url}</span>
      <Button variant="white" size="xs" className="h-10 gap-1.5 px-3.5 text-14 shadow-none" onClick={onCopy}>
        <Copy className="size-4" />
        {copy.copy}
      </Button>
    </div>
  );
}
