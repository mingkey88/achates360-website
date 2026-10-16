import { describe, expect, it } from 'vitest';
import { projectIndex, yearOf, cardTitle, cardsFor } from './project-index';

const thumb = {} as ImageMetadata;
const g = (href: string | undefined, title = href ?? '') => ({ title, description: 'Client', href, thumb, alt: '' });

describe('yearOf', () => {
  it('reads one year, a range, or none', () => {
    expect(yearOf('© 2016')).toBe('2016');
    expect(yearOf('© 2020 - 2021')).toBe('2020–2021');
    expect(yearOf('© 2021, 2021')).toBe('2021');
    expect(yearOf(undefined)).toBe('');
    expect(yearOf('©')).toBe('');
  });
});

describe('projectIndex', () => {
  const projects = new Map([
    ['a', { listed: true, copyright: '© 2016' }],
    ['b', { listed: true }],
    ['hidden', { listed: false, copyright: '© 2020' }],
  ]);

  it('keeps listed projects once, in gallery order, numbered from 1', () => {
    const out = projectIndex([g('/b'), g('/hidden'), g(undefined), g('NOT_SUPPORTED'), g('/a'), g('/b', 'again')], projects);
    expect(out.map((e) => [e.no, e.slug, e.title])).toEqual([[1, 'b', '/b'], [2, 'a', '/a']]);
  });

  it('gives each project its link and year', () => {
    const [b, a] = projectIndex([g('/b'), g('/a')], projects);
    expect(a).toMatchObject({ href: '/a', year: '2016' });
    expect(b).toMatchObject({ href: '/b', year: '' });
  });

  it('skips projects missing from the collection', () => {
    expect(projectIndex([g('/nope')], projects)).toEqual([]);
  });
});

describe('cardTitle', () => {
  it('turns line breaks into spaces', () => {
    expect(cardTitle('’50/50\n– A Shared History’ Exhibition')).toEqual({ title: '’50/50 – A Shared History’ Exhibition' });
  });
  it('moves a typed "[Award Winning]" out of the title into its own label', () => {
    expect(cardTitle('Notter Nuts Packaging [Award Winning]')).toEqual({ title: 'Notter Nuts Packaging', award: 'Award Winning' });
    expect(cardTitle('Moving Memories')).toEqual({ title: 'Moving Memories' });
  });
});

describe('cardsFor', () => {
  const thumb = {} as ImageMetadata;
  const projects = new Map([['a', { listed: true }], ['b', { listed: true }], ['secret', { listed: false }]]);
  const catalogue = projectIndex([
    { title: 'A card', description: 'Client A', href: '/a', thumb, alt: '' },
    { title: 'B card', description: 'Client B', href: '/b', thumb, alt: '' },
  ], projects);
  it("shows the /projects card for each of the category's projects, in the category's order", () => {
    expect(cardsFor([{ href: '/b' }, { href: '/a' }], catalogue).map((e) => [e.slug, e.title])).toEqual([['b', 'B card'], ['a', 'A card']]);
  });
  it('leaves out unlisted or missing pages and shows a project listed twice once', () => {
    expect(cardsFor([{ href: '/secret' }, { href: '/nowhere' }, { href: '/a' }, { href: '/a' }], catalogue).map((e) => e.slug)).toEqual(['a']);
  });
});
