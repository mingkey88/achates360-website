import { describe, it, expect } from 'vitest';
import { toSegments } from './segments';

const at = (type: string, x: number, y: number, w = 300, h = 200) => ({ type, box: { x, y, w, h } });

describe('toSegments', () => {
  it('keeps a lone block as a single segment', () => {
    const t = { type: 'text' };
    expect(toSegments([t])).toEqual([{ kind: 'single', block: t }]);
  });
  it('makes side-by-side media a grid: 2 and 4 in two columns, 3, 5 and 6 in three', () => {
    const row = (n: number) => Array.from({ length: n }, (_, i) => at('image', 240 + i * 160, 100, 150, 150));
    expect(toSegments(row(2))[0]).toMatchObject({ kind: 'grid', cols: 2 });
    expect(toSegments(row(3))[0]).toMatchObject({ kind: 'grid', cols: 3 });
    expect(toSegments(row(4))[0]).toMatchObject({ kind: 'grid', cols: 2 });
    expect(toSegments(row(5))[0]).toMatchObject({ kind: 'grid', cols: 3 });
  });
  it('makes text beside media a split row', () => {
    const segs = toSegments([at('text', 240, 100, 400), at('image', 700, 100, 400)]);
    expect(segs).toHaveLength(1);
    expect(segs[0].kind).toBe('split');
  });
  it('stacks blocks that sit one under another', () => {
    const segs = toSegments([at('image', 240, 100), at('image', 240, 400)]);
    expect(segs.map((s) => s.kind)).toEqual(['single', 'single']);
  });
});
