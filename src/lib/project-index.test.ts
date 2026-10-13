import { describe, expect, it } from 'vitest';
import { projectIndex, yearOf } from './project-index';

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
  const sections = [
    { heading: 'Strategic Branding', items: [{ href: '/a' }, { href: '/hidden' }] },
    { heading: 'Events', items: [{ href: '/a' }, { href: '/a' }, { href: '/b' }, {}] },
  ];

  it('keeps listed projects once, in gallery order, numbered from 1', () => {
    const out = projectIndex([g('/b'), g('/hidden'), g(undefined), g('NOT_SUPPORTED'), g('/a'), g('/b', 'again')], projects, sections);
    expect(out.map((e) => [e.no, e.slug, e.title])).toEqual([[1, 'b', '/b'], [2, 'a', '/a']]);
  });

  it('gives each project its categories (deduplicated, as slugs) and its year', () => {
    const [b, a] = projectIndex([g('/b'), g('/a')], projects, sections);
    expect(a).toMatchObject({ href: '/a', cats: ['strategic-branding', 'events'], year: '2016' });
    expect(b).toMatchObject({ cats: ['events'], year: '' });
  });

  it('skips projects missing from the collection', () => {
    expect(projectIndex([g('/nope')], projects, sections)).toEqual([]);
  });
});
