// @ts-nocheck -- this repo has no @types/node; vitest runs it fine and it is not shipped.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { AWARDS } from './awards';

// The awards line is the source of truth; every award it names needs an entry (a seal, a project, or an
// explicit {} to set it as type alone), so a renamed award cannot silently lose its picture.
describe('AWARDS', () => {
  it('covers every award on the awards line, and nothing else', () => {
    const strings = parse(readFileSync(new URL('../content/extras/strings.yaml', import.meta.url), 'utf8'));
    const names = strings.find((s) => s.id === 'awards-line').text.split(' · ').map((a) => a.trim());
    expect(Object.keys(AWARDS).sort()).toEqual([...names].sort());
  });
});
