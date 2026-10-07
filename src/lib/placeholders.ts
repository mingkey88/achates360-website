import type { SiteEnv } from './seo';

/** An extras entry: every new piece of copy says whether it is still a placeholder. */
export interface Flagged { id: string; placeholder: boolean }

/** "group/id" of every placeholder item, sorted. */
export function listPlaceholders(groups: Record<string, readonly Flagged[]>): string[] {
  return Object.entries(groups)
    .flatMap(([group, items]) => items.filter((i) => i.placeholder).map((i) => `${group}/${i.id}`))
    .sort();
}

/** Production builds refuse to ship unapproved copy (spec §6.3). */
export function assertPublishable(groups: Record<string, readonly Flagged[]>, env: SiteEnv): void {
  if (env !== 'production') return;
  const left = listPlaceholders(groups);
  if (left.length === 0) return;
  throw new Error(
    `Production build blocked: ${left.length} placeholder item(s) still need approved copy ` +
    `(see CONTENT-QUERIES.md, "Redesign"):\n${left.map((l) => `  - ${l}`).join('\n')}`,
  );
}

/** Attribute that marks a rendered placeholder (verify-dist rejects it in production output). */
export function phAttr(placeholder: boolean): { 'data-placeholder'?: '' } {
  return placeholder ? { 'data-placeholder': '' } : {};
}
