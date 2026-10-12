// Builds src/assets/og-default.jpg: the share image (1200x630) for pages without a picture of their
// own: the stacked logo in ink (#333333) on the paper colour (#fffef2). Run: node scripts/make-og-default.mjs
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const svg = (await readFile('src/assets/logo-stacked-parts.svg', 'utf8')).replace('fill="currentColor"', 'fill="#333333"');
const logo = await sharp(Buffer.from(svg), { density: 600 }).resize({ height: 300 }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#fffef2' } })
  .composite([{ input: logo, gravity: 'center' }])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile('src/assets/og-default.jpg');
console.log('wrote src/assets/og-default.jpg');
