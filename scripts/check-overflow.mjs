// Every built page at 320 and 375 CSS px wide must not scroll sideways (spec §1, plan Review
// Focus 4). Serves dist/ with `astro preview`, loads each page in Chromium, compares widths.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.SITE_ENV === 'production' ? '' : '/achates360-website';
const pages = (await readdir('dist')).filter((f) => f.endsWith('.html') && f !== '404.html');

// A fresh port every run: a stale server on a fixed port could serve an old dist/.
const PORT = await new Promise((res, rej) => {
  const probe = createServer();
  probe.once('error', rej);
  probe.listen(0, () => { const { port } = probe.address(); probe.close(() => res(port)); });
});
// detached => own process group, so the whole tree can be killed in `finally`.
const server = spawn('node_modules/.bin/astro', ['preview', '--port', String(PORT), '--ignore-lock'], { stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid); } catch {} };

const failures = [];
let browser;
try {
  const url = `http://localhost:${PORT}${BASE}/`;
  for (let i = 0; ; i++) {
    if (await fetch(url, { signal: AbortSignal.timeout(2000) }).then((r) => r.ok, () => false)) break;
    if (i > 60) throw new Error(`preview server did not start on port ${PORT}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  for (const width of [320, 375]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
    const tab = await ctx.newPage();
    for (const f of pages) {
      const path = f === 'index.html' ? '/' : `/${f.replace(/\.html$/, '')}`;
      const res = await tab.goto(`http://localhost:${PORT}${BASE}${path}`, { waitUntil: 'load' });
      if (!res || !res.ok()) { failures.push(`${width}px ${path}: HTTP ${res ? res.status() : 'no response'}`); continue; }
      const { scroll, inner } = await tab.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
      if (scroll > inner) failures.push(`${width}px ${path}: page is ${scroll}px wide`);
    }
    await ctx.close();
  }
} finally {
  await browser?.close();
  stop();
}
failures.forEach((f) => console.error(`OVERFLOW ${f}`));
console.log(`overflow: ${pages.length} pages × 2 widths, ${failures.length} problem(s)`);
process.exit(failures.length ? 1 : 0);
