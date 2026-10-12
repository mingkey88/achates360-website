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

import { robotsTxtWithSitemap, sitemapXml, isFileNameAlt, altOr, tidy, breadcrumbLd, ldJson, CANONICAL_ALIASES, SITEMAP_EXCLUDED } from './seo';

describe('robotsTxtWithSitemap', () => {
  it('names the sitemap in production only', () => {
    expect(robotsTxtWithSitemap('production')).toBe('User-agent: *\nAllow: /\nSitemap: https://www.achates360.com/sitemap.xml\n');
    expect(robotsTxtWithSitemap('staging')).toBe('User-agent: *\nDisallow: /\n');
  });
});

describe('sitemapXml', () => {
  it('lists each URL once, sorted, escaped', () => {
    const xml = sitemapXml(['https://x.test/b', 'https://x.test/a&b', 'https://x.test/b']);
    expect(xml.match(/<loc>/g)).toHaveLength(2);
    expect(xml).toContain('<loc>https://x.test/a&amp;b</loc>');
    expect(xml.indexOf('a&amp;b')).toBeLessThan(xml.indexOf('/b<'));
  });
  it('keeps aliases and the 404 page out', () => {
    for (const p of Object.keys(CANONICAL_ALIASES)) expect(SITEMAP_EXCLUDED.has(p)).toBe(true);
    expect(SITEMAP_EXCLUDED.has('/404')).toBe(true);
  });
});

describe('alt text', () => {
  it('treats file names as missing', () => {
    expect(isFileNameAlt('SMRT_290926_ED-169.jpg')).toBe(true);
    expect(isFileNameAlt('Building Memories_cover.JPEG ')).toBe(true);
    expect(isFileNameAlt('A bespoke gift box')).toBe(false);
    expect(altOr('1.jpeg', 'R151 Movia')).toBe('R151 Movia');
    expect(altOr('', 'R151 Movia')).toBe('R151 Movia');
    expect(altOr('Ribbon-pull ceremony', 'R151 Movia')).toBe('Ribbon-pull ceremony');
  });
});

describe('tidy', () => {
  it('collapses whitespace', () => {
    expect(tidy('  IGBC  Conference\n | Achates 360 ')).toBe('IGBC Conference | Achates 360');
  });
});

describe('JSON-LD', () => {
  it('numbers breadcrumb positions from 1', () => {
    const ld = breadcrumbLd([['Projects', 'https://x.test/projects'], ['Events', 'https://x.test/projects/events']]) as any;
    expect(ld.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
  });
  it('cannot close its script element', () => {
    expect(ldJson({ name: '</script><b>' })).not.toContain('</script>');
  });
});
