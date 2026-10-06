import * as cheerio from 'cheerio';
import { mediaFileName, parseEmbed, normalizeHref, bestQuality } from './urls.mjs';
import { findRoutes, findGalleries, findGalleryItems, normalizeGalleryItem } from './wixdata.mjs';

const SELECTOR = [
  '[data-testid="richTextElement"]', 'img', 'iframe', '[data-video-info]', 'a[href]',
  '[data-hook="item-container"]', '.wixui-anchor-menu', 'form', '[data-player-src]',
].join(', ');

// Layout annotations written by render.mjs at the 1440x900 desktop render (and the iPhone 13
// render for data-mbox): "x,y,w,h" in CSS px, document coordinates. Absent on old renders.
function parseBox(attr) {
  if (!attr) return undefined;
  const [x, y, w, h] = attr.split(',').map(Number);
  return [x, y, w, h].every(Number.isFinite) ? { x, y, w, h } : undefined;
}
// Both boxes come from the same component, so a component Wix hides on mobile never borrows
// the mobile box of the section around it.
function layoutOf($el) {
  const $comp = $el.closest('[data-box]');
  const box = parseBox($comp.attr('data-box'));
  const mbox = parseBox($comp.attr('data-mbox'));
  return { ...(box ? { box } : {}), ...(mbox ? { mbox } : {}) };
}

// A Wix-hosted player's file: https://video.wixstatic.com/video/<videoId>/<quality>/mp4/file.mp4
const WIX_VIDEO = /^https:\/\/video\.wixstatic\.com\/video\/([^/]+)\/(\d+p)\//;

