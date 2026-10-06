/**
 * Site chrome the page export does not see (Rulings 22, 28, 29): Wix's site menus and the
 * mobile-only text on the homepage. Wix builds them only when a visitor opens them:
 *   - desktop: a hamburger opens a lightbox ("popup") holding the site menu and a social bar;
 *   - mobile (iPhone 13 user agent): the "tiny menu" overlay, with collapsible sub-menus;
 *   - mobile: components Wix's mobile layout adds that the desktop page does not have (the
 *     "Projects" heading over the homepage gallery).
 *
 *   node scripts/export-wix/chrome.mjs           render home, capture, update content
 *   node scripts/export-wix/chrome.mjs --cached  update content from the last capture
 *
 * The capture is cached as .cache/rendered/home.chrome.json (the export merges it too, so an
 * offline re-export reproduces these fields). Writing content parses the existing site and home
 * files, sets only the chrome keys and stringifies with the export's own toFrontmatter, so no
 * other field can change.
 */
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openBrowser, pageUrl, settle } from './render.mjs';
import { extractPage } from './lib/extract.mjs';
import { toChrome, CHROME_KEYS } from './lib/chrome.mjs';
import { setFrontmatterKeys } from './lib/write.mjs';
import { localName } from './lib/urls.mjs';

export const CHROME_CACHE = '.cache/rendered/home.chrome.json';

// The outermost Wix section under a viewport point (the section an anchor link scrolled to).
const sectionAt = (page, y) => page.evaluate((y) => {
  let el = document.elementFromPoint(innerWidth / 2, y);
  let out = null;
  while (el) { if (el.matches?.('section[id^="comp-"]') && el.closest('#PAGES_CONTAINER')) out = el.id; el = el.parentElement; }
  return out;
}, y);

async function captureDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(pageUrl('home'), { waitUntil: 'load', timeout: 60000 });
    await settle(page);
    const compIds = await page.evaluate(() => [...document.querySelectorAll('[id^="comp-"]')].map((e) => e.id));
    // The site-level link that opens a lightbox (outside the page content) is the hamburger.
    const hasOpener = await page.evaluate(() => [...document.querySelectorAll('a[data-popupid]')].some((a) => !a.closest('#PAGES_CONTAINER')));
    if (!hasOpener) throw new Error('chrome: no site-level popup link (desktop hamburger) found on home');
    const open = async () => {
      await page.evaluate(() => [...document.querySelectorAll('a[data-popupid]')].find((a) => !a.closest('#PAGES_CONTAINER'))?.click());
      await page.locator('#POPUPS_ROOT nav').first().waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(800);
    };
    await open();
    const popupHtml = await page.evaluate(() => document.getElementById('POPUPS_ROOT').innerHTML);
    // Anchor links ("CONTACT") carry a Wix anchor id that is not in the page HTML: follow each
    // one and record the section it scrolls to.
    const anchors = {};
    const anchorIds = await page.evaluate(() => [...document.querySelectorAll('#POPUPS_ROOT nav a[data-anchor]')].map((a) => a.dataset.anchor));
    for (const id of anchorIds) {
      if (!(await page.locator('#POPUPS_ROOT nav').first().isVisible())) await open();
      await page.evaluate((id) => document.querySelector(`#POPUPS_ROOT nav a[data-anchor="${id}"]`).click(), id);
      await page.waitForTimeout(3000);
      anchors[id] = await sectionAt(page, 60);
    }
    return { popupHtml, anchors, compIds };
  } finally {
    await page.close();
  }
}

