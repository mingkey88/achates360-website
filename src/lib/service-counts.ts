/**
 * How many listed projects each service covers: the distinct listed projects across the categories
 * the service names (a project in two of its categories counts once).
 */
import { slugOf } from './next-project';

export function serviceCount(tags: string[], sections: { heading: string; items: { href?: string }[] }[], listed: Set<string>): number {
  const want = new Set(tags);
  const seen = new Set<string>();
  for (const s of sections) {
    if (!want.has(s.heading)) continue;
    for (const it of s.items) {
      const slug = slugOf(it.href);
      if (slug && listed.has(slug)) seen.add(slug);
    }
  }
  return seen.size;
}

/** A category's listed projects, for the counts beside its name. */
export function categoryCount(heading: string, sections: { heading: string; items: { href?: string }[] }[], listed: Set<string>): number {
  return serviceCount([heading], sections, listed);
}
