import { describe, it, expect } from 'vitest';
import { metaColumns, firstYear } from './meta';

describe('metaColumns', () => {
  it('lists every filled column in order', () => {
    expect(metaColumns({ client: 'Artisan Super Food', copyright: '© 2020', categories: ['Graphic Design'], badges: [{}] }))
      .toEqual(['client', 'year', 'services', 'recognition']);
  });
  it('omits empty columns (no client, blank copyright, no categories, no badges)', () => {
    expect(metaColumns({ client: '  ', copyright: undefined, categories: [], badges: [] })).toEqual([]);
    expect(metaColumns({ categories: ['Events'], badges: [] })).toEqual(['services']);
  });
});

describe('firstYear', () => {
  it('reads the first year of a range in either dash', () => {
    expect(firstYear('© 2000 - 2014')).toBe('2000');
    expect(firstYear('© 2013 – 2016')).toBe('2013');
    expect(firstYear('© 2020')).toBe('2020');
  });
  it('is null without a year', () => {
    expect(firstYear(undefined)).toBeNull();
    expect(firstYear('©')).toBeNull();
  });
});
