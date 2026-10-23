import { isFileNameAlt } from './file-name-alt.js';
export type SiteEnv = 'staging' | 'production';

export function robotsMeta(env: SiteEnv): string | null {
  return env === 'production' ? null : 'noindex, nofollow';
}

/**
 * AI crawlers, named so the policy is explicit (AEO/GEO, 13 Oct 2026). Search crawlers read pages to
 * answer and cite them (ChatGPT search, Claude, Perplexity); training crawlers collect text to train
 * models. Both are allowed for now; set ALLOW_AI_TRAINING to false to keep answers and citations but
 * opt out of training (CONTENT-QUERIES 48). Google-Extended governs Gemini's use, not Google Search.
 */
export const AI_SEARCH_CRAWLERS = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User'];
export const AI_TRAINING_CRAWLERS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'];
export const ALLOW_AI_TRAINING = true;

export function robotsTxt(env: SiteEnv, allowTraining = ALLOW_AI_TRAINING): string {
  if (env !== 'production') return 'User-agent: *\nDisallow: /\n';
  const group = (agents: string[], rule: string) => agents.map((a) => `User-agent: ${a}`).join('\n') + `\n${rule}\n`;
  return [
    'User-agent: *\nAllow: /\n',
    '# AI search and answer engines: may read and cite the site.\n' + group(AI_SEARCH_CRAWLERS, 'Allow: /'),
    `# AI model training: ${allowTraining ? 'allowed' : 'not allowed'}.\n` + group(AI_TRAINING_CRAWLERS, allowTraining ? 'Allow: /' : 'Disallow: /'),
  ].join('\n');
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
  return env === 'production' ? `${robotsTxt(env)}\nSitemap: ${PRODUCTION_ORIGIN}/sitemap.xml\n` : robotsTxt(env);
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
/**
 * Pages kept out of search engines and AI answers (noindex, no sitemap) while they show another
 * project's work (CONTENT-QUERIES 46; decided 13 Oct 2026). They stay reachable at their address.
 * Remove a path once Achates has fixed its content.
 */
export const HELD_FROM_SEARCH = new Set(['/bank-of-singapore', '/ritz-carlton-mid-autumn']);

export const SITEMAP_EXCLUDED = new Set(['/404', ...Object.keys(CANONICAL_ALIASES), ...HELD_FROM_SEARCH]);

/** sitemap.xml for absolute page URLs (already canonical: no .html, home with its slash). */
export function sitemapXml(urls: string[]): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const body = [...new Set(urls)].sort().map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/** Wix exports often carry the upload's file name as the description (lib/file-name-alt.js). */
export { isFileNameAlt };

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

/** The studio's entity id: every page's structured data points at this one organisation. */
export const homeKey = (homeUrl: string) => homeUrl.replace(/\/?$/, '/'); // one form, with or without the base's trailing slash
export const orgId = (homeUrl: string) => `${homeKey(homeUrl)}#organization`;

/**
 * The studio as an organisation, with only facts that are settled and shown on the site: phone,
 * postcode and founding year are awaiting the client's answer (CONTENT-QUERIES 17, 18, 43), so the
 * address is the city alone and there is no telephone or founding date yet. description is the
 * About page's own first sentence; knowsAbout the project categories.
 */
export function organizationLd(o: { url: string; logo: string; email?: string; sameAs: string[]; description?: string; knowsAbout?: string[] }): Ld {
  return {
    '@context': 'https://schema.org', '@type': 'Organization', '@id': orgId(o.url), name: 'Achates 360', alternateName: 'Achates 360 Pte Ltd',
    url: o.url, logo: o.logo,
    ...(o.description ? { description: o.description } : {}),
    ...(o.email ? { email: o.email } : {}),
    address: { '@type': 'PostalAddress', addressLocality: 'Singapore', addressCountry: 'SG' },
    areaServed: 'Singapore',
    ...(o.knowsAbout?.length ? { knowsAbout: o.knowsAbout } : {}),
    sameAs: o.sameAs,
  };
}

/** The site itself, published by the studio. */
export function websiteLd(homeUrl: string): Ld {
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${homeKey(homeUrl)}#website`, name: 'Achates 360', url: homeKey(homeUrl), publisher: { '@id': orgId(homeUrl) } };
}

/** A page about the studio (AboutPage, ContactPage), so answer engines know whose page it is. */
export function aboutPageLd(type: 'AboutPage' | 'ContactPage', o: { url: string; name: string; homeUrl: string }): Ld {
  return { '@context': 'https://schema.org', '@type': type, name: o.name, url: o.url, isPartOf: { '@id': `${homeKey(o.homeUrl)}#website` }, about: { '@id': orgId(o.homeUrl) } };
}

/** The project list, in the site's own order. */
export function itemListLd(name: string, items: { name: string; url: string }[]): Ld {
  return {
    '@context': 'https://schema.org', '@type': 'ItemList', name, numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: it.url })),
  };
}

/** The studio's services: names and the project categories each covers (no descriptions until supplied). */
export function servicesLd(homeUrl: string, services: { name: string; categories: string[] }[]): Ld[] {
  return services.map((sv) => ({
    '@context': 'https://schema.org', '@type': 'Service', name: sv.name, serviceType: sv.categories,
    provider: { '@id': orgId(homeUrl) }, areaServed: 'Singapore',
  }));
}

/** A case study. */
export function creativeWorkLd(w: { name: string; url: string; image?: string; client?: string; year?: string; description?: string; categories?: string[]; publisherUrl: string }): Ld {
  return {
    '@context': 'https://schema.org', '@type': 'CreativeWork', name: w.name, url: w.url,
    ...(w.image ? { image: w.image } : {}),
    ...(w.description ? { description: w.description } : {}),
    ...(w.year ? { dateCreated: w.year } : {}),
    ...(w.categories?.length ? { genre: w.categories, keywords: w.categories.join(', ') } : {}),
    ...(w.client ? { sourceOrganization: { '@type': 'Organization', name: w.client } } : {}),
    creator: { '@type': 'Organization', '@id': orgId(w.publisherUrl), name: 'Achates 360', url: w.publisherUrl },
  };
}

/** JSON for a <script type="application/ld+json">, safe to inline (no "</script>" break-out). */
export function ldJson(data: Ld | Ld[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
