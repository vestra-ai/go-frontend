/** Longest edge of a sent photo (px). Small enough that a few dozen fit in localStorage with the rest of the store. */
const PHOTO_MAX_EDGE = 800;
const PHOTO_QUALITY = 0.82;

export type DownscaledPhoto = { src: string; width: number; height: number };

function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release(): void }> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).then((bmp) => ({ source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() }));
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Not a readable image"));
    };
    img.src = url;
  });
}

/** Resizes a picked photo to a JPEG data URL (longest edge PHOTO_MAX_EDGE). Rejects when the file isn't a readable image. */
export async function downscalePhoto(file: Blob): Promise<DownscaledPhoto> {
  const image = await decode(file);
  try {
    const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(image.source, 0, 0, width, height);
    return { src: canvas.toDataURL("image/jpeg", PHOTO_QUALITY), width, height };
  } finally {
    image.release();
  }
}

/** 1536 → "1.5 KB", 3_400_000 → "3.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 6 → "0:06", 75 → "1:15". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
