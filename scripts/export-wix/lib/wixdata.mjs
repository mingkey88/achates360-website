import { bestQuality, videoIdFromPoster, mediaFileName, normalizeHref } from './urls.mjs';

function walk(obj, visit) {
  if (!obj || typeof obj !== 'object') return;
  visit(obj);
  for (const v of Object.values(obj)) walk(v, visit);
}

export function findRoutes(viewerModel) {
  const routes = new Map();
  walk(viewerModel, (o) => {
    for (const [key, val] of Object.entries(o)) {
      if (key.startsWith('./') && val && typeof val === 'object' && typeof val.pageId === 'string') {
        const path = key === './' ? '/' : '/' + key.slice(2);
        if (!routes.has(val.pageId)) routes.set(val.pageId, path);
      }
    }
  });
  return routes;
}

export function findGalleries(warmup) {
  const galleries = new Map();
  walk(warmup, (o) => {
    for (const [key, val] of Object.entries(o)) {
      if (key.endsWith('_galleryData') && Array.isArray(val?.items)) {
        galleries.set(key.replace(/_galleryData$/, ''), val.items);
      }
    }
  });
  return galleries;
}

// pro-gallery-webapp (/pro-gallery-webapp/v1/galleries/<id>?offset=…) returns items as
// { id, mediaUrl, title, description, alt, dataType, link: { url, wixLinkData }, videoMetadata };
// convert them to the embedded #wix-warmup-data shape { itemId, mediaUrl, metaData }.
function fromWebapp(it) {
  const isVideo = it.dataType === 'Video';
  const pageId = it.link?.wixLinkData?.page?.pageId;
  let link;
  // Keep the URL beside the pageId: it still resolves if the pageId is missing from the route map.
  if (pageId) link = { type: 'wix', data: { type: 'PageLink', pageId, url: it.link.url } };
  else if (it.link?.url) link = { type: 'wix', data: { type: 'ExternalLink', url: it.link.url } };
  const metaData = { title: it.title, description: it.description, alt: it.alt, name: it.name, link };
  if (isVideo) {
    const vm = it.videoMetadata ?? {};
    Object.assign(metaData, {
      type: 'video',
      posters: (vm.posters ?? []).map((p) => ({ ...p, url: mediaFileName(p.url) })),
      qualities: (vm.resolutions ?? []).map((r) => ({ quality: r.videoMode })),
    });
  }
  return { itemId: it.id, mediaUrl: isVideo ? undefined : mediaFileName(it.mediaUrl ?? ''), metaData };
}

// Every gallery item found anywhere in obj, in either the embedded or the network shape.
export function findGalleryItems(obj) {
  const items = new Map();
  walk(obj, (o) => {
    if (typeof o.itemId === 'string' && o.metaData && typeof o.metaData === 'object') {
      if (!items.has(o.itemId)) items.set(o.itemId, o);
    } else if (typeof o.id === 'string' && typeof o.mediaUrl === 'string' && typeof o.dataType === 'string') {
      if (!items.has(o.id)) items.set(o.id, fromWebapp(o));
    }
  });
  return [...items.values()];
}

export function normalizeGalleryItem(item, routes) {
  const md = item.metaData ?? {};
  const link = md.link ?? {};
  const pageId = link.data?.pageId?.replace(/^#/, '');
  const url = link.data?.url ?? link.url ?? null;
  const raw = pageId ? routes.get(pageId) ?? url : url;
  const href = raw === null ? null : normalizeHref(raw);
  const isVideo = md.type === 'video';
  const file = isVideo ? md.posters?.[0]?.url ?? '' : item.mediaUrl ?? md.name ?? '';
  return {
    itemId: item.itemId,
    title: md.title ?? '',
    description: md.description ?? '',
    href,
    file,
    alt: md.alt ?? '',
    video: isVideo && md.qualities?.length
      ? { videoId: videoIdFromPoster(file), quality: bestQuality(md.qualities) }
      : null,
  };
}
