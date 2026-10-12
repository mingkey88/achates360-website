/**
 * The projects index's sections as category pages (/projects/<slug>, direction B). Headings are the
 * supplied section headings, verbatim; the slug is derived from them.
 */
export interface Category<T> { id: string; heading: string; slug: string; href: string; items: T[] }

export function categorySlug(heading: string): string {
  return heading.trim().toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function projectCategories<T>(sections: { id: string; heading: string; items: T[] }[]): Category<T>[] {
  const seen = new Set<string>();
  return sections.map(({ id, heading, items }) => {
    const slug = categorySlug(heading);
    if (seen.has(slug)) throw new Error(`projects: two sections would share the page /projects/${slug}`);
    seen.add(slug);
    return { id, heading, slug, href: `/projects/${slug}`, items };
  });
}

/** An old "/projects#<section>" link's category page. Wix's first section answered to "#top". */
export function categoryForHash(hash: string, cats: { id: string; href: string }[]): string | null {
  const id = hash.replace(/^#/, '');
  if (!id) return null;
  if (id === 'top') return cats[0]?.href ?? null;
  return cats.find((c) => c.id === id)?.href ?? null;
}
