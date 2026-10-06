import { describe, it, expect } from 'vitest';
import { assertUniqueSlugs } from './routes';

describe('assertUniqueSlugs', () => {
  it('accepts disjoint slugs', () => {
    expect(() => assertUniqueSlugs({ projects: ['dxv', 'notter'], cards: ['angeline'], basic: ['about'] })).not.toThrow();
  });
  it('rejects a slug used by two collections', () => {
    expect(() => assertUniqueSlugs({ projects: ['angeline'], cards: ['angeline'] }))
      .toThrow('Slug "angeline" is used by both projects and cards');
  });
  it('rejects slugs that collide with fixed pages', () => {
    expect(() => assertUniqueSlugs({ basic: ['projects'] })).toThrow(/reserved/);
    expect(() => assertUniqueSlugs({ basic: ['robots.txt'] })).toThrow(/reserved/);
  });
});
