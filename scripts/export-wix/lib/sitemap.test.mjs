import { describe, it, expect } from 'vitest';
import { fetchSitemapPaths, sitemapRenderFailures } from './sitemap.mjs';

const xml = (locs) => `<?xml version="1.0"?><urlset>${locs.map((l) => `<url><loc>${l}</loc></url>`).join('')}</urlset>`;
const site = (pages, status = {}) => async (url) => new Response(pages[url] ?? 'gone', { status: status[url] ?? (pages[url] ? 200 : 404) });
const O = 'https://www.example.com';

describe('fetchSitemapPaths', () => {
  it('collects every child sitemap\'s paths, deduped and sorted, without trailing slashes', async () => {
    const fetchImpl = site({
      [`${O}/sitemap.xml`]: xml([`${O}/pages-sitemap.xml`, `${O}/dynamic-sitemap.xml`]),
      [`${O}/pages-sitemap.xml`]: xml([`${O}`, `${O}/about/`, `${O}/zeta`]),
      [`${O}/dynamic-sitemap.xml`]: xml([`${O}/about`, `${O}/alpha`]),
    });
    expect(await fetchSitemapPaths(O, fetchImpl)).toEqual(['/', '/about', '/alpha', '/zeta']);
  });

  it('throws on a non-OK sitemap index', async () => {
    const fetchImpl = site({ [`${O}/sitemap.xml`]: 'busy' }, { [`${O}/sitemap.xml`]: 503 });
    await expect(fetchSitemapPaths(O, fetchImpl)).rejects.toThrow(/503/);
  });

  it('throws on a non-OK child sitemap instead of exporting a partial site', async () => {
    const fetchImpl = site({
      [`${O}/sitemap.xml`]: xml([`${O}/pages-sitemap.xml`, `${O}/dynamic-sitemap.xml`]),
      [`${O}/pages-sitemap.xml`]: xml([`${O}/about`]),
    });
    await expect(fetchSitemapPaths(O, fetchImpl)).rejects.toThrow(/404 .*dynamic-sitemap\.xml/);
  });

  it('throws when the sitemap lists no pages', async () => {
    const fetchImpl = site({ [`${O}/sitemap.xml`]: xml([`${O}/pages-sitemap.xml`]), [`${O}/pages-sitemap.xml`]: xml([]) });
    await expect(fetchSitemapPaths(O, fetchImpl)).rejects.toThrow(/no pages/);
  });
});

describe('sitemapRenderFailures (Ruling 20: abort before writing content)', () => {
  const paths = ['/', '/about', '/notter'];
  it('returns the failed slugs that are sitemap pages', () => {
    expect(sitemapRenderFailures(['notter', 'linked-only', 'home'], paths)).toEqual(['notter', 'home']);
  });
  it('is empty when only non-sitemap (linked) pages failed', () => {
    expect(sitemapRenderFailures(['linked-only'], paths)).toEqual([]);
  });
});
