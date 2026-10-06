import * as cheerio from 'cheerio';
import { mediaFileName, parseEmbed, normalizeHref, bestQuality } from './urls.mjs';
import { findRoutes, findGalleries, normalizeGalleryItem } from './wixdata.mjs';

const SELECTOR = [
  '[data-testid="richTextElement"]', 'img', 'iframe', '[data-video-info]', 'a[href]',
  '[data-hook="item-container"]', '.wixui-anchor-menu', 'form',
].join(', ');

// Wix writes some hrefs with literal spaces (e.g. `mailto:…?subject=From e-card`);
// a browser serialises those as %20, so do the same before normalising.
const toHref = (raw) => normalizeHref(raw.trim().replace(/[\t\n\r]/g, '').replace(/ /g, '%20'));

const readJson = ($, id) => {
  const raw = $(`#${id}`).text();
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

export function extractRoutes(html) {
  return findRoutes(readJson(cheerio.load(html), 'wix-viewer-model'));
}

export function extractPage(html, slug) {
  const $ = cheerio.load(html);
  const routes = findRoutes(readJson($, 'wix-viewer-model'));
  const galleryData = findGalleries(readJson($, 'wix-warmup-data'));
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
        section: $el.closest('section[id^="comp-"]').attr('id') ?? null,
      };
      const inGallery = $el.closest('[data-hook="item-container"]').length > 0;
      const inForm = $el.closest('form').length > 0 && !$el.is('form');
      const inMenu = $el.closest('.wixui-anchor-menu').length > 0 && !$el.is('.wixui-anchor-menu');
      const inRichText = $el.parents('[data-testid="richTextElement"]').length > 0;

      if ($el.is('form')) {
        nodes.push({ kind: 'form', ...base, ...readForm($, $el) });
      } else if ($el.is('.wixui-anchor-menu')) {
        nodes.push({ kind: 'anchorMenu', ...base, items: readMenu($, $el) });
      } else if ($el.is('[data-hook="item-container"]')) {
        const galleryComp = $el.closest('[id^="comp-"]').attr('id');
        if (seenGalleries.has(galleryComp)) return;
        seenGalleries.add(galleryComp);
        const items = readGallery($, galleryComp, galleryData.get(galleryComp) ?? [], routes);
        for (const it of items) if (it.video) videos.set(it.video.videoId, it.video.quality);
        nodes.push({ kind: 'gallery', ...base, comp: galleryComp, items });
      } else if (inGallery || inForm || inMenu) {
        // owned by the gallery / form / menu node
      } else if ($el.is('[data-testid="richTextElement"]')) {
        const links = $el.find('a[href]').map((_, a) => ({ href: toHref($(a).attr('href')), text: $(a).text().trim() })).get();
        nodes.push({ kind: 'text', ...base, html: $el.html() ?? '', text: $el.text().replace(/\s+/g, ' ').trim(), links });
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
        nodes.push({ kind: 'image', ...base, file, alt: $el.attr('alt') ?? '', href: a.length ? toHref(a.attr('href')) : null });
      } else if ($el.is('a[href]')) {
        if (inRichText || $el.find('img').length) return;
        const text = $el.text().trim();
        if (!text) return;
        nodes.push({ kind: 'link', ...base, href: toHref($el.attr('href')), text });
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

  return {
    slug,
    seo,
    nodes: walk($('#PAGES_CONTAINER')),
    footer: walk($('#SITE_FOOTER')),
    chrome: walk(chromeRoot),
    videos,
  };
}

function readMenu($, $menu) {
  return $menu.find('a[data-anchor-comp-id]').map((_, a) => {
    const id = $(a).attr('data-anchor-comp-id');
    let target;
    if (id === 'PAGE_TOP_ANCHOR') target = 'top';
    else if (id === 'SITE_FOOTER') target = 'footer';
    else target = $(`#${id}`).closest('section[id^="comp-"]').attr('id') ?? id;
    return { label: $(a).text().trim(), target };
  }).get();
}

function readGallery($, comp, data, routes) {
  const byId = new Map(data.map((d) => [d.itemId, normalizeGalleryItem(d, routes)]));
  const items = [];
  $(`#${comp}`).find('[data-hook="item-container"]').each((_, el) => {
    const id = $(el).attr('data-id');
    const domSrc = $(el).find('img').attr('src');
    const domFile = domSrc && /wixstatic\.com\/media\//.test(domSrc) ? mediaFileName(domSrc) : null;
    const known = byId.get(id);
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
  return { fields, groups, submitLabel: $form.find('button').last().text().trim() };
}
