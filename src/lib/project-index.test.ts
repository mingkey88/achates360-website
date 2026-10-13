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
