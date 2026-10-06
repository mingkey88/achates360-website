import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { extractPage, extractRoutes } from './extract.mjs';
import { groupRows } from '../../../src/lib/rows.ts';

const fx = (s) => readFileSync(new URL(`../__fixtures__/${s}.html`, import.meta.url), 'utf8');
// Gallery item data Wix loaded over the network while rendering (written by render.mjs).
const side = (s) => {
  try { return JSON.parse(readFileSync(new URL(`../__fixtures__/${s}.gallery.json`, import.meta.url), 'utf8')); } catch { return []; }
};
const load = (s) => extractPage(fx(s), s, side(s));
const kinds = (p) => p.nodes.map((n) => n.kind);
const texts = (p) => p.nodes.filter((n) => n.kind === 'text').map((n) => n.text);

describe('extractPage: case study with YouTube (DBS)', () => {
  const p = load('dbs-discretionary-portfolio-management');
  it('reads SEO verbatim', () => {
    expect(p.seo.title).toBe('DBS Discretionary Portfolio Management | Achates 360');
    expect(p.seo.description).toMatch(/^Achates 360 developed investment communications/);
    expect(p.seo.ogImage).toMatch(/~mv2\.png$/);
  });
  it('captures hero, back link, texts and the embed in order', () => {
    expect(p.nodes[0]).toMatchObject({ kind: 'image', file: 'dd7c1d_44ac45ce8677434da8641594701de7c0~mv2.jpg' });
    expect(p.nodes.find((n) => n.kind === 'link')).toMatchObject({ href: '/', text: '← BACK TO PROJECTS' });
    expect(texts(p)).toContain('DBS Discretionary Portfolio Management');
    expect(texts(p)).toContain('DBS Treasures Private Client');
    expect(texts(p)).toContain('© 2018');
    expect(p.nodes.find((n) => n.kind === 'embed')).toMatchObject({ provider: 'youtube', id: 'J-LCPzZ9T4g' });
    expect(kinds(p).indexOf('embed')).toBeGreaterThan(kinds(p).indexOf('link'));
  });
  it('extracts the footer separately', () => {
    const ft = p.footer.filter((n) => n.kind === 'text').map((n) => n.text).join(' ');
    expect(ft).toContain('hello@achates360.com');
    expect(ft).toContain('Achates 360 Pte Ltd');
  });
});

describe('extractPage: case study with Vimeo and a gallery (Notter)', () => {
  const p = load('notter');
  it('captures the Vimeo embed', () => {
    expect(p.nodes.find((n) => n.kind === 'embed')).toMatchObject({ provider: 'vimeo', id: '766942392' });
  });
  it('emits each gallery once, with all rendered items and alt text', () => {
    const g = p.nodes.filter((n) => n.kind === 'gallery');
    expect(g).toHaveLength(1);
    expect(g[0].items.length).toBeGreaterThanOrEqual(9);
    expect(g[0].items[0]).toMatchObject({ file: expect.stringMatching(/~mv2\.jpg$/), alt: expect.stringMatching(/^Notter_Nuts_packaging/) });
  });
  it('does not emit gallery images as standalone images', () => {
    const standalone = p.nodes.filter((n) => n.kind === 'image').map((n) => n.file);
    const inGallery = p.nodes.find((n) => n.kind === 'gallery').items.map((i) => i.file);
    expect(standalone.filter((f) => inGallery.includes(f))).toEqual([]);
  });
  it('keeps an image wrapped in an external link as a linked image', () => {
    expect(p.nodes.find((n) => n.kind === 'image' && n.href?.startsWith('https://drivenxdesign.com'))).toBeTruthy();
  });
  it('keeps verbatim text including diacritics', () => {
    expect(texts(p).join(' ')).toContain('Nötter');
  });
});

describe('extractPage: business card (Angeline)', () => {
  const p = load('angeline');
  it('keeps link targets exactly as Wix has them', () => {
    const hrefs = [...p.nodes.filter((n) => n.kind === 'link').map((n) => n.href),
      ...p.nodes.flatMap((n) => (n.kind === 'text' ? n.links.map((l) => l.href) : []))];
    expect(hrefs).toContain('tel:+6596853533');
    expect(hrefs).toContain('mailto:angeline@achates360.com?subject=From%20e-card');
    expect(hrefs).toContain('mailto:jamillie@achates360.com?subject=From%20e-card');
    expect(hrefs.some((h) => h.includes('.vcf'))).toBe(true);
  });
  it('reads name and role', () => {
    expect(texts(p)).toContain('Angeline WAN');
    expect(texts(p)).toContain('Managing Director');
  });
});

