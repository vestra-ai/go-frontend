// Placeholder fills (the Home and trip skeletons, the ideas placeholders). `surface-2` is all but the canvas colour, so it is never
// used here: it would vanish into the page background.

/** A bar standing in for text, on a white card: real text made invisible, so it is exactly as tall as the text. */
export const SKELETON_BAR = "rounded-md bg-line text-transparent select-none";

/** The same, straight on the page background, where the lighter tone would disappear. */
export const SKELETON_BAR_ON_CANVAS = "rounded-md bg-line-2 text-transparent select-none";

/** A solid area (an image well, a cover, an avatar) on the page background or a card. */
export const SKELETON_FILL = "bg-line-2";

/** The same, over a hero or cover (a grey fill or a photo), where a light bar reads on both. */
export const SKELETON_BAR_ON_PHOTO = "rounded-md bg-white/60 text-transparent select-none";
