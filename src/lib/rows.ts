/**
 * Rows from Wix's layout boxes (Task 11b). The exporter records each block's rendered box on the
 * live site at a 1440x900 viewport (`box`) and in Wix's 320px mobile layout (`mbox`), in CSS px
 * and document coordinates. Wix positions every component absolutely; the clone rebuilds the
 * side-by-side arrangements as flex rows of columns and keeps everything else in one column.
 */
import { PAGE_WIDTH, PAGE_LEFT, MOBILE_WIDTH, MOBILE_LEFT } from './layout';

export interface Box { x: number; y: number; w: number; h: number }
export interface Boxed { box?: Box; mbox?: Box; type?: string }
export interface Cell<T> { block: T; width: number; offset: number } // % of the enclosing width
export interface Column<T> { width: number; offset: number; items: Cell<T>[] } // % of the page; items in % of the column

// Only an image can carry blocks laid over it: the clone draws it in its Wix box, while e.g. a
// gallery renders in another shape (samsung-connected-home's 3-column grid becomes a stack).
const canHost = (b: Boxed) => b.type === undefined || b.type === 'image';

const pct = (px: number, of: number) => +(px / of * 100).toFixed(3);

/** Two boxes share a height when their y-ranges share more than half of the shorter one. */
export function overlaps(a: Box, b: Box): boolean {
  const shorter = Math.min(a.h, b.h);
  if (shorter <= 0) return false;
  const shared = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return shared > shorter / 2;
}

// Same column: the x-ranges share more than half of the narrower one.
const sameColumn = (a: { x: number; w: number }, b: { x: number; w: number }) =>
  Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > Math.min(a.w, b.w) / 2;

// Side by side: the y-ranges overlap and the blocks are in different columns. Wix text boxes often
// run on below their words (bumitama's ends 25px into the button under it), so a vertical
// overlap alone does not make a row.
const sideBySide = (a: Box, b: Box) => overlaps(a, b) && !sameColumn(a, b);
// b would land on a: same height, same column.
const landsOn = (a: Box, b: Box) => overlaps(a, b) && sameColumn(a, b);

// a lies inside c (2px slack for Wix's rounding).
const inside = (a: Box, c: Box, slack = 2) =>
  a.x >= c.x - slack && a.y >= c.y - slack && a.x + a.w <= c.x + c.w + slack && a.y + a.h <= c.y + c.h + slack;

/** Columns of a row: blocks sharing an x-range (sameColumn, transitively), left to right, each top to bottom. */
function columnsOf<T extends Boxed>(row: T[]): { x: number; w: number; blocks: T[] }[] {
  const cols: { x: number; w: number; blocks: T[] }[] = [];
  for (const block of [...row].sort((a, b) => a.box!.x - b.box!.x)) {
    const b = block.box!;
    const hits = cols.filter((c) => sameColumn(c, b));
    const merged = { x: 0, w: 0, blocks: [...hits.flatMap((c) => c.blocks), block] };
    const left = Math.min(b.x, ...hits.map((c) => c.x));
    const right = Math.max(b.x + b.w, ...hits.map((c) => c.x + c.w));
    Object.assign(merged, { x: left, w: right - left });
    for (const h of hits) cols.splice(cols.indexOf(h), 1);
    cols.push(merged);
  }
  for (const c of cols) c.blocks.sort((a, b) => a.box!.y - b.box!.y);
  return cols.sort((a, b) => a.x - b.x);
}

/**
 * Rows, in the order Wix shows them on desktop:
 * - a block joins every row it sits beside (sideBySide with one of its blocks, landing on none),
 *   and those rows merge: a tall image beside two stacked ones is one row however Wix's DOM
 *   orders them (bank-julius-baer, singapore-aviation-academy), also when Wix interleaves other
 *   blocks (samsung-the-freestyle: embed, caption, embed, caption);
 * - a block lying inside an image of an earlier row joins that row, to be laid over it
 *   (konicaminolta's stickers come after a heading in Wix's DOM);
 * - a row of several blocks that each sit under a different column of the multi-column row above
 *   folds into it (a 2x2 grid; captions under embeds), so phones read them column by column;
 * - rows are ordered by their top edge (Wix's DOM order is not always its visual order); a block
 *   without a box is its own row, which stays in place and which nothing moves across.
 * Blocks within a row keep content order.
 */
export function groupRows<T extends Boxed>(blocks: T[]): T[][] {
  const order = new Map(blocks.map((b, i) => [b, i]));
  const byOrder = (r: T[]) => r.sort((a, b) => order.get(a)! - order.get(b)!);
  let rows: T[][] = [];
  let segment = 0; // rows before this index are behind a block without a box
  for (const block of blocks) {
    const b = block.box;
    if (!b) { rows.push([block]); segment = rows.length; continue; }
    const recent = rows.slice(segment);
    const host = [...recent].reverse().find((r) => r.some((x) => canHost(x) && inside(b, x.box!)));
    if (host) { host.push(block); continue; }
    const beside = recent.filter((r) => r.some((x) => sideBySide(x.box!, b)) && !r.some((x) => landsOn(x.box!, b)));
    if (!beside.length) { rows.push([block]); continue; }
    const at = rows.indexOf(beside[0]);
    rows = rows.filter((r) => !beside.includes(r));
    rows.splice(at, 0, byOrder([...beside.flat(), block]));
  }
  // Order and fold each run of boxed rows; a row without a box stays where it is.
  const out: T[][] = [];
  let run: T[][] = [];
  const flush = () => { out.push(...orderAndFold(run, byOrder)); run = []; };
  for (const r of rows) {
    if (r.every((x) => x.box)) run.push(r);
    else { flush(); out.push(r); }
  }
  flush();
  return out;
}

