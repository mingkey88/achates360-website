/**
 * Rows from Wix's layout boxes (Task 11b). The exporter records each block's rendered box on the
 * live site at a 1440x900 viewport (`box`) and in Wix's 320px mobile layout (`mbox`), in CSS px
 * and document coordinates. Wix positions every component absolutely; the clone rebuilds the
 * side-by-side arrangements as flex rows and keeps everything else in one column.
 */
export interface Box { x: number; y: number; w: number; h: number }
export interface Boxed { box?: Box; mbox?: Box; type?: string }

// Only an image can carry blocks laid over it: the clone draws it in its Wix box, while e.g. a
// gallery renders in another shape (samsung-connected-home's 3-column grid becomes a stack).
const canHost = (b: Boxed) => b.type === undefined || b.type === 'image';
export interface Cell<T> { block: T; width: number; offset: number } // percentages of the column

// Desktop content column at the 1440 render: Wix's images, galleries and players run x=238..1178
// (notter) and 240..1188 (dxv); the clone's column is --page-max (940px) wide, starting at
// 50% - 480px = 240 at 1440 (src/layouts/Project.astro).
export const PAGE_WIDTH = 940;
export const PAGE_LEFT = 240;
// Wix's mobile layout: a 320px page with a 280px column at x=20 (notter, dxv on iPhone 13).
export const MOBILE_WIDTH = 280;
export const MOBILE_LEFT = 20;

/** Two boxes sit side by side when their y-ranges share more than half of the shorter one. */
export function overlaps(a: Box, b: Box): boolean {
  const shorter = Math.min(a.h, b.h);
  if (shorter <= 0) return false;
  const shared = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return shared > shorter / 2;
}

// Side by side: the y-ranges overlap (above) and the x-ranges share at most half of the narrower
// box. Wix text boxes often run on below their words (bumitama's ends 25px into the button under
// it), so a vertical overlap alone does not make a row.
function sideBySide(a: Box, b: Box): boolean {
  const sharedX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  return overlaps(a, b) && sharedX <= Math.min(a.w, b.w) / 2;
}

/**
 * Rows, in the order Wix shows them on desktop:
 * - blocks side by side (sideBySide) form a row, also when Wix's DOM interleaves them with other
 *   blocks (samsung-the-freestyle: embed, caption, embed, caption);
 * - a block lying inside a block of an earlier row joins that row, to be laid over it (Wix's DOM
 *   can list overlay pieces after other content, e.g. konicaminolta's stickers after a heading);
 * - when every block has a box, rows are ordered by their top edge (Wix's DOM order is not always
 *   its visual order); otherwise they keep block order, and a block without a box is its own row.
 */
export function groupRows<T extends Boxed>(blocks: T[]): T[][] {
  const rows: T[][] = [];
  for (const block of blocks) {
    const b = block.box;
    // Only rows since the last block without a box: one never moves across it.
    const recent = rows.slice(rows.findLastIndex((r) => !r.every((x) => x.box)) + 1).reverse();
    const host = b && recent.find((r) => r.some((x) => canHost(x) && inside(b, x.box!)));
    // The latest row the block sits beside without landing on top of any of its blocks.
    const beside = b && recent.find((r) => r.some((x) => sideBySide(x.box!, b))
      && !r.some((x) => overlaps(x.box!, b) && !sideBySide(x.box!, b)));
    if (host) host.push(block);
    else if (beside) beside.push(block);
    else rows.push([block]);
  }
  if (!blocks.every((b) => b.box)) return rows;
  const top = (r: T[]) => Math.min(...r.map((x) => x.box!.y));
  return rows.map((r, i) => ({ r, i })).sort((a, b) => top(a.r) - top(b.r) || a.i - b.i).map(({ r }) => r);
}

// a lies inside c (2px slack for Wix's rounding).
const inside = (a: Box, c: Box, slack = 2) =>
  a.x >= c.x - slack && a.y >= c.y - slack && a.x + a.w <= c.x + c.w + slack && a.y + a.h <= c.y + c.h + slack;

