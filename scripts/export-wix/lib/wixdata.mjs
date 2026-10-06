import { bestQuality, videoIdFromPoster } from './urls.mjs';

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

export function normalizeGalleryItem(item, routes) {
  const md = item.metaData ?? {};
  const link = md.link ?? {};
  const pageId = link.data?.pageId?.replace(/^#/, '');
  const href = pageId ? routes.get(pageId) ?? null : link.url ?? null;
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
