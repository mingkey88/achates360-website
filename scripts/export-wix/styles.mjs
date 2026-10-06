import { chromium, devices } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { pageUrl } from './render.mjs';

// One representative element per role; the first match on the page is sampled.
const ROLES = {
  body: 'body',
  projectTitle: '#PAGES_CONTAINER [data-testid="richTextElement"] h2',
  projectClient: '#PAGES_CONTAINER [data-testid="richTextElement"] h6, #PAGES_CONTAINER [data-testid="richTextElement"] p',
  projectBody: '#PAGES_CONTAINER [data-testid="richTextElement"] p',
  smallHeading: '#PAGES_CONTAINER [data-testid="richTextElement"] h5',
  backLink: '#PAGES_CONTAINER a[data-testid="linkElement"]',
  footerText: '#SITE_FOOTER [data-testid="richTextElement"] p',
  footerHeading: '#SITE_FOOTER [data-testid="richTextElement"] h5, #SITE_FOOTER [data-testid="richTextElement"] h6',
  formLabel: 'form label',
  formInput: 'form input[type="text"]',
  formSubmit: 'form button',
  galleryTitle: '[data-hook="item-title"]',
  anchorMenu: '.wixui-anchor-menu a',
  viewProject: '#PAGES_CONTAINER a[href*="/dxv"]',
};
const PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color',
  'backgroundColor', 'textTransform', 'borderRadius', 'borderColor', 'borderWidth', 'padding'];
const PAGES = ['home', 'projects', 'notter', 'angeline', 'about'];

const browser = await chromium.launch();
const out = {};
for (const [label, ctxOpts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['mobile', devices['iPhone 13']]]) {
  const ctx = await browser.newContext(ctxOpts);
  for (const slug of PAGES) {
    const page = await ctx.newPage();
    await page.goto(pageUrl(slug), { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2500);
    out[`${label}:${slug}`] = await page.evaluate(({ roles, props }) => {
      const res = {};
      for (const [role, sel] of Object.entries(roles)) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const cs = getComputedStyle(el);
        res[role] = Object.fromEntries(props.map((p) => [p, cs[p]]));
        res[role].sample = (el.textContent || '').trim().slice(0, 40);
      }
      res.pageBackground = getComputedStyle(document.querySelector('#PAGES_CONTAINER') || document.body).backgroundColor;
      return res;
    }, { roles: ROLES, props: PROPS });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
await mkdir('docs/reference', { recursive: true });
await writeFile('docs/reference/styles.json', JSON.stringify(out, null, 2));
console.log('wrote docs/reference/styles.json');
