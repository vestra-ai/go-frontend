import { cn } from "@/lib/utils";

type CarouselDotsProps = {
  count: number;
  active: number;
};

/** Decorative page dots under the call carousel; the active dot widens to 18px (§1.2 C.3). */
export function CarouselDots({ count, active }: CarouselDotsProps) {
  return (
    <div aria-hidden data-slot="carousel-dots" className="flex justify-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-[width,background-color] duration-200",
            i === active ? "w-[18px] bg-ink" : "w-1.5 bg-line-4",
          )}
        />
      ))}
    </div>
  );
}
