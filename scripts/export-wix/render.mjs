import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ORIGIN } from './lib/urls.mjs';

export const pageUrl = (slug) => (slug === 'home' ? ORIGIN + '/' : `${ORIGIN}/${slug}`);

export async function settle(page) {
  // Wix keeps analytics connections open, so 'networkidle' never fires.
  await page.waitForTimeout(1000);
  for (let i = 0; i < 40; i++) {
    const done = await page.evaluate(() => {
      window.scrollBy(0, 800);
      return window.scrollY + window.innerHeight >= document.body.scrollHeight - 2;
    });
    await page.waitForTimeout(200);
    if (done) break;
  }
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

export async function renderPage(browser, slug, { htmlDir, shotDir, mobileContext } = {}) {
  if (shotDir && !mobileContext) throw new Error('renderPage: mobileContext is required when shotDir is set');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(pageUrl(slug), { waitUntil: 'load', timeout: 60000 });
    await settle(page);
    const html = await page.content();
    await mkdir(htmlDir, { recursive: true });
    await writeFile(`${htmlDir}/${slug}.html`, html);
    if (shotDir) {
      await mkdir(`${shotDir}/${slug}`, { recursive: true });
      await page.screenshot({ path: `${shotDir}/${slug}/desktop.png`, fullPage: true });
      const m = await mobileContext.newPage();
      try {
        await m.goto(pageUrl(slug), { waitUntil: 'load', timeout: 60000 });
        await settle(m);
        await m.screenshot({ path: `${shotDir}/${slug}/mobile.png`, fullPage: true });
      } finally {
        await m.close();
      }
    }
    return html;
  } finally {
    await page.close();
  }
}

export async function openBrowser() {
  const browser = await chromium.launch();
  // Wix serves its mobile layout by user agent, not viewport width.
  const mobileContext = await browser.newContext({ ...devices['iPhone 13'] });
  return { browser, mobileContext };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const htmlDir = outIdx >= 0 ? args.splice(outIdx, 2)[1] : '.cache/rendered';
  const noShots = args.includes('--no-shots');
  const slugs = args.filter((a) => !a.startsWith('--'));
  const { browser, mobileContext } = await openBrowser();
  for (const slug of slugs) {
    await renderPage(browser, slug, { htmlDir, shotDir: noShots ? undefined : 'docs/reference', mobileContext });
    console.log('rendered', slug);
  }
  await browser.close();
}
