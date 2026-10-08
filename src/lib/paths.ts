export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  if (!path.startsWith('/')) return path;
  const b = base.replace(/\/$/, '');
  if (path === '/') return b || '/';
  // Home with a fragment or query: keep it on the bare base ("/base#x"), never "/base/#x".
  if (/^\/[#?]/.test(path)) return b ? b + path.slice(1) : path;
  return b + path;
}

/** An absolute http(s) link to another site. */
export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * Attributes for a link: Wix opens every external http(s) link in a new tab (all 362 external
 * links in the cached renders carry target="_blank"), so the clone does too.
 */
export function linkAttrs(href: string): { target?: '_blank'; rel?: string } {
  return isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}

export function mediaUrl(path: string, base?: string): string {
  return withBase('/' + path.replace(/^\//, ''), base);
}

/**
 * Wix's "← BACK TO PROJECTS" links point at the home page, where Wix scrolled to its "All Projects"
 * grid. Direction B's homepage no longer lists every project, so they go to /projects instead.
 */
export function backLinkHref(href: string): string {
  return href === '/' ? '/projects' : href;
}

/**
 * The live-site path of the page being built ("/" or "/slug") from Astro.url.pathname, which
 * carries the base and, with build.format 'file', a ".html" ending.
 */
export function pagePath(pathname: string, base: string = import.meta.env.BASE_URL): string {
  const b = base.replace(/\/$/, '');
  let p = pathname.replace(/(\/index)?\.html$/, '');
  if (b && (p === b || p.startsWith(b + '/'))) p = p.slice(b.length);
  return p.replace(/\/$/, '') || '/';
}

/** Whether a menu link is the current page ('page') or holds it in its sub-menu ('parent'). */
export function menuCurrent(item: { href: string; items?: { href: string }[] }, path: string): 'page' | 'parent' | null {
  if (item.href === path) return 'page';
  return item.items?.some((i) => i.href === path) ? 'parent' : null;
}

/**
 * A valid 1x1 transparent GIF for a <picture> <source> that must show nothing (a layout where Wix
 * hides the image): the browser picks it and fetches no file. Not "data:," — srcset parsing strips
 * the trailing comma, leaving the invalid URL "data:" (ERR_INVALID_URL in the console).
 */
export const BLANK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