describe('extractPage: home', () => {
  const p = load('home');
  it('finds the four background videos with best quality', () => {
    const v = p.nodes.filter((n) => n.kind === 'bgvideo');
    expect(v.map((n) => n.videoId)).toEqual([
      'e9d9c2_fc662950ed5d4c17aafbd7de94793a49', '483e3e_2a08660fc2f14f42825c4e3fdb7750e6',
      '9766c0_a95ab9ebfe8a49038442d749baa6de8d', '9766c0_dc0766bd21f24857af77b62c8b872cab']);
    expect(v[0]).toMatchObject({ quality: '720p', poster: 'e9d9c2_fc662950ed5d4c17aafbd7de94793a49f000.jpg' });
    expect(v[2].quality).toBe('1080p');
  });
  it('does not emit video poster frames as images', () => {
    expect(p.nodes.some((n) => n.kind === 'image' && /f00\d\.jpg$/.test(n.file))).toBe(false);
  });
  it('reads the anchor menu verbatim with resolved targets', () => {
    const m = p.nodes.find((n) => n.kind === 'anchorMenu');
    expect(m.items.map((i) => i.label)).toEqual(['', '1', '3', '4', '5', 'Sales Lead', 'Footer']);
    expect(m.items[0].target).toBe('top');
    expect(m.items.at(-1).target).toBe('footer');
    expect(m.items[1].target).toMatch(/^comp-/);
  });
  it('reads the enquiry form', () => {
    const f = p.nodes.find((n) => n.kind === 'form');
    expect(f.fields.map((x) => [x.name, x.type, x.label, x.required])).toEqual([
      ['name', 'text', 'Name', true], ['company', 'text', 'Company', true], ['email', 'email', 'Email', true],
      // The live form also has a required message box: no name attribute, an empty label, placeholder only.
      ['', 'textarea', '', true]]);
    expect(f.fields[3].placeholder).toBe('Type Your Message here...');
    expect(f.groups).toHaveLength(2);
    expect(f.groups[0].options).toEqual(['Branding', 'Publication', 'Advertising', 'Marketing', 'Corporate Gifts', 'Events', 'Digital Marketing']);
    expect(f.groups[1].options).toContain('Others ( Pls specify in message)');
    expect(f.groups.every((g) => g.required)).toBe(true);
    expect(f.submitLabel).toBe('Submit');
  });
  it('reads checkbox-group labels without the required markers', () => {
    expect(p.nodes.find((n) => n.kind === 'form').groups.map((g) => g.label)).toEqual(['Services you are looking at?', 'Selection 2']);
  });
  it('keeps the rich text inside the form (the success message)', () => {
    const f = p.nodes.find((n) => n.kind === 'form');
    expect(f.texts.map((t) => t.text)).toContain('Thanks for submitting!');
    expect(f.texts[0]).toMatchObject({ html: expect.any(String), links: expect.any(Array) });
  });
  it('the All Projects gallery links items to pages', () => {
    const g = p.nodes.find((n) => n.kind === 'gallery');
    expect(g.items.length).toBeGreaterThan(30);
    expect(g.items.filter((i) => i.href).length).toBeGreaterThan(30);
  });
  it('resolves the network-loaded video tiles', () => {
    const g = p.nodes.find((n) => n.kind === 'gallery');
    for (const title of ['GROHE Quarterly Campaigns', 'DXV Microsite & Design Inspiration Book', 'The Ritz Kids Programme Guide']) {
      expect(g.items.find((i) => i.title === title)).toMatchObject({
        href: expect.stringMatching(/^\//), video: { videoId: expect.stringMatching(/^\w+_\w+$/), quality: expect.stringMatching(/^\d+p$/) } });
    }
  });
  it('falls back to DOM title and description for a tile with no Wix data', () => {
    const html = fx('home').replace(/data-id="e0fc695e-0954-4820-a19f-b5a3ea953baa"/g, 'data-id="not-in-any-data"');
    const g = extractPage(html, 'home', []).nodes.find((n) => n.kind === 'gallery');
    expect(g.items.find((i) => i.itemId === 'not-in-any-data')).toMatchObject({
      title: '‘Building Memories’ Art Book [Award Winning]', description: 'Achates 360', href: null });
  });
  it('collects every video in the videos map', () => {
    expect(p.videos.get('9766c0_a95ab9ebfe8a49038442d749baa6de8d')).toBe('1080p');
  });
  it('finds the logo outside the page container, once', () => {
    expect(p.chrome).toHaveLength(1);
    expect(p.chrome.some((n) => n.kind === 'image' && /logo/i.test(n.alt))).toBe(true);
  });
});

describe('extractPage: projects index', () => {
  const p = load('projects');
  it('has nine category galleries preceded by headings', () => {
    expect(p.nodes.filter((n) => n.kind === 'gallery')).toHaveLength(9);
    expect(texts(p)).toContain('Strategic Branding');
    expect(texts(p)).toContain('Packaging & Merchandise');
  });
  it('resolves gallery items to titles, clients and links', () => {
    const all = p.nodes.filter((n) => n.kind === 'gallery').flatMap((g) => g.items);
    expect(all.find((i) => i.title === 'Grab Brand App Campaign')).toMatchObject({ description: 'Grab, Singapore', href: '/grab-brand-app-campaign' });
    expect(all.find((i) => i.title.startsWith('DXV Microsite'))).toMatchObject({
      href: '/dxv', video: { videoId: '9766c0_d7653d55673a48afa5a77e57faf2ee44', quality: '720p' } });
    expect(all.find((i) => i.title === 'Samsung The Freestyle')).toMatchObject({ href: '/samsung-the-freestyle' });
  });
});

describe('extractRoutes', () => {
  it('returns more routes than the sitemap has pages', () => {
    const r = extractRoutes(fx('projects'));
    expect(r.size).toBeGreaterThanOrEqual(69);
    expect([...r.values()]).toContain('/notter');
  });
});

describe('extractPage: sections', () => {
  it('uses the outermost Wix section, so anchor-menu targets and node sections agree', () => {
    const p = load('home');
    const sections = new Set(p.nodes.map((n) => n.section));
    const menu = p.nodes.find((n) => n.kind === 'anchorMenu');
    for (const m of menu.items) {
      if (m.target !== 'top' && m.target !== 'footer') expect(sections.has(m.target)).toBe(true);
    }
  });
});

// Layout annotations written by render.mjs (Task 11b): data-box / data-mbox on components,
// data-color on rich text, data-page-bg on <body>, data-player-* on Wix-hosted video players.
const ANNOTATED = `<!doctype html><html><head><title>T</title></head>
<body data-page-bg="rgb(242, 242, 242)"><main id="PAGES_CONTAINER">
<section id="comp-sec1" data-box="0,0,1440,2000">
  <div id="comp-txt1" data-testid="richTextElement" data-box="240,100,557,40" data-color="rgb(255, 255, 255)"><p>Hello</p></div>
  <div id="comp-img1" data-box="240,200,129,120" data-mbox="20,215,90,89"><img src="https://static.wixstatic.com/media/abc_1~mv2.jpg/v1/fill/w_129,h_120/a.jpg" alt="A"></div>
  <div id="comp-pl1" data-box="240,400,947,527"
    data-player-src="https://video.wixstatic.com/video/e9d9c2_0f5e/720p/mp4/file.mp4"
    data-player-poster="https://static.wixstatic.com/media/e9d9c2_0f5ef000.jpg/v1/fill/w_947,h_527/a.jpg">
    <video src="https://video.wixstatic.com/video/e9d9c2_0f5e/720p/mp4/file.mp4"></video>
    <img src="https://static.wixstatic.com/media/e9d9c2_0f5ef000.jpg/v1/fill/w_947,h_527/a.jpg" alt="">
  </div>
  <div id="comp-pl2" data-box="240,1000,600,300" data-player-src="https://example.com/clip.mp4" data-player-poster=""><video src="https://example.com/clip.mp4"></video></div>
</section></main><footer id="SITE_FOOTER"></footer></body></html>`;

describe('extractPage: layout annotations', () => {
  const p = extractPage(ANNOTATED, 'syn', []);
  it('gives nodes the box of their nearest annotated component', () => {
    expect(p.nodes.find((n) => n.kind === 'text').box).toEqual({ x: 240, y: 100, w: 557, h: 40 });
    expect(p.nodes.find((n) => n.kind === 'image')).toMatchObject({
      box: { x: 240, y: 200, w: 129, h: 120 }, mbox: { x: 20, y: 215, w: 90, h: 89 } });
  });
  it('reads the text colour', () => {
    expect(p.nodes.find((n) => n.kind === 'text').color).toBe('rgb(255, 255, 255)');
  });
  it('reads the page background', () => {
    expect(p.pageBackground).toBe('rgb(242, 242, 242)');
  });
  it('emits a Wix-hosted player as a player node, not its poster image', () => {
    const players = p.nodes.filter((n) => n.kind === 'player');
    expect(players[0]).toEqual(expect.objectContaining({
      kind: 'player', videoId: 'e9d9c2_0f5e', quality: '720p', poster: 'e9d9c2_0f5ef000.jpg',
      src: 'https://video.wixstatic.com/video/e9d9c2_0f5e/720p/mp4/file.mp4', box: { x: 240, y: 400, w: 947, h: 527 } }));
    expect(p.nodes.some((n) => n.kind === 'image' && n.file.startsWith('e9d9c2_0f5e'))).toBe(false);
    expect(p.videos.get('e9d9c2_0f5e')).toBe('720p');
  });
  it('keeps a non-Wix player URL as is, with no video id', () => {
    const pl = p.nodes.filter((n) => n.kind === 'player')[1];
    expect(pl).toMatchObject({ src: 'https://example.com/clip.mp4', videoId: null, poster: null });
  });
  it('drops a box that several nodes share: it is a container, not theirs', () => {
    const html = ANNOTATED.replace('</section>', `<div id="comp-show" data-box="230,2949,979,948" data-mbox="20,1592,280,561">
      <img src="https://static.wixstatic.com/media/s1.jpg" alt="s1"><img src="https://static.wixstatic.com/media/s2.jpg" alt="s2"></div></section>`);
    const q = extractPage(html, 'syn', []);
    for (const alt of ['s1', 's2']) {
      const n = q.nodes.find((x) => x.alt === alt);
      expect(n).not.toHaveProperty('box');
      expect(n).not.toHaveProperty('mbox');
    }
    expect(q.nodes.find((x) => x.alt === 'A').box).toEqual({ x: 240, y: 200, w: 129, h: 120 });
  });
  it('leaves the fields out when a render has no annotations', () => {
    const old = fx('notter').replace(/ data-(m?box|color|page-bg|player-src|player-poster)="[^"]*"/g, '');
    const q = extractPage(old, 'notter', side('notter'));
    expect(q.pageBackground).toBeUndefined();
    expect(q.nodes.length).toBeGreaterThan(5);
    for (const n of q.nodes) {
      expect(n).not.toHaveProperty('box');
      expect(n).not.toHaveProperty('mbox');
      expect(n).not.toHaveProperty('color');
    }
    expect(q.nodes.some((n) => n.kind === 'player')).toBe(false);
  });
});

describe('extractPage: layout of the annotated notter fixture', () => {
  const p = load('notter');
  it('puts the SPSA and DRIVENxDESIGN award logos on one row', () => {
    const logos = p.nodes.filter((n) => n.kind === 'image' && /SPSA|certificate/.test(n.alt));
    expect(logos).toHaveLength(2);
    for (const n of logos) expect(n.box).toEqual(expect.objectContaining({ w: expect.any(Number), h: expect.any(Number) }));
    expect(groupRows(logos)).toHaveLength(1);
  });
  it('reads the awards text as white, as Wix renders it', () => {
    const t = p.nodes.find((n) => n.kind === 'text' && n.text.startsWith('Nötter Nuts has won'));
    expect(t.color).toBe('rgb(255, 255, 255)');
  });
  it('records the white page background', () => {
    expect(p.pageBackground).toBe('rgb(255, 255, 255)');
  });
});
