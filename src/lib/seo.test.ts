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
  it('allows everything in production and names the AI crawlers explicitly', () => {
    const txt = robotsTxt('production');
    expect(txt.startsWith('User-agent: *\nAllow: /\n')).toBe(true);
    for (const bot of ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'GPTBot', 'ClaudeBot', 'Google-Extended']) expect(txt).toContain(`User-agent: ${bot}`);
    expect(txt).not.toContain('Disallow');
  });
  it('can opt out of AI training while keeping AI search', () => {
    const txt = robotsTxt('production', false);
    const training = txt.slice(txt.indexOf('# AI model training'));
    const search = txt.slice(txt.indexOf('# AI search'), txt.indexOf('# AI model training'));
    expect(training).toContain('User-agent: GPTBot');
    expect(training).toContain('Disallow: /');
    expect(search).toContain('Allow: /');
    expect(search).not.toContain('Disallow');
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
    expect(robotsTxtWithSitemap('production').endsWith('\nSitemap: https://www.achates360.com/sitemap.xml\n')).toBe(true);
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
    // Wix also exported names without the extension, and mock-up names with a size or date stamp.
    expect(isFileNameAlt('Moving_Memories')).toBe(true);
    expect(isFileNameAlt('Digital-Poster-in-Office-Lobby-01_edited')).toBe(true);
    expect(isFileNameAlt('Achates360_Mock up for publication_NK_2000x2000px_06OCT22_V01-MOCKUPpg 10+11')).toBe(true);
    expect(isFileNameAlt('ChuanQRcode')).toBe(true);
    // Real words stay, including one-word names and titles with symbols.
    expect(isFileNameAlt('Vimeo')).toBe(false);
    expect(isFileNameAlt('St Regis - TeaRoom & Patisserie')).toBe(false);
    expect(isFileNameAlt('Greeting Card & eDM')).toBe(false);
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

import { organizationLd, websiteLd, aboutPageLd, itemListLd, servicesLd, creativeWorkLd, orgId } from './seo';

describe('structured data for answer engines', () => {
  const home = 'https://www.achates360.com/';
  it('gives the studio one id that every page points to', () => {
    const org = organizationLd({ url: home, logo: `${home}logo.jpg`, sameAs: [], knowsAbout: ['Strategic Branding'] });
    expect(org['@id']).toBe(orgId(home));
    expect(websiteLd(home).publisher).toEqual({ '@id': orgId(home) });
    expect(aboutPageLd('AboutPage', { url: `${home}about`, name: 'About', homeUrl: home }).about).toEqual({ '@id': orgId(home) });
    expect(servicesLd(home, [{ name: 'Branding', categories: ['Strategic Branding'] }])[0].provider).toEqual({ '@id': orgId(home) });
    expect((creativeWorkLd({ name: 'X', url: `${home}x`, publisherUrl: home }).creator as any)['@id']).toBe(orgId(home));
  });
  it('states only settled facts: city and country, no phone, postcode or founding year', () => {
    const org = organizationLd({ url: home, logo: 'l', sameAs: [] });
    expect(org.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'Singapore', addressCountry: 'SG' });
    expect(org).not.toHaveProperty('telephone');
    expect(org).not.toHaveProperty('foundingDate');
  });
  it('names the studio the same way with or without the trailing slash', () => {
    expect(orgId('https://a.b/site')).toBe(orgId('https://a.b/site/'));
  });
  it('numbers the project list in order', () => {
    const l = itemListLd('Projects', [{ name: 'A', url: 'a' }, { name: 'B', url: 'b' }]);
    expect(l.numberOfItems).toBe(2);
    expect((l.itemListElement as any[])[1]).toEqual({ '@type': 'ListItem', position: 2, name: 'B', url: 'b' });
  });
});

import { HELD_FROM_SEARCH } from './seo';
describe('pages held from search', () => {
  it('keeps the two pages showing another project\'s work out of the sitemap', () => {
    for (const p of ['/bank-of-singapore', '/ritz-carlton-mid-autumn']) {
      expect(HELD_FROM_SEARCH.has(p)).toBe(true);
      expect(SITEMAP_EXCLUDED.has(p)).toBe(true);
    }
  });
});