const readJson = ($, id) => {
  const raw = $(`#${id}`).text();
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

export function extractRoutes(html) {
  return findRoutes(readJson(cheerio.load(html), 'wix-viewer-model'));
}

// sidecar: parsed bodies of the gallery-data network responses render.mjs recorded
// (<slug>.gallery.json). Wix embeds only the first items of a gallery in the page;
// the rest arrive over the network, so they are the fallback for missing items.
export function extractPage(html, slug, sidecar = []) {
  const $ = cheerio.load(html);
  const routes = findRoutes(readJson($, 'wix-viewer-model'));
  const galleryData = findGalleries(readJson($, 'wix-warmup-data'));
  const loadedItems = new Map(findGalleryItems(sidecar).map((it) => [it.itemId, it]));
  const videos = new Map();

  const seo = {
    title: $('head > title').first().text(),
    description: $('meta[name="description"]').attr('content') ?? '',
    ogImage: $('meta[property="og:image"]').attr('content')
      ? mediaFileName($('meta[property="og:image"]').attr('content')) : null,
  };

  const walk = (root) => {
    const nodes = [];
    const seenGalleries = new Set();
    const bgVideoIds = new Set();
    root.find('[data-video-info]').each((_, el) => {
      try { bgVideoIds.add(JSON.parse($(el).attr('data-video-info')).videoId); } catch { /* not JSON */ }
    });

    root.find(SELECTOR).each((_, el) => {
      const $el = $(el);
      const base = {
        comp: $el.closest('[id^="comp-"]').attr('id') ?? null,
        section: outerSection($, $el),
        ...layoutOf($el),
      };
      const inGallery = $el.closest('[data-hook="item-container"]').length > 0;
      const inForm = $el.closest('form').length > 0 && !$el.is('form');
      const inMenu = $el.closest('.wixui-anchor-menu').length > 0 && !$el.is('.wixui-anchor-menu');
      const inRichText = $el.parents('[data-testid="richTextElement"]').length > 0;
      const inPlayer = $el.closest('[data-player-src]').length > 0 && !$el.is('[data-player-src]');

      if ($el.is('form')) {
        nodes.push({ kind: 'form', ...base, ...readForm($, $el) });
      } else if ($el.is('.wixui-anchor-menu')) {
        nodes.push({ kind: 'anchorMenu', ...base, items: readMenu($, $el) });
      } else if ($el.is('[data-hook="item-container"]')) {
        const galleryComp = $el.closest('[id^="comp-"]').attr('id');
        if (seenGalleries.has(galleryComp)) return;
        seenGalleries.add(galleryComp);
        const items = readGallery($, galleryComp, galleryData.get(galleryComp) ?? [], loadedItems, routes);
        for (const it of items) if (it.video) videos.set(it.video.videoId, it.video.quality);
        nodes.push({ kind: 'gallery', ...base, ...layoutOf($(`#${galleryComp}`)), comp: galleryComp, items });
      } else if (inGallery || inForm || inMenu || inPlayer) {
        // owned by the gallery / form / menu / player node
      } else if ($el.is('[data-player-src]')) {
        const src = $el.attr('data-player-src');
        const m = src.match(WIX_VIDEO);
        const posterUrl = $el.attr('data-player-poster') ?? '';
        const poster = /wixstatic\.com\/media\//.test(posterUrl) ? mediaFileName(posterUrl) : m ? `${m[1]}f000.jpg` : null;
        if (m) videos.set(m[1], videos.has(m[1]) ? bestQuality([{ quality: videos.get(m[1]) }, { quality: m[2] }]) : m[2]);
        nodes.push({ kind: 'player', ...base, src, videoId: m ? m[1] : null, quality: m ? m[2] : null, poster });
      } else if ($el.is('[data-testid="richTextElement"]')) {
        const color = $el.attr('data-color');
        nodes.push({ kind: 'text', ...base, ...readRichText($, $el), ...(color ? { color } : {}) });
      } else if ($el.is('[data-video-info]')) {
        let info;
        try { info = JSON.parse($el.attr('data-video-info')); } catch { return; }
        if (!info.qualities?.length) return;
        const quality = bestQuality(info.qualities);
        videos.set(info.videoId, quality);
        nodes.push({ kind: 'bgvideo', ...base, videoId: info.videoId, quality, poster: `${info.videoId}f000.jpg` });
      } else if ($el.is('iframe')) {
        const embed = parseEmbed($el.attr('src') ?? '');
        if (embed) nodes.push({ kind: 'embed', ...base, ...embed });
      } else if ($el.is('img')) {
        if (inRichText) return;
        const src = $el.attr('src') ?? '';
        if (!/wixstatic\.com\/media\//.test(src)) return;
        const file = mediaFileName(src);
        if ([...bgVideoIds].some((id) => file.startsWith(id))) return; // poster frame
        const a = $el.closest('a[href]');
        nodes.push({ kind: 'image', ...base, file, alt: $el.attr('alt') ?? '', href: a.length ? normalizeHref(a.attr('href')) : null });
      } else if ($el.is('a[href]')) {
        if (inRichText || $el.find('img').length) return;
        const text = $el.text().trim();
        if (!text) return;
        nodes.push({ kind: 'link', ...base, href: normalizeHref($el.attr('href')), text });
      }
    });
    return nodes;
  };

  // Chrome = components holding images/links outside the page and footer (the logo).
  // Collect each component once (an <a> and its <img> share one), outermost only.
  const chromeComps = [];
  $('body').find('img, a[href]').each((_, el) => {
    if ($(el).closest('#PAGES_CONTAINER, #SITE_FOOTER').length) return;
    const comp = $(el).closest('[id^="comp-"]').get(0);
    if (comp && !chromeComps.includes(comp)) chromeComps.push(comp);
  });
  const chromeRoot = $('<div></div>');
  for (const comp of chromeComps) {
    if (!chromeComps.some((other) => other !== comp && $(comp).parents().is(other))) chromeRoot.append($(comp).clone());
  }

  const pageBackground = $('body').attr('data-page-bg');
  return {
    slug,
    seo,
    ...(pageBackground ? { pageBackground } : {}),
    nodes: walk($('#PAGES_CONTAINER')),
    footer: walk($('#SITE_FOOTER')),
    chrome: walk(chromeRoot),
    videos,
  };
}

// Wix nests sections (an outer page section wrapping an inner one). Anchors sit in the outer
// section beside the inner one, so both nodes and menu targets use the outermost section.
const SECTION = 'section[id^="comp-"]';
function outerSection($, $el) {
  const outer = $el.parents(SECTION).last();
  if (outer.length) return outer.attr('id');
  return $el.is(SECTION) ? $el.attr('id') : null;
}

function readRichText($, $el) {
  const links = $el.find('a[href]').map((_, a) => ({ href: normalizeHref($(a).attr('href')), text: $(a).text().trim() })).get();
  return { html: $el.html() ?? '', text: $el.text().replace(/\s+/g, ' ').trim(), links };
}

function readMenu($, $menu) {
  return $menu.find('a[data-anchor-comp-id]').map((_, a) => {
    const id = $(a).attr('data-anchor-comp-id');
    let target;
    if (id === 'PAGE_TOP_ANCHOR') target = 'top';
    else if (id === 'SITE_FOOTER') target = 'footer';
    else target = outerSection($, $(`#${id}`)) ?? id;
    return { label: $(a).text().trim(), target };
  }).get();
}

function readGallery($, comp, data, loadedItems, routes) {
  const byId = new Map(data.map((d) => [d.itemId, normalizeGalleryItem(d, routes)]));
  const items = [];
  $(`#${comp}`).find('[data-hook="item-container"]').each((_, el) => {
    const id = $(el).attr('data-id');
    const domSrc = $(el).find('img').attr('src');
    const domFile = domSrc && /wixstatic\.com\/media\//.test(domSrc) ? mediaFileName(domSrc) : null;
    const known = byId.get(id) ?? (loadedItems.has(id) ? normalizeGalleryItem(loadedItems.get(id), routes) : undefined);
    items.push(known
      ? { ...known, file: domFile ?? known.file }
      : { itemId: id, title: $(el).find('[data-hook="item-title"]').text().trim(),
          description: $(el).find('[data-hook="item-description"]').text().trim(),
          href: null, file: domFile ?? '', alt: $(el).find('img').attr('alt') ?? '', video: null });
    byId.delete(id);
  });
  // Items Wix did not render into the DOM (lazy) keep their data order.
  return [...items, ...byId.values()];
}

function readForm($, $form) {
  const fields = $form.find('input[type="text"], input[type="email"], input[type="tel"], textarea').map((_, el) => {
    const $el = $(el);
    return {
      name: $el.attr('name') ?? '',
      type: el.tagName === 'textarea' ? 'textarea' : $el.attr('type'),
      label: $form.find(`label[for="${$el.attr('id')}"]`).text().trim(),
      required: $el.attr('required') !== undefined,
      placeholder: $el.attr('placeholder') ?? '',
    };
  }).get();
  const groups = $form.find('fieldset').map((_, fs) => {
    const $fs = $(fs);
    const inputs = $fs.find('input[type="checkbox"], input[type="radio"]');
    return {
      name: inputs.first().attr('name') ?? '',
      // Own text only: drops the "*" indicator span and the screen-reader-only " Required" span.
      label: $fs.find('[data-testid="label"]').first().contents().filter((_, n) => n.type === 'text').text().trim(),
      required: inputs.first().attr('required') !== undefined,
      options: $fs.find('[data-testid="text"]').map((_, t) => $(t).text().trim()).get(),
    };
  }).get();
  // Rich text inside the form, e.g. the "Thanks for submitting!" success message.
  const texts = $form.find('[data-testid="richTextElement"]').map((_, el) => readRichText($, $(el))).get();
  return { fields, groups, texts, submitLabel: $form.find('button').last().text().trim() };
}
