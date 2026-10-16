/** Slug of a homepage link to a case study ("/notter" -> "notter"); null for anything else. */
/**
 * Wix page names that have a cleaner page here. Wix's listings of the Frasers Property heritage wall point
 * to an unfinished Wix page, "copy-of-international-green-building"; this site has the project at
 * /frasers-property-heritage-wall (written from the March 2026 portfolio deck).
 */
const ALIASES: Record<string, string> = { 'copy-of-international-green-building': 'frasers-property-heritage-wall' };

export function slugOf(href: string | undefined): string | null {
  const m = href?.match(/^\/([a-z0-9-]+)$/i);
  return m ? (ALIASES[m[1]] ?? m[1]) : null;
}

/**
 * The case study after `slug` in the homepage's All Projects order (spec §4.2), wrapping from the
 * last to the first, among slugs that were built. Null when `slug` is not in that order or nothing
 * else remains: the band then links to /projects.
 */
export function nextProject(slug: string, order: readonly string[], exists: (s: string) => boolean): string | null {
  const seq = [...new Set(order)].filter(exists);
  const i = seq.indexOf(slug);
  if (i === -1 || seq.length < 2) return null;
  return seq[(i + 1) % seq.length];
}
