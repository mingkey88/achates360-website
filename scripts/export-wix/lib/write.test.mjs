import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { toFrontmatter, exportLog, planCleanup } from './write.mjs';

describe('toFrontmatter', () => {
  it('round-trips awkward verbatim strings exactly', () => {
    const data = {
      title: 'The ‘Skyline’ Property Launch: "Phase #2" - [draft] *new*',
      client: 'Nötter — Artisan Super Food',
      copyright: '© 2020',
      md: '1 Irving Place, #05-02\n\nSelection 2\\* Required',
      empty: '',
      label: '',
    };
    const out = toFrontmatter(data);
    expect(out.startsWith('---\n')).toBe(true);
    expect(out.endsWith('---\n')).toBe(true);
    expect(parse(out.slice(4, -4))).toEqual(data);
  });
  it('does not fold long lines', () => {
    const long = 'x '.repeat(200).trim();
    expect(toFrontmatter({ md: long }).split('\n').filter(Boolean)).toHaveLength(3);
  });
});

describe('exportLog', () => {
  it('groups entries by level then page', () => {
    const md = exportLog([
      { level: 'query', page: 'angeline', message: 'phone display differs from link' },
      { level: 'warning', page: 'copy-of-projects', message: 'fell back to basic page' },
    ]);
    expect(md).toContain('## Content queries');
    expect(md).toContain('- **angeline** — phone display differs from link');
    expect(md).toContain('## Warnings');
  });
  it('is deterministic: no timestamp, same output for the same entries', () => {
    const entries = [{ level: 'info', page: 'a', message: 'm' }];
    const md = exportLog(entries);
    expect(md).not.toMatch(/Generated|\d{4}-\d{2}-\d{2}T/);
    expect(exportLog(entries)).toBe(md);
  });
});

describe('planCleanup', () => {
  const existing = [
    { collection: 'cards', id: 'angeline' }, { collection: 'cards', id: 'joseph-chan' },
    { collection: 'projects', id: 'notter' }, { collection: 'projects', id: 'copy-of-projects' },
  ];
  it('clears files of pages this run writes, even when their collection changes', () => {
    const ids = new Set(['angeline', 'joseph-chan', 'notter', 'copy-of-projects']);
    expect(planCleanup(existing, ids)).toEqual({ remove: existing, keep: [] });
  });
  it('keeps the file of a page that left the sitemap (e.g. /joseph-chan) without --allow-removals', () => {
    const ids = new Set(['angeline', 'notter', 'copy-of-projects']);
    const { remove, keep } = planCleanup(existing, ids);
    expect(keep).toEqual([{ collection: 'cards', id: 'joseph-chan' }]);
    expect(remove.map((f) => f.id)).toEqual(['angeline', 'notter', 'copy-of-projects']);
  });
  it('deletes it only when removals are allowed', () => {
    const ids = new Set(['angeline', 'notter', 'copy-of-projects']);
    expect(planCleanup(existing, ids, { allowRemovals: true })).toEqual({ remove: existing, keep: [] });
  });
});