// Rows by their top edge; then a row that sits under the columns of the row above folds into it.
function orderAndFold<T extends Boxed>(rows: T[][], byOrder: (r: T[]) => T[]): T[][] {
  const top = (r: T[]) => Math.min(...r.map((x) => x.box!.y));
  const bottom = (r: T[]) => Math.max(...r.map((x) => x.box!.y + x.box!.h));
  const sorted = rows.map((r, i) => ({ r, i })).sort((a, b) => top(a.r) - top(b.r) || a.i - b.i).map(({ r }) => r);
  const folded: T[][] = [];
  for (const row of sorted) {
    const above = folded.at(-1);
    if (above && fitsUnder(row, above) && top(row) >= bottom(above) - 2) above.splice(0, above.length, ...byOrder([...above, ...row]));
    else folded.push(row);
  }
  return folded;
}

// Every block of `row` sits in a different column of the multi-column row `above`.
function fitsUnder<T extends Boxed>(row: T[], above: T[]): boolean {
  const cols = columnsOf(above);
  if (cols.length < 2 || row.length < 2) return false;
  const used = row.map((x) => cols.filter((c) => sameColumn(c, x.box!)));
  return used.every((u) => u.length === 1) && new Set(used.map((u) => u[0])).size === row.length;
}

/**
 * Desktop columns of a row whose blocks all have boxes, left to right. The first column is offset
 * from the page column's left edge (never placed left of it), each next one from the right edge of
 * the one before (never overlapping it). Items are sized and offset within their column.
 */
export function layoutRow<T extends Boxed>(row: T[]): Column<T>[] {
  const cols = columnsOf(row);
  let prevRight = PAGE_LEFT;
  const px = cols.map((c) => {
    const offset = Math.max(0, c.x - prevRight);
    prevRight = c.x + c.w;
    return { c, offset };
  });
  // Wix boxes can run a few px past the column (dxv's 470 + 10 + 466 pair): scale to fit.
  const extent = px.reduce((s, p) => s + p.offset + p.c.w, 0);
  const scale = extent > PAGE_WIDTH ? PAGE_WIDTH / extent : 1;
  return px.map(({ c, offset }) => ({
    width: pct(c.w * scale, PAGE_WIDTH),
    offset: pct(offset * scale, PAGE_WIDTH),
    items: c.blocks.map((block) => ({ block, width: pct(block.box!.w, c.w), offset: pct(block.box!.x - c.x, c.w) })),
  }));
}

/**
 * Mobile cells, only for a row of several blocks that Wix's mobile layout also keeps side by side
 * (e.g. notter's two award logos), left to right. Any other row stacks into the single mobile
 * column, in mobileOrder.
 */
export function mobileRow<T extends Boxed>(row: T[]): Cell<T>[] | null {
  if (row.length < 2 || !row.every((b) => b.mbox && b.mbox.w > 0)) return null;
  if (!row.every((b, i) => i === 0 || row.slice(0, i).some((a) => overlaps(a.mbox!, b.mbox!)))) return null;
  const sorted = [...row].sort((a, b) => a.mbox!.x - b.mbox!.x);
  let prevRight = MOBILE_LEFT;
  const px = sorted.map((block) => {
    const m = block.mbox!;
    const offset = Math.max(0, m.x - prevRight);
    prevRight = m.x + m.w;
    return { block, offset, width: m.w };
  });
  const extent = px.reduce((s, p) => s + p.offset + p.width, 0);
  const scale = extent > MOBILE_WIDTH ? MOBILE_WIDTH / extent : 1;
  return px.map((p) => ({ block: p.block, width: pct(p.width * scale, MOBILE_WIDTH), offset: pct(p.offset * scale, MOBILE_WIDTH) }));
}

/**
 * Reading order of a row that stacks on mobile: by the block's position in Wix's mobile layout;
 * a block Wix's mobile layout does not show keeps its place after the block before it in content
 * order.
 */
export function mobileOrder<T extends Boxed>(row: T[]): T[] {
  let key = -Infinity;
  const keyed = row.map((block, i) => {
    if (block.mbox) key = block.mbox.y;
    return { block, key, i };
  });
  return keyed.sort((a, b) => a.key - b.key || a.i - b.i).map((k) => k.block);
}

export interface Overlay<T> {
  block: T;
  left: number; top: number; width: number; // % of the container's desktop box
  mobile?: { width: number; offset: number }; // % of the mobile column, when Wix shows it on mobile
}

/**
 * Blocks whose desktop box lies inside an image's box in the same row are laid over it
 * (konicaminolta's GIF stickers on a background image): they become overlays of the largest such
 * image, positioned in % of its box. The rest of the row is returned in order, each with its
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
