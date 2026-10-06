import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ORIGIN } from './lib/urls.mjs';
import { findGalleryItems } from './lib/wixdata.mjs';

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

// Wix embeds only the first items of each gallery in the page; its gallery widget fetches
// the rest (today from /pro-gallery-webapp/v1/galleries/<id>?offset=…) inside a web worker.
// Keep every JSON response body that contains gallery items, whatever its URL.
function recordGalleryResponses(context) {
  const pending = [];
  const onResponse = (res) => {
    if (!/json/.test(res.headers()['content-type'] ?? '')) return;
    pending.push(res.json().then(
      (body) => (findGalleryItems(body).length ? body : null),
      () => null,
    ));
  };
  // Context level, so requests made by the page's workers are seen too.
  context.on('response', onResponse);
  return async () => {
    context.off('response', onResponse);
    return (await Promise.all(pending)).filter(Boolean);
  };
}

// Wix component roots inside the page (not their `comp-x_img`-style parts or repeater items).
const COMP_ID = '^comp-[a-z0-9]+$';

// Rendered box of every component in the page: "x,y,w,h" in CSS px, document coordinates.
// Components Wix does not render at this size (display: none) are left out.
function pageBoxes(page) {
  return page.evaluate((compId) => {
    const re = new RegExp(compId, 'i');
    const boxes = {};
    for (const el of document.querySelectorAll('#PAGES_CONTAINER [id^="comp-"]')) {
      if (!re.test(el.id)) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) boxes[el.id] = [r.x, r.y + window.scrollY, r.width, r.height].map(Math.round).join(',');
    }
    return boxes;
  }, COMP_ID);
}

/**
 * Task 11b: write the layout facts the export needs into the desktop DOM before it is saved.
 * - data-box on every page component (desktop 1440x900), data-mbox from the mobile render;
 * - data-color on rich text: computed colour of its first element with its own visible text;
 * - <body data-page-bg>: the page's visible background colour (see below; the body itself is
 *   transparent on Wix);
 * - data-player-src / data-player-poster on Wix-hosted video players (not background videos,
 *   whose element carries data-video-info, nor gallery hover videos).
 */
export async function annotate(page, mobileBoxes = {}) {
  const boxes = await pageBoxes(page);
  await page.evaluate(({ boxes, mobileBoxes, compId }) => {
    const re = new RegExp(compId, 'i');
    for (const [id, box] of Object.entries(boxes)) {
      const el = document.getElementById(id);
      el.setAttribute('data-box', box);
      if (mobileBoxes[id]) el.setAttribute('data-mbox', mobileBoxes[id]);
    }
    for (const el of document.querySelectorAll('#PAGES_CONTAINER [data-testid="richTextElement"]')) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode()) && !node.textContent.trim());
      if (node) el.setAttribute('data-color', getComputedStyle(node.parentElement).color);
    }
    // The visible page colour. Wix paints it on colour underlays: the page background layer's,
    // or a full-width section's (e.g. /joinus paints #f2f2f2 on an inner section over a white
    // page layer). Sample the page's left margin every 50px; at each point the last opaque
    // underlay in document order is on top; the colour seen at most points wins.
    const opaque = (c) => /^rgb\(/.test(c) || /^rgba\(.*,\s*1\)$/.test(c);
    const underlays = [...document.querySelectorAll('[data-testid="colorUnderlay"]')]
      .filter((u) => u.closest('#PAGES_CONTAINER, [id^="bgLayers_pageBackground_"]'))
      .map((u) => { const r = u.getBoundingClientRect(); return { c: getComputedStyle(u).backgroundColor, x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height }; })
      .filter((u) => opaque(u.c) && u.w > 0 && u.h > 0);
    const pc = document.getElementById('PAGES_CONTAINER').getBoundingClientRect();
    const counts = new Map();
    for (let y = pc.y + window.scrollY + 25; y < pc.y + window.scrollY + pc.height; y += 50) {
      const hit = underlays.filter((u) => u.x <= 5 && u.x + u.w > 5 && u.y <= y && u.y + u.h > y).at(-1);
      const c = hit ? hit.c : 'rgb(255, 255, 255)';
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const bg = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'rgb(255, 255, 255)';
    document.body.setAttribute('data-page-bg', bg);
    for (const v of document.querySelectorAll('#PAGES_CONTAINER video')) {
      if (v.closest('[data-video-info], [data-hook="item-container"]')) continue;
      let comp = v.parentElement;
      while (comp && !re.test(comp.id)) comp = comp.parentElement;
      const src = v.currentSrc || v.getAttribute('src');
      if (!comp || !src) continue;
      const img = comp.querySelector('img');
      comp.setAttribute('data-player-src', src);
      comp.setAttribute('data-player-poster', v.poster || (img ? img.src : ''));
    }
  }, { boxes, mobileBoxes, compId: COMP_ID });
}

export async function renderPage(browser, slug, { htmlDir, shotDir, mobileContext } = {}) {
  if (shotDir && !mobileContext) throw new Error('renderPage: mobileContext is required when shotDir is set');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const galleryBodies = recordGalleryResponses(page.context());
  try {
    await page.goto(pageUrl(slug), { waitUntil: 'load', timeout: 60000 });
    await settle(page);
    // Wix lays out the same components for mobile by user agent: their mobile boxes tell which
    // desktop rows Wix keeps side by side on phones.
    let mobileBoxes = {};
    if (mobileContext) {
      const m = await mobileContext.newPage();
      try {
        await m.goto(pageUrl(slug), { waitUntil: 'load', timeout: 60000 });
        await settle(m);
        mobileBoxes = await pageBoxes(m);
        if (shotDir) {
          await mkdir(`${shotDir}/${slug}`, { recursive: true });
          await m.screenshot({ path: `${shotDir}/${slug}/mobile.png`, fullPage: true });
        }
      } finally {
        await m.close();
      }
    }
    await annotate(page, mobileBoxes);
    const html = await page.content();
    await mkdir(htmlDir, { recursive: true });
    await writeFile(`${htmlDir}/${slug}.html`, html);
    await writeFile(`${htmlDir}/${slug}.gallery.json`, JSON.stringify(await galleryBodies(), null, 1) + '\n');
    if (shotDir) await page.screenshot({ path: `${shotDir}/${slug}/desktop.png`, fullPage: true });
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
