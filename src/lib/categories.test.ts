import { describe, it, expect } from 'vitest';
import { categorySlug, projectCategories, categoryForHash } from './categories';
import { withCategories } from './menu';

describe('categorySlug', () => {
  it('makes a readable URL segment from the supplied heading', () => {
    expect(categorySlug('Strategic Branding')).toBe('strategic-branding');
    expect(categorySlug('Advertising & Promotions')).toBe('advertising-promotions');
    expect(categorySlug('  Packaging & Merchandise ')).toBe('packaging-merchandise');
  });
});

describe('projectCategories', () => {
  const sections = [
    { id: 'cat-1', heading: 'Strategic Branding', items: [1, 2] },
    { id: 'cat-2', heading: 'Events', items: [3] },
  ];
  it('gives each section a slug, a page href and keeps its items', () => {
    expect(projectCategories(sections)).toEqual([
      { id: 'cat-1', heading: 'Strategic Branding', slug: 'strategic-branding', href: '/projects/strategic-branding', items: [1, 2] },
      { id: 'cat-2', heading: 'Events', slug: 'events', href: '/projects/events', items: [3] },
    ]);
  });
  it('refuses two sections that would share a page', () => {
    expect(() => projectCategories([{ id: 'a', heading: 'Events', items: [] }, { id: 'b', heading: 'events', items: [] }])).toThrow(/events/);
  });
});

describe('categoryForHash', () => {
  const cats = projectCategories([{ id: 'cat-1', heading: 'Strategic Branding', items: [] }, { id: 'cat-2', heading: 'Events', items: [] }]);
  it('maps an old /projects#section link to its category page', () => {
    expect(categoryForHash('#cat-2', cats)).toBe('/projects/events');
    expect(categoryForHash('#top', cats)).toBe('/projects/strategic-branding');
  });
  it('ignores anything else', () => {
    expect(categoryForHash('', cats)).toBeNull();
    expect(categoryForHash('#contact', cats)).toBeNull();
  });
});

describe('withCategories', () => {
  const menu = [{ label: 'HOME', href: '/' }, { label: 'PROJECTS', href: '/projects' }];
  it('hangs the category pages under the projects item', () => {
    const out = withCategories(menu, [{ label: 'Events', href: '/projects/events' }]);
    expect(out[1]).toEqual({ label: 'PROJECTS', href: '/projects', items: [{ label: 'Events', href: '/projects/events' }] });
    expect(out[0]).toBe(menu[0]);
  });
  it('leaves a menu without a projects item alone', () => {
    expect(withCategories([menu[0]], [{ label: 'x', href: '/x' }])).toEqual([menu[0]]);
  });
});
