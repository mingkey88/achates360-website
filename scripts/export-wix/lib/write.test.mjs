import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { toFrontmatter, exportLog } from './write.mjs';

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
