// Every built page at 320 and 375 CSS px wide must not scroll sideways (spec §1, plan Review
// Focus 4). Serves dist/ with `astro preview`, loads each page in Chromium, compares widths.
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.SITE_ENV === 'production' ? '' : '/achates360-website';
const PORT = 4329;
const pages = (await readdir('dist')).filter((f) => f.endsWith('.html') && f !== '404.html');
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--ignore-lock'], { stdio: 'ignore' });
// Poll instead of parsing stdout: astro 7 may log structured JSON, and --ignore-lock keeps this
// run independent of any preview server the developer already has running.
const url = `http://localhost:${PORT}${BASE}/`;
for (let i = 0; ; i++) {
  if (await fetch(url).then((r) => r.ok, () => false)) break;
  if (i > 60) { server.kill(); throw new Error(`preview server did not start on port ${PORT}`); }
  await new Promise((r) => setTimeout(r, 500));
}

const browser = await chromium.launch();
const failures = [];
try {
  for (const width of [320, 375]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
    const tab = await ctx.newPage();
    for (const f of pages) {
      const path = f === 'index.html' ? '/' : `/${f.replace(/\.html$/, '')}`;
      await tab.goto(`http://localhost:${PORT}${BASE}${path}`, { waitUntil: 'load' });
      const { scroll, inner } = await tab.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
      if (scroll > inner) failures.push(`${width}px ${path}: page is ${scroll}px wide`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
failures.forEach((f) => console.error(`OVERFLOW ${f}`));
console.log(`overflow: ${pages.length} pages × 2 widths, ${failures.length} problem(s)`);
process.exit(failures.length ? 1 : 0);
