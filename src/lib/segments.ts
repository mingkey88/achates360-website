import { groupRows, nestOverlays, type Boxed, type Overlay } from './rows';

/** How a case study lays out one Wix row (spec §4.2). */
export type Segment<T> =
  | { kind: 'single'; block: T }
  | { kind: 'grid'; blocks: T[]; cols: 2 | 3 }
  | { kind: 'split'; blocks: T[] }
  | { kind: 'stage'; items: { block: T; overlays: Overlay<T>[] }[] };

const GRIDDABLE = new Set(['image', 'video', 'embed']);

/**
 * Wix's side-by-side arrangements (rows.ts groupRows) become: one block on its own; media side by
 * side as a 2- or 3-column grid (4 → 2×2; 5 and 6 → rows of 3); anything mixing text with media as
 * a split row; or blocks laid over an image as a stage.
 */
export function toSegments<T extends Boxed & { type: string }>(blocks: T[]): Segment<T>[] {
  return groupRows(blocks).map((row): Segment<T> => {
    if (row.length === 1) return { kind: 'single', block: row[0] };
    if (row.length > 1 && row.every((b) => b.box)) {
      const nested = nestOverlays(row);
      if (nested.some((n) => n.overlays.length > 0)) return { kind: 'stage', items: nested };
    }
    if (row.every((b) => GRIDDABLE.has(b.type))) return { kind: 'grid', blocks: row, cols: row.length === 2 || row.length === 4 ? 2 : 3 };
    return { kind: 'split', blocks: row };
  });
}
