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
  const path = u.pathname.replace(/\/$/, '') || '/';
  return path + u.hash;
}

export const normalizeHref = (href) => internalPath(href) ?? href;
