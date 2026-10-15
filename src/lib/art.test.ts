import { describe, expect, it } from 'vitest';
import { arrangeMedia, autoArt, checkArt, links, media, paragraphs, runIn, subheading } from './art';

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
  it('counts a backdrop as a picture used, and needs pictures in front of it', () => {
    expect(checkArt({ sections: [{ media: [1, 2], backdrop: 0, layout: 'pair' }] }, 0, 3)).toEqual([]);
    expect(checkArt({ sections: [{ media: [0, 1], backdrop: 0, layout: 'pair' }] }, 0, 2)).toContain('picture 0 is used 2 times');
    expect(checkArt({ sections: [{ text: [0], backdrop: 0 }] }, 1, 1)).toContain('section 0: a backdrop needs pictures to sit behind');
  });
  it('reports a lead with more than one paragraph (only the first would show)', () => {
    expect(checkArt({ sections: [{ text: [0, 1], layout: 'lead' }] }, 2, 0)).toContain('section 0: "lead" takes exactly one paragraph and no pictures');
  });
});

describe('arrangeMedia', () => {
  const by = (rs: number[]) => (i: number) => rs[i];
  it('sets wide shots full width and keeps their order', () => {
    expect(arrangeMedia([0, 1], by([1.9, 2]))).toEqual([{ media: [0], layout: 'full' }, { media: [1], layout: 'full' }]);
  });
  it('opens a run of wide shots full width, then sets the rest two to a row', () => {
    expect(arrangeMedia([0, 1, 2, 3], by([2.8, 2.8, 2.8, 2.8]))).toEqual([{ media: [0], layout: 'full' }, { media: [1, 2], layout: 'pair' }, { media: [3], layout: 'full' }]);
  });
  it('sets films two to a row, a lone film full width, a portrait film as a portrait', () => {
    const film = () => true;
    expect(arrangeMedia([0, 1, 2], by([16 / 9, 16 / 9, 16 / 9]), film)).toEqual([{ media: [0, 1], layout: 'pair' }, { media: [2], layout: 'full' }]);
    expect(arrangeMedia([0], by([16 / 9]), film)).toEqual([{ media: [0], layout: 'full' }]);
    expect(arrangeMedia([0], by([9 / 16]), film)).toEqual([{ media: [0], layout: 'half' }]);
  });
  it('gathers squares and portraits into grids of four, three, a pair, or one at half width', () => {
    expect(arrangeMedia([0, 1, 2, 3, 4, 5, 6, 7], by(Array(8).fill(1)))).toEqual([{ media: [0, 1, 2, 3, 4, 5, 6, 7], layout: 'grid4' }]);
    expect(arrangeMedia([0, 1, 2, 3, 4, 5], by(Array(6).fill(.8)))).toEqual([{ media: [0, 1, 2, 3, 4, 5], layout: 'trio' }]);
    expect(arrangeMedia([0, 1], by([1, 1]))).toEqual([{ media: [0, 1], layout: 'pair' }]);
    expect(arrangeMedia([0], by([.75]))).toEqual([{ media: [0], layout: 'half' }]);
  });
  it('never leaves one portrait alone on a row: five are three and two, seven four and three', () => {
    expect(arrangeMedia([0, 1, 2, 3, 4], by(Array(5).fill(1)))).toEqual([{ media: [0, 1, 2], layout: 'trio' }, { media: [3, 4], layout: 'pair' }]);
    expect(arrangeMedia([0, 1, 2, 3, 4, 5, 6], by(Array(7).fill(1)))).toEqual([{ media: [0, 1, 2, 3], layout: 'grid4' }, { media: [4, 5, 6], layout: 'trio' }]);
    expect(arrangeMedia([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], by(Array(10).fill(.8)))).toEqual([{ media: [0, 1, 2, 3, 4, 5, 6, 7], layout: 'grid4' }, { media: [8, 9], layout: 'pair' }]);
  });
  it('pairs landscapes, an odd one out full width', () => {
    expect(arrangeMedia([0, 1, 2, 3, 4], by([1.5, 1.4, 1.33, 1.5, 1.6]))).toEqual([{ media: [0, 1, 2, 3], layout: 'pair' }, { media: [4], layout: 'full' }]);
    expect(arrangeMedia([0, 1, 2], by([1.5, 1.5, 1.5]))).toEqual([{ media: [0, 1, 2], layout: 'trio' }]);
  });
  it('starts a new group when the shape changes', () => {
    expect(arrangeMedia([0, 1, 2, 3], by([1, 1, 1.5, 2]))).toEqual([{ media: [0, 1], layout: 'pair' }, { media: [2], layout: 'full' }, { media: [3], layout: 'full' }]);
  });
});

