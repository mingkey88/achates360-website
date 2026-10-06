import { describe, it, expect } from 'vitest';
import { robotsMeta, robotsTxt, canonicalUrl } from './seo';

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

describe('canonicalUrl', () => {
  it('staging: home keeps the trailing slash, pages drop .html', () => {
    const site = 'https://mingkey88.github.io';
    expect(canonicalUrl('/achates360-website/index.html', site, '/achates360-website')).toBe('https://mingkey88.github.io/achates360-website/');
    expect(canonicalUrl('/achates360-website/dxv.html', site, '/achates360-website')).toBe('https://mingkey88.github.io/achates360-website/dxv');
  });
  it('production: home is the site root, pages drop .html', () => {
    const site = 'https://www.achates360.com';
    expect(canonicalUrl('/index.html', site, '/')).toBe('https://www.achates360.com/');
    expect(canonicalUrl('/dxv.html', site, '/')).toBe('https://www.achates360.com/dxv');
  });
});
