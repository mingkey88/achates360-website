import { describe, expect, it } from 'vitest';
import { embedSrc } from './embed';

const params = (u: string) => Object.fromEntries(new URL(u).searchParams);

describe('embedSrc', () => {
  it('Vimeo autoplays muted and loops, so its end screen never shows', () => {
    const u = embedSrc('vimeo', '123', true);
    expect(u.startsWith('https://player.vimeo.com/video/123?')).toBe(true);
    expect(params(u)).toMatchObject({ autoplay: '1', muted: '1', loop: '1', title: '0', byline: '0', portrait: '0', dnt: '1' });
  });
  it('YouTube autoplays muted and loops (loop needs the video as its own playlist)', () => {
    const u = embedSrc('youtube', 'abc', true);
    expect(u.startsWith('https://www.youtube-nocookie.com/embed/abc?')).toBe(true);
    expect(params(u)).toMatchObject({ autoplay: '1', mute: '1', loop: '1', playlist: 'abc', rel: '0' });
  });
  it('without autoplay neither starts or loops on its own', () => {
    for (const u of [embedSrc('vimeo', '1', false), embedSrc('youtube', 'x', false)]) {
      const p = params(u);
      expect(p.autoplay).toBeUndefined();
      expect(p.loop).toBeUndefined();
    }
    expect(params(embedSrc('youtube', 'x', false)).rel).toBe('0');
  });
});

describe('embedSrc with an unlisted Vimeo film', () => {
  it('puts the private key first in the player link', () => {
    expect(embedSrc('vimeo', '1232919536', false, '5f308451cb')).toMatch(/^https:\/\/player\.vimeo\.com\/video\/1232919536\?h=5f308451cb&title=0/);
    expect(embedSrc('vimeo', '766942392', false)).not.toContain('h=');
  });
});
