export const RESERVED = ['index', 'projects', 'robots.txt'];

export function assertUniqueSlugs(groups: Record<string, string[]>): void {
  const seen = new Map<string, string>(RESERVED.map((r) => [r, 'reserved']));
  for (const [group, slugs] of Object.entries(groups)) {
    for (const slug of slugs) {
      const prev = seen.get(slug);
      if (prev) throw new Error(`Slug "${slug}" is used by both ${prev} and ${group}`);
      seen.set(slug, group);
    }
  }
}
