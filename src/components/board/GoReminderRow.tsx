import { Eyebrow } from "@/components/common/Eyebrow";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { assets } from "@/lib/assets";

type GoReminderRowProps = {
  eyebrow: string;
  value: string;
  sub: string;
  cta: string;
  onAction: () => void;
};

export function GoReminderRow({ eyebrow, value, sub, cta, onAction }: GoReminderRowProps) {
  return (
    <div className="-mx-4 flex items-center gap-3 bg-go-note px-4 py-3">
      <Avatar kind="go" size={22} src={assets.goAvatar.src} name="Go" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Eyebrow tone="go">{eyebrow}</Eyebrow>
        <span className="text-16 leading-[1.3] font-semibold tracking-body">{value}</span>
        <span className="text-13 tracking-caption text-muted">{sub}</span>
      </div>
      <Button variant="primary" size="xs" className="px-3.5 font-semibold" onClick={onAction}>
        {cta}
      </Button>
    </div>
  );
}
