import { ArrowRight, Mic } from "@/components/icons/generated";

type MicSendIconProps = React.SVGProps<SVGSVGElement> & {
  hasDraft: boolean;
};

export function MicSendIcon({ hasDraft, className = "size-5", ...props }: MicSendIconProps) {
  const Icon = hasDraft ? ArrowRight : Mic;
  return <Icon className={className} {...props} />;
}
