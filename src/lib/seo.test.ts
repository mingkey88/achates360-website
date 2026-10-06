import { describe, it, expect } from 'vitest';
import { robotsMeta, robotsTxt } from './seo';

describe('robotsMeta', () => {
  it('blocks indexing on staging', () => {
    expect(robotsMeta('staging')).toBe('noindex, nofollow');
  });
  it('emits nothing in production', () => {
    expect(robotsMeta('production')).toBeNull();
  });
});

describe('robotsTxt', () => {
  it('disallows everything on staging', () => {
    expect(robotsTxt('staging')).toBe('User-agent: *\nDisallow: /\n');
  });
  it('allows everything in production', () => {
    expect(robotsTxt('production')).toBe('User-agent: *\nAllow: /\n');
  });
});
