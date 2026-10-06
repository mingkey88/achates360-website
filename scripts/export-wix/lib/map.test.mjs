import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { extractPage } from './extract.mjs';
import { classify, mapPage, toProject, toCard, toHome, toProjectsIndex, toSite, toBlock, applyListing, MappingError } from './map.mjs';

// Gallery item data Wix loaded over the network while rendering (written by render.mjs).
const side = (s) => {
  try { return JSON.parse(readFileSync(new URL(`../__fixtures__/${s}.gallery.json`, import.meta.url), 'utf8')); } catch { return []; }
};
const raw = (s) => extractPage(readFileSync(new URL(`../__fixtures__/${s}.html`, import.meta.url), 'utf8'), s, side(s));
const dbs = raw('dbs-discretionary-portfolio-management');
const notter = raw('notter');
const angeline = raw('angeline');
const home = raw('home');
const projects = raw('projects');
const about = raw('about');

describe('classify', () => {
  it('routes known pages', () => {
    expect(classify(home)).toBe('home');
    expect(classify(projects)).toBe('projectsIndex');
    expect(classify(angeline)).toBe('card');
    expect(classify(dbs)).toBe('project');
    expect(classify(about)).toBe('basic');
  });
  it('treats a page without a back link as basic', () => {
    expect(classify({ ...dbs, slug: 'copy-of-x', nodes: dbs.nodes.filter((n) => n.kind !== 'link') })).toBe('basic');
  });
});

describe('mapPage fallback', () => {
  it('never drops a page: a project that fails mapping becomes basic with a warning', () => {
    const broken = { ...dbs, slug: 'broken', nodes: dbs.nodes.filter((n) => n.kind === 'link') };
    const r = mapPage(broken);
    expect(r.collection).toBe('basic');
    expect(r.id).toBe('broken');
    expect(r.warnings[0]).toMatch(/broken/);
  });
});

describe('toProject', () => {
  it('maps DBS verbatim', () => {
    const p = toProject(dbs);
    expect(p.title).toBe('DBS Discretionary Portfolio Management');
    expect(p.client).toBe('DBS Treasures Private Client');
    expect(p.copyright).toBe('© 2018');
    expect(p.hero).toEqual({ type: 'image', src: '../../assets/wix/dd7c1d_44ac45ce8677434da8641594701de7c0.jpg', alt: 'DBS_VideoProduction_DPM.jpg' });
    expect(p.backLink).toEqual({ label: '← BACK TO PROJECTS', href: '/' });
    expect(p.blocks.some((b) => b.type === 'embed' && b.id === 'J-LCPzZ9T4g')).toBe(true);
    expect(p.blocks.some((b) => b.type === 'text' && b.md.includes('© 2018'))).toBe(false);
    expect(p.seo.title).toBe('DBS Discretionary Portfolio Management | Achates 360');
  });
  it('maps Notter badges and gallery', () => {
    const p = toProject(notter);
    expect(p.badges.length).toBeGreaterThanOrEqual(1);
    expect(p.blocks.find((b) => b.type === 'gallery').items.length).toBeGreaterThanOrEqual(9);
    expect(p.blocks.find((b) => b.type === 'embed')).toEqual({ type: 'embed', provider: 'vimeo', id: '766942392' });
  });
  it('throws MappingError when there is no title after the back link', () => {
    expect(() => toProject({ ...dbs, nodes: dbs.nodes.filter((n) => n.kind !== 'text') })).toThrow(MappingError);
  });
});

