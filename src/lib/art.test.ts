import { describe, expect, it } from 'vitest';
import { checkArt, media, paragraphs, subheading } from './art';

const blocks = [
  { type: 'text', md: 'One.\n\n**A heading**\n\nTwo.' },
  { type: 'image', src: 'a.jpg', alt: 'a' },
  { type: 'gallery', items: [{ thumb: 'b.jpg', alt: '' }, { thumb: 'c.jpg', alt: '' }] },
  { type: 'text', md: 'Three.' },
  { type: 'video', src: 'v.mp4', poster: 'p.jpg' },
  { type: 'link', label: 'Back', href: '/' },
];

describe('paragraphs and media', () => {
  it('splits the text blocks at blank lines, in page order', () => {
    expect(paragraphs(blocks)).toEqual(['One.', '**A heading**', 'Two.', 'Three.']);
  });
  it('lists pictures and films in page order, gallery items included', () => {
    expect(media(blocks).map((m) => `${m.kind}:${m.src}`)).toEqual(['image:a.jpg', 'image:b.jpg', 'image:c.jpg', 'video:v.mp4']);
  });
});

describe('subheading', () => {
  it('reads a bold-only paragraph as a subheading', () => {
    expect(subheading('**Refining the Guest Experience**')).toBe('Refining the Guest Experience');
  });
  it('leaves other paragraphs alone', () => {
    expect(subheading('Some **bold** words')).toBeNull();
    expect(subheading('**One** and **two**')).toBeNull();
  });
});

describe('checkArt', () => {
  it('accepts a layout that uses everything once', () => {
    expect(checkArt({ sections: [{ text: [0, 1, 2] }, { text: [3], media: [0], layout: 'beside' }, { media: [1, 2, 3], layout: 'trio' }] }, 4, 4)).toEqual([]);
  });
  it('reports missing, repeated and unknown items', () => {
    const p = checkArt({ sections: [{ text: [0, 0, 5] }, { media: [1] }] }, 2, 2);
    expect(p).toContain('paragraph 0 is used 2 times');
    expect(p).toContain('paragraph 5 does not exist (the page has 2)');
    expect(p).toContain('paragraph 1 is not used');
    expect(p).toContain('picture 0 is not used');
  });
  it('reports empty sections and side-by-side sections missing a half', () => {
    const p = checkArt({ sections: [{}, { text: [0], layout: 'beside' }] }, 1, 0);
    expect(p).toContain('section 0 is empty');
    expect(p).toContain('section 1: "beside" needs both text and media');
  });
});
