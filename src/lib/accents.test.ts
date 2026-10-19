// @ts-nocheck -- this repo has no @types/node; vitest runs it fine and it is not shipped.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { ACCENTS, FOOTER_ACCENT, splitAccent } from './accents';

describe('splitAccent', () => {
  it('splits at a whole-word match', () => {
    expect(splitAccent('Write to us.', 'us')).toEqual(['Write to ', 'us', '.']);
    expect(splitAccent('How we work', 'work')).toEqual(['How we ', 'work', '']);
  });
  it('ignores matches inside a word, and missing or empty phrases', () => {
    expect(splitAccent('Trusted by', 'us')).toBeNull();
    expect(splitAccent('Our story', 'stories')).toBeNull();
    expect(splitAccent('Our story', undefined)).toBeNull();
    expect(splitAccent('Our story', '')).toBeNull();
  });
});

describe('ACCENTS', () => {
  const strings: { id: string; text: string }[] = parse(readFileSync('src/content/extras/strings.yaml', 'utf8'));
  for (const [id, phrase] of Object.entries(ACCENTS)) {
    it(`"${phrase}" is in strings/${id}`, () => {
      const s = strings.find((x) => x.id === id);
      expect(s, `strings/${id} exists`).toBeTruthy();
      expect(splitAccent(s!.text, phrase)).not.toBeNull();
    });
  }
  it("the footer's accent is in its intro line", () => {
    const site = readFileSync('src/content/site/site.md', 'utf8');
    expect(site).toContain(FOOTER_ACCENT);
  });
});
