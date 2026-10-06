export const ORIGIN = 'https://www.achates360.com';
export const IMG_PREFIX = '../../assets/wix/';

export function mediaFileName(src) {
  const decoded = decodeURIComponent(src);
  const m = decoded.match(/\/media\/([^/?#]+)/);
  return m ? m[1] : decoded.split('/').pop().split('?')[0];
}

export const originalImageUrl = (file) => `https://static.wixstatic.com/media/${file}`;
export const localName = (file) => file.replace('~mv2', '');
export const imgRef = (file) => IMG_PREFIX + localName(file);

export function bestQuality(qualities) {
  return [...qualities].sort((a, b) => parseInt(b.quality, 10) - parseInt(a.quality, 10))[0].quality;
}

export const videoFileUrl = (videoId, quality) =>
  `https://video.wixstatic.com/video/${videoId}/${quality}/mp4/file.mp4`;
export const videoRef = (videoId) => `media/video/${videoId}.mp4`;
export const videoIdFromPoster = (file) => file.replace(/f\d{3}\.jpg$/, '');

export function parseEmbed(src) {
  const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
  if (yt) return { provider: 'youtube', id: yt[1] };
  const vm = src.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (vm) return { provider: 'vimeo', id: vm[1] };
  return null;
}

export function internalPath(href) {
  let u;
  try { u = new URL(href); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  if (u.hostname.replace(/^www\./, '') !== 'achates360.com') return null;
  // Wix gallery link URLs can carry a doubled slash (https://www.achates360.com//dxv).
  const path = u.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
  return path + u.hash;
}

// Wix writes some hrefs with literal spaces (e.g. `mailto:…?subject=From e-card`);
// a browser serialises those as %20, so do the same.
const serialiseHref = (href) => href.trim().replace(/[\t\n\r]/g, '').replace(/ /g, '%20');

export const normalizeHref = (href) => {
  const h = serialiseHref(href);
  return internalPath(h) ?? h;
};
