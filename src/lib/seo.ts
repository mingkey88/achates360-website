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
