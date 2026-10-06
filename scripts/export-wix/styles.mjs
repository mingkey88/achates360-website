import { chromium, devices } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { pageUrl, settle } from './render.mjs';

// One representative element per role: the FIRST match that is visible and has text.
// `text` filters by a regex on the element text; `leaf: false` samples the matched element itself
// (default descends through single-child wrappers to the element carrying the visible text).
const RT = '#PAGES_CONTAINER [data-testid="richTextElement"]';
const ROLES = {
  projectTitle: { sel: `${RT} h2` },
  projectClient: { sel: `${RT} h6, ${RT} p` },
  projectBody: { sel: `${RT} p` },
  smallHeading: { sel: `${RT} h5` },
  backLink: { sel: '#PAGES_CONTAINER a', text: 'BACK TO PROJECTS', deepText: true },
  footerText: { sel: '#SITE_FOOTER [data-testid="richTextElement"] p' },
  footerHeading: { sel: '#SITE_FOOTER [data-testid="richTextElement"] h5, #SITE_FOOTER [data-testid="richTextElement"] h6' },
  formLabel: { sel: 'form label' },
  formInput: { sel: 'form input[type="text"]', noText: true },
  formSubmit: { sel: '[data-testid="buttonElement"].wixui-button', text: 'Submit', leaf: false },
  formSubmitLabel: { sel: '[data-testid="buttonElement"].wixui-button .wixui-button__label', text: 'Submit', leaf: false },
  galleryTitle: { sel: '[data-hook="item-title"]' },
  // Labels are zero-size (invisible); the visible menu item is the 12px dot, painted via SVG fill/stroke.
  anchorMenu: { sel: '.wixui-anchor-menu__item svg circle', noText: true, leaf: false },
  viewProject: { sel: '#PAGES_CONTAINER a[href*="/dxv"]' },
};
const PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color',
  'backgroundColor', 'textTransform', 'borderRadius', 'borderColor', 'borderWidth', 'padding', 'fill', 'stroke'];
const PAGES = ['home', 'projects', 'notter', 'angeline', 'about'];

const browser = await chromium.launch();
const out = {};
for (const [label, ctxOpts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['mobile', devices['iPhone 13']]]) {
  const ctx = await browser.newContext(ctxOpts);
  for (const slug of PAGES) {
    const page = await ctx.newPage();
    try {
      await page.goto(pageUrl(slug), { waitUntil: 'load', timeout: 60000 });
      await settle(page);
      out[`${label}:${slug}`] = await page.evaluate(({ roles, props }) => {
        const visible = (el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
            && (el.checkVisibility ? el.checkVisibility() : true);
        };
        const res = {};
        for (const [role, spec] of Object.entries(roles)) {
          const re = spec.text ? new RegExp(spec.text, 'i') : null;
          let el = [...document.querySelectorAll(spec.sel)].find((e) => {
            const t = (e.textContent || '').trim();
            return visible(e) && (spec.noText || t) && (!re || re.test(t));
          });
          if (!el) continue;
          if (spec.leaf !== false) {
            // descend through wrappers (e.g. <p><span style="font-family:avenir">) to the styled text element
            for (;;) {
              const kids = [...el.children].filter((k) => (k.textContent || '').trim());
              const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
              if (kids.length === 1 && !own && visible(kids[0])) el = kids[0]; else break;
            }
          }
          if (spec.deepText) {
            // descend to the deepest element whose OWN text node matches (the node that carries the styled text)
            for (;;) {
              const next = [...el.children].find((k) => [...k.childNodes].some((n) => n.nodeType === 3 && re.test(n.textContent)))
                || [...el.children].find((k) => re.test(k.textContent || ''));
              if (!next) break;
              el = next;
            }
          }
          const text = (el.textContent || '').trim();
          const cs = getComputedStyle(el);
          res[role] = Object.fromEntries(props.map((p) => [p, cs[p]]));
          res[role].sampledTag = el.tagName.toLowerCase();
          res[role].sample = text.slice(0, 40);
        }
        const pc = document.querySelector('#PAGES_CONTAINER') || document.body;
        res.pageBackground = getComputedStyle(pc).backgroundColor;
        return res;
      }, { roles: ROLES, props: PROPS });
    } catch (err) {
      console.error(`FAILED ${label}:${slug}:`, err.message);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
await mkdir('docs/reference', { recursive: true });
await writeFile('docs/reference/styles.json', JSON.stringify(out, null, 2));
console.log('wrote docs/reference/styles.json');
