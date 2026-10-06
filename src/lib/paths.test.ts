import { describe, it, expect } from 'vitest';
import { withBase, mediaUrl } from './paths';

const B = '/achates360-website';

describe('withBase', () => {
  it('prefixes internal paths', () => {
    expect(withBase('/dxv', B)).toBe('/achates360-website/dxv');
  });
  it('maps home to the bare base', () => {
    expect(withBase('/', B)).toBe('/achates360-website');
  });
  it('keeps home as / when there is no base', () => {
    expect(withBase('/', '/')).toBe('/');
    expect(withBase('/dxv', '/')).toBe('/dxv');
  });
  it('tolerates a trailing slash on the base', () => {
    expect(withBase('/dxv', B + '/')).toBe('/achates360-website/dxv');
  });
  it('leaves mailto, tel, external and hash-only links alone', () => {
    expect(withBase('mailto:hello@achates360.com', B)).toBe('mailto:hello@achates360.com');
    expect(withBase('tel:+6598462443', B)).toBe('tel:+6598462443');
    expect(withBase('https://vimeo.com/x', B)).toBe('https://vimeo.com/x');
    expect(withBase('#contact', B)).toBe('#contact');
  });
});

describe('mediaUrl', () => {
  it('resolves a public media path under the base', () => {
    expect(mediaUrl('media/video/abc.mp4', B)).toBe('/achates360-website/media/video/abc.mp4');
    expect(mediaUrl('/cards/angeline.vcf', B)).toBe('/achates360-website/cards/angeline.vcf');
  });
});
