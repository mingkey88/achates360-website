import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { extractPage } from './extract.mjs';
import { toChrome, CHROME_KEYS } from './chrome.mjs';
import { homeTarget } from './map.mjs';
import { setFrontmatterKeys, toFrontmatter } from './write.mjs';

const fixture = (f) => readFileSync(new URL(`../__fixtures__/${f}`, import.meta.url), 'utf8');
const homeRaw = extractPage(fixture('home.html'), 'home', JSON.parse(fixture('home.gallery.json')));

const O = 'https://www.achates360.com';
// Trimmed from a real capture (chrome.mjs): Wix's lightbox menu and its social bar.
const popupHtml = `<div><nav aria-label="Site"><ul id="comp-xitemsContainer">
  <li><a href="${O}">HOME</a></li>
  <li><a href="${O}/projects" aria-haspopup="true">PROJECTS</a><button aria-label="More PROJECTS pages"></button>
    <ul><li><a href="${O}/notter" tabindex="-1">Notter</a></li>
        <li><a href="${O}/brand-new-page" tabindex="-1">Brand New</a></li>
        <li><a href="${O}/dbs-pb-video-wall" tabindex="-1">DBS Private Bank Video Wall</a></li></ul></li>
  <li><a data-anchor="dataItem-ivmfd1ta" href="${O}">CONTACT</a></li>
  <li><a href="${O}/joinus">JOIN US</a></li>
  <li><div></div></li>
</ul></nav>
<div id="social"><a href="https://www.facebook.com/achates360/" target="_blank"><img alt="Facebook"
  src="https://static.wixstatic.com/media/ce6ec7c11b174c0581e20f42bb865ce3.png/v1/fill/w_25,h_25/ce6ec7c11b174c0581e20f42bb865ce3.png"></a></div></div>`;
// Wix's opened mobile menu, sub-menu expanded.
const menuHtml = `<nav id="TINY_MENU"><ul>
  <li data-testid="tinymenu-item-0-selected"><a href="${O}">HOME</a></li>
  <li data-testid="tinymenu-item-1"><div data-testid="tinymenu-item-1-header"><a href="${O}/projects">PROJECTS</a><span></span></div>
    <ul><li data-testid="tinymenu-subitem-0"><a href="${O}/notter">Notter</a></li>
        <li data-testid="tinymenu-subitem-1"><a href="${O}/brand-new-page">Brand New</a></li></ul></li>
  <li data-testid="tinymenu-item-2"><a href="${O}/about">ABOUT</a></li>
</ul></nav>`;
const contactSection = homeRaw.nodes.find((n) => n.kind === 'form').section;
const capture = {
  desktop: { popupHtml, anchors: { 'dataItem-ivmfd1ta': contactSection } },
  mobile: {
    menuHtml,
    mobileTexts: [{ comp: 'comp-mn2yx17k', section: 'comp-m2408qz66', html: '<h2 style="text-align:center"><span style="letter-spacing:0.2em">Projects</span></h2>' }],
  },
};
const knownPaths = new Set(['/', '/projects', '/notter', '/joinus', '/about', '/dbs-pb-video-wall']);

describe('toChrome', () => {
  const out = toChrome(capture, { homeRaw, knownPaths });

  it('maps the desktop menu verbatim, with sub-menus and the anchor link resolved', () => {
    expect(out.site.menu).toEqual([
      { label: 'HOME', href: '/' },
      { label: 'PROJECTS', href: '/projects', items: [
        { label: 'Notter', href: '/notter' },
        { label: 'DBS Private Bank Video Wall', href: '/dbs-pb-video-wall' },
      ] },
      { label: 'CONTACT', href: '/#contact' },
      { label: 'JOIN US', href: '/joinus' },
    ]);
  });
  it('maps the mobile menu separately (Wix can hide items on mobile)', () => {
    expect(out.site.mobileMenu).toEqual([
      { label: 'HOME', href: '/' },
      { label: 'PROJECTS', href: '/projects', items: [{ label: 'Notter', href: '/notter' }] },
      { label: 'ABOUT', href: '/about' },
    ]);
  });
  it('keeps the social icons with their own targets', () => {
    expect(out.site.menuSocial).toEqual([
      { src: '../../assets/wix/ce6ec7c11b174c0581e20f42bb865ce3.png', alt: 'Facebook', href: 'https://www.facebook.com/achates360/' },
    ]);
  });
  it('leaves out links to pages the snapshot does not have, with a warning per menu', () => {
    expect(out.warnings).toEqual([
      'menu: "Brand New" -> /brand-new-page is not in the snapshot (added on the live site after the export) — left out',
      'mobileMenu: "Brand New" -> /brand-new-page is not in the snapshot (added on the live site after the export) — left out',
    ]);
  });
  it('turns the mobile-only text into the home mobileHeading', () => {
    expect(out.home).toEqual({ mobileHeading: '## Projects' });
  });
  it('links an unknown anchor to / and warns', () => {
    const r = toChrome({ ...capture, desktop: { popupHtml, anchors: {} } }, { homeRaw, knownPaths });
    expect(r.site.menu[2]).toEqual({ label: 'CONTACT', href: '/' });
    expect(r.warnings.some((w) => w.includes('dataItem-ivmfd1ta'))).toBe(true);
  });
});

describe('homeTarget', () => {
  it('resolves a homepage section to its clone id', () => {
    expect(homeTarget(homeRaw, contactSection)).toBe('contact');
    expect(homeTarget(homeRaw, 'comp-nope')).toBeNull();
  });
});

describe('setFrontmatterKeys', () => {
  const before = toFrontmatter({ logo: { src: 'a.png', alt: 'Logo' }, footer: [{ type: 'text', md: '##### Hi' }] });
  it('adds only the given keys and leaves every other line as it was', () => {
    const after = setFrontmatterKeys(before, { menu: [{ label: 'HOME', href: '/' }] }, CHROME_KEYS.site);
    expect(after.startsWith(before.slice(0, -4))).toBe(true);
    expect(after.slice(before.length - 4)).toBe('menu:\n  - label: HOME\n    href: /\n---\n');
  });
  it('is idempotent and removes a key the new capture no longer has', () => {
    const once = setFrontmatterKeys(before, { menu: [{ label: 'HOME', href: '/' }] }, CHROME_KEYS.site);
    expect(setFrontmatterKeys(once, { menu: [{ label: 'HOME', href: '/' }] }, CHROME_KEYS.site)).toBe(once);
    expect(setFrontmatterKeys(once, {}, CHROME_KEYS.site)).toBe(before);
  });
});
