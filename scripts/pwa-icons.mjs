import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const dir = new URL("../public/pwa/", import.meta.url);
const svg = await readFile(new URL("icon.svg", dir));
const NAVY = "#0B1B3F";

const render = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

// Maskable: full-bleed navy with the artwork inside the 80% safe zone (10% padding per side).
async function renderMaskable(size) {
  const inner = Math.round(size * 0.8);
  return sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: await render(inner), gravity: "center" }])
    .png()
    .toBuffer();
}

const outputs = {
  "icon-192.png": await render(192),
  "icon-512.png": await render(512),
  "icon-512-maskable.png": await renderMaskable(512),
  "apple-touch-icon.png": await renderMaskable(180),
};

for (const [name, buf] of Object.entries(outputs)) {
  await writeFile(new URL(name, dir), buf);
  console.log(`wrote public/pwa/${name}`);
}
