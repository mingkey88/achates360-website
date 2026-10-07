/** Slug of a homepage link to a case study ("/notter" -> "notter"); null for anything else. */
export function slugOf(href: string | undefined): string | null {
  const m = href?.match(/^\/([a-z0-9-]+)$/i);
  return m ? m[1] : null;
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
