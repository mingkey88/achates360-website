/**
 * The projects index's sections as category pages (/projects/<slug>, direction B). Headings are the
 * supplied section headings, verbatim; the slug is derived from them.
 */
export interface Category<T> { id: string; heading: string; slug: string; href: string; items: T[] }

export function categorySlug(heading: string): string {
  return heading.trim().toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** A title as a key: "The Ritz-Carlton SuperBrunch" and "The Ritz Carlton SuperBrunch" match. */
export const titleKey = (t: string): string => t.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * The sections with every project linked. Wix lost the link on a few listings (the Ritz-Carlton
 * SuperBrunch under Graphic Design, Ambrosia for the People under Publications), so those cards could
 * not be clicked; such a listing takes the link of the same project (by title) in another section. A
 * listing with no link anywhere stops the build rather than showing a dead card.
 */
export function withLinks<T extends { title: string; href?: string }, S extends { heading: string; items: T[] }>(sections: S[]): S[] {
  const known = new Map<string, string>();
  for (const s of sections) for (const it of s.items) if (it.href) known.set(titleKey(it.title), it.href);
  return sections.map((s) => ({
    ...s,
    items: s.items.map((it) => {
      if (it.href) return it;
      const href = known.get(titleKey(it.title));
      if (!href) throw new Error(`projects/${s.heading}: "${it.title}" has no link, and no other listing of it has one`);
      return { ...it, href };
    }),
  }));
}

export function projectCategories<T extends { title: string; href?: string }>(raw: { id: string; heading: string; items: T[] }[]): Category<T>[] {
  const seen = new Set<string>();
  const sections = withLinks(raw);
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