describe('autoArt', () => {
  const ratio = (m: any) => (m.kind === 'image' ? Number(String(m.src).split(':')[1]) : 16 / 9);
  const blocks = [
    { type: 'text', md: 'Lead.\n\n**The brief**\n\nOne.\n\nTwo.' },
    { type: 'gallery', items: [{ thumb: 'a:1' }, { thumb: 'b:1' }, { thumb: 'c:1' }, { thumb: 'd:1' }] },
    { type: 'text', md: 'Three.' },
    { type: 'link', label: 'SHOP', href: 'https://x' },
    { type: 'embed', provider: 'youtube', id: 'z' },
  ];
  const art = autoArt(blocks, ratio);
  it('builds the standard sections in page order', () => {
    expect(art.sections).toEqual([
      { text: [0], layout: 'lead' },
      { text: [1, 2, 3] },
      { media: [0, 1, 2, 3], layout: 'grid4' },
      { text: [4], links: [0] },
      { media: [4], layout: 'full' },
    ]);
  });
  it('uses every paragraph, picture and link exactly once', () => {
    expect(checkArt(art, paragraphs(blocks).length, media(blocks).length, links(blocks).length)).toEqual([]);
  });
});

describe('autoArt, a lone tall picture', () => {
  it('sets it beside the plain passage before it', () => {
    const ratio = (m: any) => Number(String(m.src).split(':')[1]);
    const blocks = [{ type: 'text', md: 'Lead.\n\nOne.' }, { type: 'image', src: 'a:0.8' }, { type: 'text', md: 'Two.' }, { type: 'image', src: 'b:1' }];
    expect(autoArt(blocks, ratio).sections).toEqual([
      { text: [0], layout: 'lead' },
      { text: [1], media: [0], layout: 'beside' },
      { text: [2], media: [1], layout: 'beside-left' },
    ]);
  });
  it('stays at half width when nothing plain comes before it', () => {
    const ratio = (m: any) => Number(String(m.src).split(':')[1]);
    expect(autoArt([{ type: 'text', md: 'Lead.' }, { type: 'image', src: 'a:0.8' }], ratio).sections).toEqual([
      { text: [0], layout: 'lead' }, { media: [0], layout: 'half' },
    ]);
  });
});

describe('Markdown headings', () => {
  it('reads a one-line heading as a subheading, and a heading over text as a run-in', () => {
    expect(subheading('##### Chinese New Year 2021')).toBe('Chinese New Year 2021');
    expect(subheading('##### **About the video**')).toBe('About the video');
    expect(runIn('#### The brief\nWe were asked…')).toEqual({ head: 'The brief', rest: 'We were asked…' });
  });
});

describe('autoArt, a lone tall picture with no passage before it', () => {
  it('sets it beside the plain passage after it', () => {
    const ratio = (m: any) => Number(String(m.src).split(':')[1]);
    const blocks = [{ type: 'text', md: 'Lead.' }, { type: 'image', src: 'a:1.5' }, { type: 'image', src: 'b:0.8' }, { type: 'text', md: 'One.' }];
    expect(autoArt(blocks, ratio).sections).toEqual([
      { text: [0], layout: 'lead' }, { media: [0], layout: 'full' }, { text: [1], media: [1], layout: 'beside' },
    ]);
  });
});

describe('runIn and long openings', () => {
  it('reads a bold first line over text as a subheading', () => {
    expect(runIn('**2015: Game Changer**\nGame changers are…')).toEqual({ head: '2015: Game Changer', rest: 'Game changers are…' });
    expect(runIn('**Bold** then words\nmore')).toBeNull();
    expect(runIn('**Only bold**')).toBeNull();
  });
  it('opens with a passage, not a standfirst, when the first paragraph is long or headed', () => {
    const ratio = () => 1.5;
    expect(autoArt([{ type: 'text', md: 'x'.repeat(500) }], ratio).sections).toEqual([{ text: [0] }]);
    expect(autoArt([{ type: 'text', md: '**Head**\nText.' }], ratio).sections).toEqual([{ text: [0] }]);
  });
});