async function captureMobile(mobileContext, desktopCompIds) {
  const page = await mobileContext.newPage();
  try {
    await page.goto(pageUrl('home'), { waitUntil: 'load', timeout: 60000 });
    await settle(page);
    // Rich text Wix's mobile layout adds (absent from the desktop page), with its outer section.
    const mobileTexts = await page.evaluate((desktop) => {
      const known = new Set(desktop);
      return [...document.querySelectorAll('#PAGES_CONTAINER [data-testid="richTextElement"]')].flatMap((el) => {
        const comp = el.closest('[id^="comp-"]');
        const r = el.getBoundingClientRect();
        if (!comp || known.has(comp.id) || !(r.width > 0 && r.height > 0)) return [];
        let section = null;
        for (let s = el.closest('section[id^="comp-"]'); s; s = s.parentElement?.closest('section[id^="comp-"]')) section = s.id;
        return [{ comp: comp.id, section, html: el.innerHTML }];
      });
    }, desktopCompIds);
    // Open the menu and expand every collapsed sub-menu, so the whole tree is in the DOM.
    await page.click('[data-testid="tinymenu-menubutton"]');
    await page.waitForTimeout(1200);
    const headers = await page.locator('#TINY_MENU [data-testid$="-header"]').count();
    for (let i = 0; i < headers; i++) {
      const header = page.locator('#TINY_MENU [data-testid$="-header"]').nth(i);
      const li = header.locator('xpath=..');
      if (!(await li.locator('[data-testid^="tinymenu-subitem-"]').count())) {
        await header.locator('span').last().click();
        await page.waitForTimeout(800);
      }
    }
    const menuHtml = await page.evaluate(() => document.getElementById('TINY_MENU').outerHTML);
    return { menuHtml, mobileTexts };
  } finally {
    await page.close();
  }
}

/** Render home on desktop and mobile and return the raw chrome capture (cached as JSON). */
export async function captureChrome(browser, mobileContext) {
  const desktop = await captureDesktop(browser);
  const mobile = await captureMobile(mobileContext, desktop.compIds);
  return {
    desktop: { popupHtml: desktop.popupHtml, anchors: desktop.anchors },
    mobile,
  };
}

const exists = (p) => access(p).then(() => true, () => false);

/** Every path the snapshot serves or knowingly leaves out (known-missing). */
export async function snapshotPaths(root) {
  const paths = new Set(JSON.parse(await readFile(join(root, 'scripts/export-wix/sitemap-urls.json'), 'utf8')));
  for (const c of ['projects', 'cards', 'basic']) {
    for (const f of await readdir(join(root, 'src/content', c))) if (f.endsWith('.md')) paths.add(`/${f.slice(0, -3)}`);
  }
  for (const k of JSON.parse(await readFile(join(root, 'scripts/export-wix/known-missing.json'), 'utf8'))) paths.add(k.path);
  return paths;
}

const setKeys = async (path, fields, keys) =>
  writeFile(path, setFrontmatterKeys(await readFile(path, 'utf8'), fields, keys));

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.cwd();
  let raw;
  if (process.argv.includes('--cached')) {
    raw = JSON.parse(await readFile(CHROME_CACHE, 'utf8'));
  } else {
    const { browser, mobileContext } = await openBrowser();
    try { raw = await captureChrome(browser, mobileContext); } finally { await browser.close(); }
    await writeFile(CHROME_CACHE, JSON.stringify(raw, null, 1) + '\n');
    console.log(`captured chrome → ${CHROME_CACHE}`);
  }
  const homeRaw = extractPage(await readFile('.cache/rendered/home.html', 'utf8'), 'home',
    JSON.parse(await readFile('.cache/rendered/home.gallery.json', 'utf8')));
  const { site, home, warnings } = toChrome(raw, { homeRaw, knownPaths: await snapshotPaths(root) });
  for (const w of warnings) console.log(`warning: ${w}`);
  for (const s of site.menuSocial ?? []) {
    const file = join(root, 'src/assets', s.src.replace('../../assets/', ''));
    if (!(await exists(file))) console.log(`warning: social icon ${localName(s.src)} is not in src/assets/wix — run the export for media`);
  }
  await setKeys(join(root, 'src/content/site/site.md'), site, CHROME_KEYS.site);
  await setKeys(join(root, 'src/content/home/home.md'), home, CHROME_KEYS.home);
  const n = (xs) => (xs ?? []).reduce((s, x) => s + 1 + (x.items?.length ?? 0), 0);
  console.log(`site: menu ${n(site.menu)} links, mobileMenu ${n(site.mobileMenu)} links, menuSocial ${site.menuSocial?.length ?? 0}; home: mobileHeading ${home.mobileHeading ? JSON.stringify(home.mobileHeading) : '(none)'}`);
}
