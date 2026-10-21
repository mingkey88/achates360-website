// Draws the site's default share picture (src/assets/og-default.jpg, 1200×630): what WhatsApp,
// LinkedIn and Facebook show when a page without its own picture is shared. Direction B's paper cut:
// a sheet of the paper with "360" cut through it over a project picture, the logo and an orange bar
// on the paper. Run: node scripts/make-og.mjs [picture] [out]  (defaults below). Pages with a hero
// (case studies) share their own picture instead (layouts/Base.astro).
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const [picArg, outArg] = process.argv.slice(2);
const pic = picArg ?? 'src/assets/wix/e9d9c2_5a5989ab5710400d88c2b368524ccbc8.jpg'; // 'Building Memories' cover
const out = outArg ?? 'src/assets/og-default.jpg';

const dataUri = async (path, type) => `data:${type};base64,${(await readFile(new URL(path, root))).toString('base64')}`;
const font = await dataUri('node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-800-normal.woff2', 'font/woff2');
const photo = await dataUri(pic, pic.endsWith('.png') ? 'image/png' : 'image/jpeg');
const logo = (await readFile(new URL('src/assets/logo-horizontal.svg', root), 'utf8')).replace('<svg ', '<svg class="logo" ');

// Values from src/styles/tokens.css: paper, ink, brand orange, the page grid.
const html = `<!doctype html><html><head><style>
@font-face { font-family: Cut; src: url(${font}) format('woff2'); font-weight: 800; }
html, body { margin: 0; }
body { width: 1200px; height: 630px; position: relative; overflow: hidden; color: #333;
  background:
    linear-gradient(rgb(52 98 138 / .07) 1px, transparent 1px) 0 0 / 120px 120px,
    linear-gradient(90deg, rgb(52 98 138 / .07) 1px, transparent 1px) 0 0 / 120px 120px,
    linear-gradient(rgb(52 98 138 / .035) 1px, transparent 1px) 0 0 / 24px 24px,
    linear-gradient(90deg, rgb(52 98 138 / .035) 1px, transparent 1px) 0 0 / 24px 24px,
    #fffef2; }
.sheet { position: absolute; left: 285px; top: 120px; width: 630px; height: 390px; box-shadow: 0 22px 34px -20px rgb(0 0 0 / .4); }
.sheet img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.sheet svg { position: absolute; inset: 0; }
.logo { position: absolute; left: 60px; top: 40px; width: 250px; height: auto; color: #333; }
.bar { position: absolute; left: 285px; top: 510px; width: 630px; height: 6px; background: #ff9015; }
.url { position: absolute; right: 60px; bottom: 44px; font: 500 20px/1 'Helvetica Neue', Arial, sans-serif; letter-spacing: .14em; color: #333; }
</style></head><body>
${logo}
<div class="sheet"><img src="${photo}" alt="">
<svg viewBox="0 0 630 390" width="630" height="390">
 <defs>
  <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="630" height="390"><rect width="630" height="390" fill="#fff"/>
   <text x="315" y="300" text-anchor="middle" font-family="Cut" font-weight="800" font-size="300" letter-spacing="-10">360</text></mask>
  <filter id="f" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".3"/></filter>
 </defs>
 <rect width="630" height="390" fill="#fffef2" mask="url(#m)" filter="url(#f)"/>
</svg></div>
<div class="bar"></div>
<div class="url">ACHATES360.COM</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: fileURLToPath(new URL(out, root)), type: 'jpeg', quality: 90 });
await browser.close();
console.log('wrote', out);
