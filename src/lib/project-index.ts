/**
 * The all-projects index (/projects): every listed case study once, in the homepage gallery's order,
 * numbered, with its year. Titles, clients and pictures are the homepage gallery's, verbatim; years
 * come from the project's own © line.
 */
import { slugOf } from './next-project';

export interface GalleryItem { title: string; description: string; href?: string; thumb: ImageMetadata; alt: string; video?: string }
export interface IndexEntry extends GalleryItem { no: number; slug: string; href: string; year: string }

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
    out.push({ ...it, no: out.length + 1, slug, href: `/${slug}`, year: yearOf(projects.get(slug)!.copyright) });
  }
  return out;
}
