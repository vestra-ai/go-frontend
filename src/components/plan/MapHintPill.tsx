/** Navy pill at the bottom of the map while no spot is selected. */
export function MapHintPill({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute transition-opacity duration-200 delay-100 starting:opacity-0 bottom-3.5 left-1/2 inline-flex h-8 -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-ink/78 px-3 text-13 font-semibold text-white">
      {text}
    </div>
  );
}
