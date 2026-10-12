export type SiteEnv = 'staging' | 'production';

export function robotsMeta(env: SiteEnv): string | null {
  return env === 'production' ? null : 'noindex, nofollow';
}

export function robotsTxt(env: SiteEnv): string {
  return env === 'production' ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n';
}

/**
 * The canonical URL of a built page from Astro.url.pathname (with build.format 'file' it ends in
 * ".html"). Pages drop ".html"; the home page keeps a trailing slash, so on a base path
 * ("/achates360-website/") GitHub Pages answers 200 instead of a 301.
 */
export function canonicalUrl(pathname: string, site: URL | string, base = '/'): string {
  const path = pathname.replace(/(\/index)?\.html$/, '');
  const home = !path || path === base.replace(/\/$/, '') || path === '/';
  return new URL(home ? base.replace(/\/?$/, '/') : path, site).href;
}

/** Production site address (the www host Wix serves today). */
export const PRODUCTION_ORIGIN = 'https://www.achates360.com';

/** robots.txt with the sitemap named in production, at the same /sitemap.xml path Wix uses. */
export function robotsTxtWithSitemap(env: SiteEnv): string {
  return env === 'production' ? `${robotsTxt(env)}Sitemap: ${PRODUCTION_ORIGIN}/sitemap.xml\n` : robotsTxt(env);
}

/**
 * Wix duplicates kept at their permanent URLs: they point search engines at the page they copy, and
 * stay out of the sitemap. Keys and values are site paths (no base).
 */
export const CANONICAL_ALIASES: Record<string, string> = {
  '/copy-of-projects': '/projects',
  '/copy-of-grohe-quarterly-campaigns': '/grohe-quarterly-campaigns',
};

/** Pages that are built but never listed in the sitemap. */
export const SITEMAP_EXCLUDED = new Set(['/404', ...Object.keys(CANONICAL_ALIASES)]);

/** sitemap.xml for absolute page URLs (already canonical: no .html, home with its slash). */
export function sitemapXml(urls: string[]): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const body = [...new Set(urls)].sort().map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/** Wix exports often carry the upload's file name as the description ("SMRT_290926_ED-169.jpg"). */
export function isFileNameAlt(alt: string | undefined): boolean {
  return !!alt && /\.(jpe?g|png|gif|webp|avif|svg|tiff?|heic)\s*$/i.test(alt.trim());
}

/** The supplied description, or the fallback when the supplied one is empty or a file name. */
export function altOr(alt: string | undefined, fallback: string): string {
  return !alt?.trim() || isFileNameAlt(alt) ? fallback : alt;
}

/** Collapses the runs of spaces and line breaks exported titles and descriptions sometimes carry. */
export function tidy(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

type Ld = Record<string, unknown>;

/** BreadcrumbList from [name, absolute URL] pairs. */
export function breadcrumbLd(items: [string, string][]): Ld {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
  };
}

/**
 * The studio as an organisation. Only facts that are settled: phone and postcode are awaiting the
 * client's answer (CONTENT-QUERIES 17, 18), so no telephone or address yet.
 */
export function organizationLd(o: { url: string; logo: string; email?: string; sameAs: string[] }): Ld {
  return {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'Achates 360', url: o.url, logo: o.logo,
    ...(o.email ? { email: o.email } : {}), sameAs: o.sameAs,
  };
}

/** A case study. */
export function creativeWorkLd(w: { name: string; url: string; image?: string; client?: string; year?: string; description?: string; publisherUrl: string }): Ld {
  return {
    '@context': 'https://schema.org', '@type': 'CreativeWork', name: w.name, url: w.url,
    ...(w.image ? { image: w.image } : {}),
    ...(w.description ? { description: w.description } : {}),
    ...(w.year ? { dateCreated: w.year } : {}),
    ...(w.client ? { sourceOrganization: { '@type': 'Organization', name: w.client } } : {}),
    creator: { '@type': 'Organization', name: 'Achates 360', url: w.publisherUrl },
  };
}

/** JSON for a <script type="application/ld+json">, safe to inline (no "</script>" break-out). */
export function ldJson(data: Ld | Ld[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
