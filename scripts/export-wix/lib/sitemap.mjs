const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

async function getText(url, fetchImpl) {
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`sitemap: HTTP ${res.status} for ${url}`);
  return res.text();
}

// Every page path in the live sitemap. Any failed request throws: a partial page list would
// make a full export delete content for pages that still exist.
export async function fetchSitemapPaths(origin, fetchImpl = fetch) {
  const paths = new Set();
  for (const sm of locs(await getText(`${origin}/sitemap.xml`, fetchImpl))) {
    for (const loc of locs(await getText(sm, fetchImpl))) {
      paths.add(new URL(loc).pathname.replace(/\/$/, '') || '/');
    }
  }
  if (!paths.size) throw new Error('sitemap: no pages found');
  return [...paths].sort();
}

// Ruling 20: sitemap pages that failed to render. Any of these aborts the run before content is
// cleaned or written; a linked page outside the sitemap failing only costs a warning.
export function sitemapRenderFailures(failedSlugs, paths) {
  return failedSlugs.filter((slug) => paths.includes(slug === 'home' ? '/' : `/${slug}`));
}
