import { meta } from './img';
import type { Media } from './art';

/** A case study picture's width ÷ height: images by their size, films by their poster, embedded players 16:9. */
export function mediaRatio(m: Media): number {
  const img = m.kind === 'image' ? m.src : m.kind === 'video' ? m.poster : undefined;
  if (!img || typeof img !== 'object') return 16 / 9;
  const { width, height } = meta(img);
  return width && height ? width / height : 16 / 9;
}
