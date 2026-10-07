import { GlassStatusPill } from "@/components/home/GlassStatusPill";

type OrbitItem = { label: string; img: string; alt: string };

type WelcomeOrbitProps = {
  /** Exactly 6, in orbit order (Manali first, clockwise). */
  items: OrbitItem[];
  mascot: { src: string; alt: string };
  pills: { progress: { label: string; value: number }; done: { label: string } };
};

// Artboard px (the box is the 420-wide design artboard), index-aligned with `items`.
const POSITIONS = [
  "left-[170px] top-[116px]",
  "left-[300px] top-[191px]",
  "left-[300px] top-[341px]",
  "left-[170px] top-[416px]",
  "left-10 top-[341px]",
  "left-10 top-[191px]",
] as const;

/** Welcome hero cluster: dashed ring, glow, six city illustrations around Go, two glass status pills. */
export function WelcomeOrbit({ items, mascot, pills }: WelcomeOrbitProps) {
  return (
    <div className="absolute top-0 left-1/2 h-[504px] w-[420px] origin-top -translate-x-1/2 [@media(max-height:779px)]:scale-[0.74] [@media(max-height:879px)]:scale-[0.88]">
      <span aria-hidden className="absolute top-[150px] left-[60px] size-[300px] rounded-full border-[1.5px] border-dashed border-go-ring" />
      <span
        aria-hidden
        className="absolute top-[188px] left-[98px] size-[224px] rounded-full bg-[radial-gradient(closest-side,var(--color-go-glow)_0%,rgb(251_233_226/0.6)_55%,rgb(251_233_226/0)_100%)]"
      />
      {items.map((item, i) => (
        // Delay is index-derived, so it goes through style (the animate-* shorthand would override an arbitrary class).
        <div
          key={item.label}
          className={`absolute flex w-20 animate-rise flex-col items-center ${POSITIONS[i]}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG illustration */}
          <img src={item.img} alt={item.alt} className="size-[68px] drop-shadow-[0_6px_8px_rgb(164_79_58/0.12)]" />
          <span className="mt-0.5 text-12 leading-[1.3] font-semibold tracking-[0.01em] text-muted">{item.label}</span>
        </div>
      ))}
      <span
        aria-hidden
        className="absolute top-[384px] left-[165px] h-3 w-[90px] rounded-[50%] bg-[radial-gradient(closest-side,rgb(11_27_63/0.18),rgb(11_27_63/0))]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG mascot */}
      <img src={mascot.src} alt={mascot.alt} className="absolute top-[208px] left-[170px] h-[182px] w-20 animate-rise-slow" />
      <GlassStatusPill
        variant="progress"
        label={pills.progress.label}
        value={pills.progress.value}
        className="absolute top-[284px] left-[232px] w-40 [animation-delay:420ms]"
      />
      <GlassStatusPill
        variant="done"
        label={pills.done.label}
        className="absolute top-[300px] left-[26px] [animation-delay:540ms]"
      />
    </div>
  );
}
