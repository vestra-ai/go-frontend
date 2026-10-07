import { cn } from "@/lib/utils"

// Stacked backdrop-blur layers, each masked in further down, so the blur ramps up
// toward the bottom. Values are the design's (P-Who-Link dock, P-Chat-Plan hero).
const presets = {
  /** B1/B6 bottom CTA dock: 3 / 8 / 18px. */
  dock: [
    "backdrop-blur-[3px] [mask-image:linear-gradient(180deg,transparent_0%,black_20%)]",
    "backdrop-blur-[8px] [mask-image:linear-gradient(180deg,transparent_10%,black_35%)]",
    "backdrop-blur-[18px] [mask-image:linear-gradient(180deg,transparent_22%,black_55%)]",
  ],
  /** Plan card hero photo: 2 / 5 / 9 / 16px over the lower half. */
  hero: [
    "backdrop-blur-[2px] [mask-image:linear-gradient(180deg,transparent_52%,black_68%)]",
    "backdrop-blur-[5px] [mask-image:linear-gradient(180deg,transparent_62%,black_78%)]",
    "backdrop-blur-[9px] [mask-image:linear-gradient(180deg,transparent_72%,black_88%)]",
    "backdrop-blur-[16px] [mask-image:linear-gradient(180deg,transparent_82%,black_100%)]",
  ],
} as const

type ProgressiveBlurProps = Omit<React.ComponentProps<"span">, "children"> & {
  layers?: keyof typeof presets
}

/** Fills its positioned parent (absolute inset-0); never takes pointer events. */
function ProgressiveBlur({ layers = "dock", className, ...props }: ProgressiveBlurProps) {
  return (
    <span
      aria-hidden
      data-slot="progressive-blur"
      className={cn("pointer-events-none absolute inset-0", className)}
      {...props}
    >
      {presets[layers].map((layer) => (
        <span key={layer} className={cn("absolute inset-0", layer)} />
      ))}
    </span>
  )
}

export { ProgressiveBlur }
