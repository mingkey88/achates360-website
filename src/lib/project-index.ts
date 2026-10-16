/**
 * The all-projects index (/projects): every listed case study once, in the homepage gallery's order,
 * numbered, with its year. Titles, clients and pictures are the homepage gallery's, verbatim; years
 * come from the project's own © line.
 */
import { slugOf } from './next-project';

export interface GalleryItem { title: string; description: string; href?: string; thumb: ImageMetadata; alt: string; video?: string }
export interface IndexEntry extends GalleryItem { no: number; slug: string; href: string; year: string; award?: string; position?: string }

/**
 * A card's title as the gallery supplies it, tidied for display: line breaks become spaces, and a
 * bracketed "[Award Winning]" typed after the title becomes a separate label (words unchanged).
 */
export function cardTitle(raw: string): { title: string; award?: string } {
  const t = raw.replace(/\s+/g, ' ').trim();
  const m = t.match(/^(.*?)\s*\[(award[^\]]*)\]\s*$/i);
  return m ? { title: m[1], award: m[2] } : { title: t };
}

/** "© 2020 - 2021" → "2020–2021", "© 2016" → "2016"; no year → "". */
export function yearOf(copyright: string | undefined): string {
  const years = (copyright ?? '').match(/\d{4}/g) ?? [];
  if (years.length === 0) return '';
  const first = years[0], last = years[years.length - 1];
  return first === last ? first : `${first}–${last}`;
}

export function projectIndex(
  gallery: GalleryItem[],
  projects: Map<string, { listed: boolean; copyright?: string }>,
): IndexEntry[] {
  const seen = new Set<string>();
  const out: IndexEntry[] = [];
  for (const it of gallery) {
    const slug = slugOf(it.href);
    if (!slug || seen.has(slug) || !projects.get(slug)?.listed) continue;
    seen.add(slug);
    out.push({ ...it, ...cardTitle(it.title), description: it.description.replace(/\s+/g, ' ').trim(), no: out.length + 1, slug, href: `/${slug}`, year: yearOf(projects.get(slug)!.copyright) });
  }
  return out;
}

/**
 * A category's cards: the same cards as /projects (one title, client and link per project, wherever it
 * appears), in the category's own order. Listings of pages that are not listed (password-protected, or
 * with no page at all) are left out, and a project listed twice in a category shows once.
 */
export function cardsFor(items: { href?: string }[], catalogue: IndexEntry[]): IndexEntry[] {
  const bySlug = new Map(catalogue.map((e) => [e.slug, e]));
  const seen = new Set<string>();
  const out: IndexEntry[] = [];
  for (const it of items) {
    const e = bySlug.get(slugOf(it.href) ?? '');
    if (!e || seen.has(e.slug)) continue;
    seen.add(e.slug);
    out.push(e);
  }
  return out;
}
