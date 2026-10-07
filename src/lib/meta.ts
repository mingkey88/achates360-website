export type MetaKey = 'client' | 'year' | 'services' | 'recognition';

/** The case-study meta strip's columns (spec §4.2): empty ones are omitted. */
export function metaColumns(d: { client?: string; copyright?: string; categories: readonly string[]; badges: readonly unknown[] }): MetaKey[] {
  const out: MetaKey[] = [];
  if (d.client?.trim()) out.push('client');
  if (d.copyright?.trim()) out.push('year');
  if (d.categories.length) out.push('services');
  if (d.badges.length) out.push('recognition');
  return out;
}

/** "© 2013 – 2016" → "2013". */
export function firstYear(copyright?: string): string | null {
  return copyright?.match(/\d{4}/)?.[0] ?? null;
}

/** A stat's number: `listed-projects` is counted at build time (spec §6.3). */
export function statValue(s: { value: number | 'listed-projects' }, listedCount: number): number {
  return s.value === 'listed-projects' ? listedCount : s.value;
}
