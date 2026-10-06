export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  if (!path.startsWith('/')) return path;
  const b = base.replace(/\/$/, '');
  if (path === '/') return b || '/';
  // Home with a fragment or query: keep it on the bare base ("/base#x"), never "/base/#x".
  if (/^\/[#?]/.test(path)) return b ? b + path.slice(1) : path;
  return b + path;
}

export function mediaUrl(path: string, base?: string): string {
  return withBase('/' + path.replace(/^\//, ''), base);
}

/**
 * Wix's "← BACK TO PROJECTS" links point at the home page with a data-anchor: on desktop Wix
 * scrolls the home page to its "All Projects" section (id `all-projects` in the clone).
 */
export const HOME_PROJECTS_ANCHOR = '#all-projects';
export function backLinkHref(href: string): string {
  return href === '/' ? '/' + HOME_PROJECTS_ANCHOR : href;
}
