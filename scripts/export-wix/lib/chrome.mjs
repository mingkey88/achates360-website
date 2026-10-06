import * as cheerio from 'cheerio';
import { normalizeHref, mediaFileName, imgRef } from './urls.mjs';
import { htmlToMarkdown } from './clean.mjs';
import { homeTarget } from './map.mjs';

/** The content keys the chrome capture owns, per content file (scripts/export-wix/chrome.mjs). */
export const CHROME_KEYS = { site: ['menu', 'mobileMenu', 'menuSocial'], home: ['mobileHeading'] };

const pathOf = (href) => href.split('#')[0] || '/';

/**
 * Map a chrome capture (chrome.mjs: captureChrome, cached as .cache/rendered/home.chrome.json)
 * to content fields.
 * - site.menu: the desktop lightbox menu, [{ label, href, items? }] (labels verbatim);
 * - site.mobileMenu: Wix's mobile menu, same shape (Wix lets an item be hidden on mobile, so the
 *   two lists can differ);
 * - site.menuSocial: the lightbox's social icons, [{ src, alt, href }];
 * - home.mobileHeading: Markdown of the text Wix's mobile homepage adds (the "Projects" heading).
 * An internal link to a page the snapshot does not have (added on Wix after the export) is left
 * out with a warning, so the clone never links to a page it does not serve. `knownPaths`: every
 * path the snapshot builds or knowingly leaves out (known-missing.json).
 */
export function toChrome(raw, { homeRaw, knownPaths }) {
  const warnings = [];
  const keep = (where) => (item) => {
    if (!item.href.startsWith('/') || knownPaths.has(pathOf(item.href))) return true;
    warnings.push(`${where}: "${item.label}" -> ${item.href} is not in the snapshot (added on the live site after the export) — left out`);
    return false;
  };
  const link = ($a) => {
    const href = normalizeHref($a.attr('href') ?? '');
    const anchor = $a.attr('data-anchor');
    if (!anchor || href !== '/') return { label: $a.text().trim(), href };
    // A Wix anchor on the homepage: the capture recorded the section it scrolls to.
    const section = raw.desktop.anchors?.[anchor];
    const key = section && homeTarget(homeRaw, section);
    if (!key) warnings.push(`menu: anchor ${anchor} ("${$a.text().trim()}") matches no homepage section — linked to /`);
    return { label: $a.text().trim(), href: key ? `/#${key}` : href };
  };
  const withItems = (item, items, where) => {
    const kept = items.filter(keep(where));
    return kept.length ? { ...item, items: kept } : item;
  };

  let $ = cheerio.load(raw.desktop.popupHtml);
  const menu = $('nav ul[id$="itemsContainer"]').first().children('li').map((_, li) => {
    const $a = $(li).children('a[href]').first();
    if (!$a.length) return null; // Wix's empty "more" slot
    return withItems(link($a), $(li).find('ul a[href]').map((_, a) => link($(a))).get(), 'menu');
  }).get().filter(keep('menu'));
  const menuSocial = $('a[href]').filter((_, a) => $(a).closest('nav').length === 0 && $(a).find('img').length > 0).map((_, a) => {
    const $img = $(a).find('img').first();
    return { src: imgRef(mediaFileName($img.attr('src'))), alt: $img.attr('alt') ?? '', href: normalizeHref($(a).attr('href')) };
  }).get();

  $ = cheerio.load(raw.mobile.menuHtml);
  const mobileMenu = $('li[data-testid^="tinymenu-item-"]').map((_, li) => {
    const $a = $(li).find('a[href]').filter((_, a) => !$(a).closest('li[data-testid^="tinymenu-subitem-"]').length).first();
    if (!$a.length) return null;
    const items = $(li).find('li[data-testid^="tinymenu-subitem-"] a[href]').map((_, a) => link($(a))).get();
    return withItems(link($a), items, 'mobileMenu');
  }).get().filter(keep('mobileMenu'));

  const mobileMd = (raw.mobile.mobileTexts ?? []).map((t) => htmlToMarkdown(t.html)).filter(Boolean);
  if (mobileMd.length > 1) warnings.push(`home: ${mobileMd.length} mobile-only texts; only the first is kept: ${mobileMd.slice(1).join(' / ')}`);

  return {
    site: { menu, mobileMenu, menuSocial },
    home: mobileMd.length ? { mobileHeading: mobileMd[0] } : {},
    warnings,
  };
}
