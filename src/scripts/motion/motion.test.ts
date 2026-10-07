// @ts-nocheck -- this repo has no @types/node; vitest runs it fine and it is not shipped.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MOTION, SOURCES } from './manifest';

const imported = (src: string) =>
  [...src.matchAll(/from ['"](?:\.\.\/)+scripts\/motion\/(\w+)['"]/g)].map((m) => m[1]).filter((m) => m !== 'index').sort();

describe('motion manifest', () => {
  for (const [kind, file] of Object.entries(SOURCES)) {
    it(`${kind} (${file}) imports exactly its manifest modules`, () => {
      const src = readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8');
      expect(imported(src)).toEqual([...MOTION[kind as keyof typeof MOTION]].sort());
    });
  }
  it('case studies never ship the heavy modules', () => {
    expect(MOTION.project).not.toContain('stack');
    expect(MOTION.project).not.toContain('timeline');
  });
});
