import { LiveDot } from "@/components/common/LiveDot";
import { chat as copy } from "@/data/seed/copy";

/**
 * Red "Recording…" pill, right-aligned 12px above the composer controls.
 * Render it inside the composer row (`relative`); the halo pulse stays green as designed.
 */
export function RecordingPill() {
  return (
    <div
      role="status"
      className="absolute right-4 bottom-[calc(100%-12px)] flex h-10 items-center gap-2 rounded-full bg-danger px-3.5 text-14 font-semibold whitespace-nowrap text-white transition-[opacity,translate] duration-220 ease-out starting:translate-y-1.5 starting:opacity-0"
    >
      <LiveDot size={8} pulse className="bg-white" />
      {copy.composer.recording}
    </div>
  );
}