const pct = (px: number, of: number) => +(px / of * 100).toFixed(3);

// Cells left to right: the first is offset from the column's left edge (never placed left of it),
// each next one from the right edge of the one before, negative where Wix overlaps them.
function cells<T>(row: T[], boxOf: (b: T) => Box, width: number, left: number): Cell<T>[] {
  const sorted = [...row].sort((a, b) => boxOf(a).x - boxOf(b).x);
  const first = boxOf(sorted[0]);
  const shift = Math.max(0, left - first.x); // a row starting left of the column moves right
  const px = sorted.map((block, i) => {
    const b = boxOf(block);
    const prev = i > 0 ? boxOf(sorted[i - 1]) : null;
    return { block, offset: prev ? b.x - (prev.x + prev.w) : first.x + shift - left, width: b.w };
  });
  // Wix boxes can run a few px past the column (dxv's 470 + 10 + 466 pair): scale to fit.
  const extent = Math.max(...sorted.map((b) => boxOf(b).x + boxOf(b).w)) + shift - left;
  const scale = extent > width ? width / extent : 1;
  return px.map((c) => ({ block: c.block, width: pct(c.width * scale, width), offset: pct(c.offset * scale, width) }));
}

/** Desktop cells of a row whose blocks all have boxes, left to right. */
export function layoutRow<T extends Boxed>(row: T[]): Cell<T>[] {
  return cells(row, (b) => b.box!, PAGE_WIDTH, PAGE_LEFT);
}

/**
 * Mobile cells, only for a row of several blocks that Wix's mobile layout also keeps side by side
 * (e.g. notter's two award logos). Any other row stacks into the single mobile column.
 */
export function mobileRow<T extends Boxed>(row: T[]): Cell<T>[] | null {
  if (row.length < 2 || !row.every((b) => b.mbox && b.mbox.w > 0)) return null;
  if (!row.every((b, i) => i === 0 || row.slice(0, i).some((a) => overlaps(a.mbox!, b.mbox!)))) return null;
  return cells(row, (b) => b.mbox!, MOBILE_WIDTH, MOBILE_LEFT);
}

export interface Overlay<T> {
  block: T;
  left: number; top: number; width: number; // % of the container's desktop box
  mobile?: { width: number; offset: number }; // % of the mobile column, when Wix shows it on mobile
}

/**
 * Blocks whose desktop box lies inside another block's box in the same row are laid over it
 * (konicaminolta's GIF stickers on a background image): they become overlays of the largest such
 * block, positioned in % of its box. The rest of the row is returned in order, each with its
 * overlays.
 */
export function nestOverlays<T extends Boxed>(row: T[]): { block: T; overlays: Overlay<T>[] }[] {
  const area = (b: T) => b.box!.w * b.box!.h;
  const host = new Map<T, T>();
  for (const b of row) {
    const containers = row.filter((c) => c !== b && canHost(c) && area(c) > area(b) && inside(b.box!, c.box!));
    if (containers.length) host.set(b, containers.reduce((x, y) => (area(y) > area(x) ? y : x)));
  }
  // An overlay's container is never itself an overlay: climb to the outermost one.
  const top = (b: T): T => (host.has(b) ? top(host.get(b)!) : b);
  return row.filter((b) => !host.has(b)).map((c) => ({
    block: c,
    overlays: row.filter((b) => host.has(b) && top(b) === c).map((b) => {
      const o = b.box!;
      const k = c.box!;
      return {
        block: b,
        left: pct(o.x - k.x, k.w), top: pct(o.y - k.y, k.h), width: pct(o.w, k.w),
        ...(b.mbox && b.mbox.w > 0
          ? { mobile: { width: pct(Math.min(b.mbox.w, MOBILE_WIDTH), MOBILE_WIDTH), offset: pct(Math.max(0, b.mbox.x - MOBILE_LEFT), MOBILE_WIDTH) } }
          : {}),
      };
    }),
  }));
}