describe('toCard', () => {
  it('keeps display text and link targets separately (Angeline mismatch preserved)', () => {
    const c = toCard(angeline);
    expect(c.name).toBe('Angeline WAN');
    expect(c.role).toBe('Managing Director');
    expect(c.phone).toEqual({ display: '+65 9846 2443', href: 'tel:+6596853533' });
    expect(c.email).toEqual({ display: 'angeline@achates360.com', href: 'mailto:jamillie@achates360.com?subject=From%20e-card' });
    expect(c.links.map((l) => l.href)).toContain('mailto:angeline@achates360.com?subject=From%20e-card');
    expect(c.vcard).toEqual({ label: 'Add to Contacts', href: '/cards/angeline.vcf' });
    expect(c.qr.src).toMatch(/^\.\.\/\.\.\/assets\/wix\//);
  });
});

describe('toHome', () => {
  const h = toHome(home);
  it('builds six slides with media and CTAs; award badges attach to slides', () => {
    expect(h.slides).toHaveLength(6);
    expect(h.slides.flatMap((s) => s.badges).length).toBeGreaterThanOrEqual(2);
    expect(h.slides[0].media).toEqual({ type: 'video', src: 'media/video/e9d9c2_fc662950ed5d4c17aafbd7de94793a49.mp4', poster: '../../assets/wix/e9d9c2_fc662950ed5d4c17aafbd7de94793a49f000.jpg' });
    expect(h.slides[0].cta).toEqual({ label: 'VIEW PROJECT', href: '/dxv' });
    expect(h.slides[1].media.type).toBe('image');
    expect(h.slides.at(-1).md).toBe('# Create Your Custom Red Packets for 2025');
  });
  it('maps menu targets to slide ids, top and footer', () => {
    expect(h.menu.map((m) => m.label)).toEqual(['', '1', '3', '4', '5', 'Sales Lead', 'Footer']);
    expect(h.menu[0].target).toBe('top');
    expect(h.menu.at(-1).target).toBe('footer');
    const ids = new Set([...h.slides.map((s) => s.id), 'all-projects', 'contact', 'top', 'footer']);
    expect(h.menu.every((m) => ids.has(m.target))).toBe(true);
  });
  it('sends each numbered menu item to the slide whose Wix section holds its anchor', () => {
    // Live page: anchors "1", "3", "4", "5" sit in the DXV, Building Memories, DBS and Star Wars
    // sections (there is no "2" and no anchor for the Notter slide); "Sales Lead" is the form section.
    expect(h.menu.map((m) => m.target)).toEqual(['top', 'slide-1', 'slide-2', 'slide-3', 'slide-5', 'contact', 'footer']);
    expect(h.slides[4].cta.href).toBe('/starwars-luzerne');
  });
  it('has the all-projects gallery and the contact form', () => {
    expect(h.allProjects.items.length).toBeGreaterThan(30);
    expect(h.allProjects.md).toContain('[All Projects](/projects)');
    expect(h.contact.form.groups).toHaveLength(2);
    expect(h.contact.md.join('\n')).toContain('Drop us a message');
  });
  it('keeps the form success text in contact.md, after the section texts', () => {
    expect(h.contact.md).toContain('Thanks for submitting!');
    expect(h.contact.md.indexOf('Thanks for submitting!')).toBeGreaterThan(h.contact.md.findIndex((m) => m.includes('Drop us a message')));
  });
  it('passes form fields through with their placeholder, keeping a nameless field as-is', () => {
    const msg = h.contact.form.fields.find((f) => f.type === 'textarea');
    expect(msg).toEqual({ name: '', type: 'textarea', label: '', required: true, placeholder: 'Type Your Message here...' });
    expect(h.contact.form.fields.filter((f) => 'placeholder' in f).every((f) => f.placeholder !== '')).toBe(true);
    expect(h.contact.form).not.toHaveProperty('texts');
  });
});

describe('toProjectsIndex', () => {
  it('pairs headings with galleries', () => {
    const p = toProjectsIndex(projects);
    expect(p.sections).toHaveLength(9);
    expect(p.sections[0].heading).toBe('Strategic Branding');
    expect(p.sections[0].items[0]).toHaveProperty('thumb');
    expect(p.menu.some((m) => m.label === 'Events')).toBe(true);
  });
  it('resolves every menu target to a section id, top or footer', () => {
    const p = toProjectsIndex(projects);
    const ids = new Set([...p.sections.map((s) => s.id), 'top', 'footer']);
    expect(p.menu.every((m) => ids.has(m.target))).toBe(true);
    expect(new Set(p.menu.filter((m) => m.target.startsWith('cat-')).map((m) => m.target)).size).toBeGreaterThan(1);
  });
});

describe('applyListing', () => {
  it('marks projects listed with all their categories in first-seen order', () => {
    const idx = toProjectsIndex(projects);
    // Purple Sage appears under both Strategic Branding and Advertising & Promotions on /projects.
    const ps = [{ id: 'purple-sage', data: { categories: [], listed: false } }, { id: 'zzz-unlisted', data: { categories: [], listed: false } }];
    applyListing(ps, idx);
    expect(ps[0].data.listed).toBe(true);
    expect(ps[0].data.categories).toEqual(expect.arrayContaining(['Strategic Branding', 'Advertising & Promotions']));
    expect(ps[0].data.categories.indexOf('Strategic Branding')).toBe(0);
    expect(typeof ps[0].data.order).toBe('number');
    expect(ps[1].data.listed).toBe(false);
  });
});

describe('toSite', () => {
  it('extracts logo and footer blocks', () => {
    const s = toSite(home);
    expect(s.logo.src).toMatch(/assets\/wix\//);
    expect(s.footer.some((b) => b.type === 'text' && b.md.includes('Achates 360 Pte Ltd'))).toBe(true);
    expect(s.footer.some((b) => b.type === 'image' && b.href === 'https://www.instagram.com/achates360/')).toBe(true);
  });
});

describe('toBlock', () => {
  it('drops gallery items with no file and keeps unlinked items unlinked', () => {
    const b = toBlock({ kind: 'gallery', items: [
      { title: 'A', description: '', href: null, file: 'x~mv2.jpg', alt: '', video: null },
      { title: 'B', description: '', href: '/b', file: '', alt: '', video: null }] });
    expect(b.items).toHaveLength(1);
    expect(b.items[0]).not.toHaveProperty('href');
  });
});
