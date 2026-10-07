export interface NavLink { label: string; href: string; items?: NavLink[] }

/** The site menu with SERVICES after PROJECTS (spec §3.5); site.md itself is never edited. */
export function withServices(menu: NavLink[], label: string, href = '/services'): NavLink[] {
  if (menu.some((m) => m.href === href)) return menu;
  const item = { label, href };
  const at = menu.findIndex((m) => m.href === '/projects');
  return at === -1 ? [...menu, item] : [...menu.slice(0, at + 1), item, ...menu.slice(at + 1)];
}
