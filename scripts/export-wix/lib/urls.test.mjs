import { describe, it, expect } from 'vitest';
import {
  mediaFileName, originalImageUrl, localName, imgRef, bestQuality, videoFileUrl,
  videoRef, videoIdFromPoster, parseEmbed, internalPath, normalizeHref,
} from './urls.mjs';

const T = 'https://static.wixstatic.com/media/dd7c1d_44ac45ce8677434da8641594701de7c0~mv2.jpg/v1/fill/w_1727,h_900,al_c,q_85,enc_avif,quality_auto/dd7c1d_44ac45ce8677434da8641594701de7c0~mv2.jpg';

describe('media file names', () => {
  it('extracts the file from a transform URL', () => {
    expect(mediaFileName(T)).toBe('dd7c1d_44ac45ce8677434da8641594701de7c0~mv2.jpg');
  });
  it('decodes %7E and accepts bare names', () => {
    expect(mediaFileName('https://static.wixstatic.com/media/e9d9c2_c6c4%7Emv2.png/v1/fit/w_2500/x.png')).toBe('e9d9c2_c6c4~mv2.png');
    expect(mediaFileName('9766c0_abcf000.jpg')).toBe('9766c0_abcf000.jpg');
  });
  it('builds the original URL', () => {
    expect(originalImageUrl('dd7c1d_44ac~mv2.jpg')).toBe('https://static.wixstatic.com/media/dd7c1d_44ac~mv2.jpg');
  });
  it('drops ~mv2 locally and prefixes refs', () => {
    expect(localName('dd7c1d_44ac~mv2.jpg')).toBe('dd7c1d_44ac.jpg');
    expect(imgRef('dd7c1d_44ac~mv2.jpg')).toBe('../../assets/wix/dd7c1d_44ac.jpg');
  });
});

describe('video helpers', () => {
  it('picks the highest quality', () => {
    expect(bestQuality([{ quality: '480p' }, { quality: '1080p' }, { quality: '720p' }])).toBe('1080p');
  });
  it('builds file URL and local ref', () => {
    expect(videoFileUrl('e9d9c2_fc66', '720p')).toBe('https://video.wixstatic.com/video/e9d9c2_fc66/720p/mp4/file.mp4');
    expect(videoRef('e9d9c2_fc66')).toBe('media/video/e9d9c2_fc66.mp4');
  });
  it('derives a video id from a poster frame', () => {
    expect(videoIdFromPoster('9766c0_d7653d55673a48afa5a77e57faf2ee44f003.jpg')).toBe('9766c0_d7653d55673a48afa5a77e57faf2ee44');
  });
});

describe('parseEmbed', () => {
  it('reads YouTube and Vimeo player URLs', () => {
    expect(parseEmbed('https://www.youtube.com/embed/J-LCPzZ9T4g?autoplay=1')).toEqual({ provider: 'youtube', id: 'J-LCPzZ9T4g' });
    expect(parseEmbed('https://player.vimeo.com/video/766942392?title=0')).toEqual({ provider: 'vimeo', id: '766942392' });
  });
  it('returns null for anything else', () => {
    expect(parseEmbed('https://example.com/embed/x')).toBeNull();
  });
});

describe('internalPath / normalizeHref', () => {
  it('normalises site URLs to paths', () => {
    expect(internalPath('https://www.achates360.com')).toBe('/');
    expect(internalPath('https://www.achates360.com/')).toBe('/');
    expect(internalPath('https://www.achates360.com/dxv')).toBe('/dxv');
    expect(internalPath('https://achates360.com/notter/')).toBe('/notter');
  });
  it('returns null for external, mailto and tel', () => {
    expect(internalPath('https://drivenxdesign.com/NYC21/project.asp?ID=22036')).toBeNull();
    expect(internalPath('mailto:hello@achates360.com')).toBeNull();
    expect(internalPath('tel:+6596853533')).toBeNull();
  });
  it('normalizeHref keeps non-internal links verbatim', () => {
    expect(normalizeHref('mailto:jamillie@achates360.com?subject=From%20e-card')).toBe('mailto:jamillie@achates360.com?subject=From%20e-card');
    expect(normalizeHref('https://www.achates360.com/projects')).toBe('/projects');
  });
});
