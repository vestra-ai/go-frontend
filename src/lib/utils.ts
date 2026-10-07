import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the custom @theme scales in globals.css, otherwise
// e.g. `text-14` (font size) is treated as a colour and dropped next to `text-ink`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "20", "22", "24", "26", "30", "32", "34", "40", "44"],
      tracking: ["display", "title", "h2", "h3", "h4", "body", "sub", "sm", "caption", "badge", "tag", "eyebrow"],
      shadow: [
        "card", "bubble", "float", "float-sm", "header", "header-2", "tabs", "glass", "sheet", "tray", "pop",
        "menu", "toast", "fab", "pill", "btn", "knob", "thumb", "chip", "tile", "page", "frame",
      ],
      animate: ["rise", "rise-slow", "pop", "spin-slow", "fill", "live", "wave", "fade-away", "fade-in"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
