import { describe, it, expect } from 'vitest';
import { groupRows, overlaps, layoutRow, mobileRow, mobileOrder, nestOverlays } from './rows';
import { PAGE_WIDTH, PAGE_LEFT } from './layout';

const b = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

describe('overlaps', () => {
  it('needs the y-ranges to share more than half of the shorter box', () => {
    expect(overlaps(b(0, 0, 10, 100), b(0, 40, 10, 100))).toBe(true); // 60 of 100
    expect(overlaps(b(0, 0, 10, 100), b(0, 50, 10, 100))).toBe(false); // exactly half
    expect(overlaps(b(0, 0, 10, 1000), b(0, 900, 10, 50))).toBe(true); // short box inside a tall one
    expect(overlaps(b(0, 0, 10, 100), b(0, 200, 10, 100))).toBe(false);
    expect(overlaps(b(0, 0, 10, 0), b(0, 0, 10, 100))).toBe(false); // zero-height box
  });
});

describe('groupRows', () => {
  it('puts two side-by-side images in one row', () => {
    const blocks = [{ id: 'a', box: b(240, 1867, 470, 310) }, { id: 'b', box: b(720, 1867, 466, 309) }];
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['a', 'b']]);
  });
  it('keeps stacked blocks in separate rows', () => {
    const blocks = [{ id: 'a', box: b(240, 1226, 948, 632) }, { id: 'b', box: b(240, 1867, 470, 310) }, { id: 'c', box: b(240, 2186, 470, 310) }];
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['a'], ['b'], ['c']]);
  });
  it('gives a block without a box a row of its own', () => {
    const blocks = [{ id: 'a', box: b(240, 0, 400, 100) }, { id: 'b' }, { id: 'c', box: b(700, 0, 200, 100) }];
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['a'], ['b'], ['c']]);
  });
  it('stacks blocks that share most of their x-range even when their boxes overlap vertically', () => {
    // bumitama: Wix's text box runs on past its words; the button below sits in its last 25px.
    const blocks = [{ id: 'text', box: b(237, 1003, 682, 409) }, { id: 'button', box: b(230, 1387, 194, 40) }];
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['text'], ['button']]);
  });
  it('folds a row whose blocks sit under the columns of the row above into it (interleaved DOM)', () => {
    // samsung-the-freestyle: three portrait embeds, each followed by its caption in DOM order.
    const ids = ['e1', 'c1', 'e2', 'c2', 'e3', 'c3'];
    const xs = [230, 230, 566, 566, 902, 902];
    const blocks = ids.map((id, i) => ({ id, box: id[0] === 'e' ? b(xs[i], 2202, 308, 545) : b(xs[i], 2747, 303, 31) }));
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['e1', 'c1', 'e2', 'c2', 'e3', 'c3']]);
  });
  it('still orders and folds the boxed blocks when the page also has unboxed ones', () => {
    // samsung-the-freestyle: its slideshow images below have no box of their own.
    const ids = ['e1', 'c1', 'e2', 'c2', 'e3', 'c3'];
    const xs = [230, 230, 566, 566, 902, 902];
    const blocks = [...ids.map((id, i) => ({ id, box: id[0] === 'e' ? b(xs[i], 2202, 308, 545) : b(xs[i], 2747, 303, 31) })),
      { id: 'slide1', box: undefined }, { id: 'later', box: b(240, 5000, 940, 100) }, { id: 'earlier', box: b(240, 4000, 940, 100) }];
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['e1', 'c1', 'e2', 'c2', 'e3', 'c3'], ['slide1'], ['earlier'], ['later']]);
  });
  it('makes one row of a tall image beside two stacked ones (bank-julius-baer blocks 6-8)', () => {
    const blocks = [
      { id: 'full', box: b(240, 3039, 951, 632) },
      { id: 'tall', box: b(240, 3684, 453, 630) },
      { id: 'top', box: b(700, 3684, 489, 300) },
      { id: 'bottom', box: b(700, 3996, 489, 328) },
      { id: 'next', box: b(240, 4333, 949, 690) },
    ];
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['full'], ['tall', 'top', 'bottom'], ['next']]);
  });
  it('joins a tall block to both stacked blocks beside it, the first of which came alone (singapore-aviation-academy 8-10)', () => {
    const blocks = [
      { id: 'top', box: b(247, 3124, 469, 332) },
      { id: 'bottom', box: b(247, 3462, 469, 337) },
      { id: 'tall', box: b(721, 3124, 472, 675) },
      { id: 'next', box: b(247, 3806, 946, 341) },
    ];
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['top', 'bottom', 'tall'], ['next']]);
  });
  it('makes one row of a 2x2 grid (journal-of-aviation-management 6-9)', () => {
    const blocks = [
      { id: '6', box: b(240, 2885, 467, 333) }, { id: '7', box: b(240, 3225, 468, 327) },
      { id: '8', box: b(716, 2884, 472, 333) }, { id: '9', box: b(716, 3224, 472, 327) },
    ];
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['6', '7', '8', '9']]);
  });
  it('does not fold a single block under a row into one of its columns', () => {
    const blocks = [{ id: 'a', box: b(240, 0, 470, 300) }, { id: 'b', box: b(720, 0, 470, 300) }, { id: 'c', box: b(240, 310, 470, 300) }];
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['a', 'b'], ['c']]);
  });
  it('joins a block that overlaps any block already in the row', () => {
    const blocks = [{ id: 'a', box: b(240, 0, 300, 100) }, { id: 'b', box: b(560, 0, 300, 400) }, { id: 'c', box: b(880, 300, 60, 100) }];
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['a', 'b', 'c']]);
  });
});

describe('groupRows: overlays out of DOM order', () => {
  // konicaminolta's DOM order: copy, background image, heading, WhatsApp logo, stickers.
  const blocks = [
    { id: 'copy', box: b(236, 988, 671, 173) },
    { id: 'bg', box: b(230, 1256, 1010, 899) },
    { id: 'heading', box: b(236, 1226, 657, 31) },
    { id: 'logo', box: b(581, 1208, 51, 48) },
    { id: 's1', box: b(948, 1522, 237, 234) },
    { id: 's2', box: b(626, 1906, 249, 249) },
    { id: 'link', box: b(635, 2229, 240, 68) },
  ];
  it('puts a block lying inside a block of an earlier row into that row, and orders rows by their top', () => {
    // The logo lies over the heading's box (after its words on Wix), so it stacks above it.
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['copy'], ['logo'], ['heading'], ['bg', 's1', 's2'], ['link']]);
  });
  it('never moves a block across one without a box', () => {
    const rows = groupRows([{ id: 'a', box: b(0, 500, 10, 10) }, { id: 'b' }, { id: 'c', box: b(0, 0, 10, 10) }]);
    expect(rows.map((r) => r.map((x) => x.id))).toEqual([['a'], ['b'], ['c']]);
  });
});

// Left and right page edges of each laid-out column, in % of the page width.
const edges = (cols: { width: number; offset: number }[]) => {
  let x = 0;
  return cols.map((c) => { const left = x + c.offset; x = left + c.width; return [left, x]; });
};

describe('layoutRow', () => {
  it('sizes each column as a share of the page width, offset from the column edge or the previous column', () => {
    // notter's award logos at 1440: 129 wide at x=238, 102 wide at x=398.
    const row = [{ id: 'cert', box: b(398, 973, 102, 120) }, { id: 'spsa', box: b(238, 973, 129, 120) }];
    const cols = layoutRow(row);
    expect(cols.map((c) => c.items.map((i) => i.block.id))).toEqual([['spsa'], ['cert']]); // left to right
    expect(cols[0]).toMatchObject({ width: +(129 / PAGE_WIDTH * 100).toFixed(3), offset: 0 }); // x left of the column clamps to 0
    expect(cols[1]).toMatchObject({ width: +(102 / PAGE_WIDTH * 100).toFixed(3), offset: +(31 / PAGE_WIDTH * 100).toFixed(3) });
    expect(cols[1].items[0]).toMatchObject({ width: 100, offset: 0 });
  });
  it('stacks blocks sharing an x-range in one column, top to bottom (bank-julius-baer 6-8)', () => {
    const tall = { id: 'tall', box: b(240, 3684, 453, 630) };
    const top = { id: 'top', box: b(700, 3684, 489, 300) };
    const bottom = { id: 'bottom', box: b(700, 3996, 489, 328) };
    const cols = layoutRow([tall, bottom, top]);
    expect(cols.map((c) => c.items.map((i) => i.block.id))).toEqual([['tall'], ['top', 'bottom']]);
    expect(cols[1].offset).toBeGreaterThanOrEqual(0);
  });
  it('sizes items within their column', () => {
    const cols = layoutRow([{ id: 'a', box: b(240, 0, 400, 100) }, { id: 'b', box: b(250, 110, 390, 100) }]);
    expect(cols).toHaveLength(1);
    expect(cols[0].items[1]).toMatchObject({ width: +(390 / 400 * 100).toFixed(3), offset: +(10 / 400 * 100).toFixed(3) });
  });
  it('scales a row wider than the page down to fit', () => {
    const cols = layoutRow([{ box: b(PAGE_LEFT, 0, 470, 310) }, { box: b(PAGE_LEFT + 480, 0, 466, 309) }]);
    const total = cols.reduce((s, c) => s + c.width + c.offset, 0);
    expect(total).toBeCloseTo(100, 1);
    expect(cols[0].width).toBeCloseTo(470 / 946 * 100, 2);
  });
  it('offsets a narrow block from the column edge', () => {
    expect(layoutRow([{ box: b(PAGE_LEFT + 94, 0, 470, 10) }])[0]).toMatchObject({ width: 50, offset: 10 });
  });
  it('never lets two columns overlap horizontally, and keeps every row within the page', () => {
    const rows = [
      // bank-julius-baer 6-8, singapore-aviation-academy 1-3 and 8-10, journal-of-aviation-management 6-9
      [b(240, 3684, 453, 630), b(700, 3684, 489, 300), b(700, 3996, 489, 328)],
      [b(240, 1417, 472, 679), b(718, 1417, 469, 337), b(718, 1759, 469, 337)],
      [b(247, 3124, 469, 332), b(247, 3462, 469, 337), b(721, 3124, 472, 675)],
      [b(240, 2885, 467, 333), b(240, 3225, 468, 327), b(716, 2884, 472, 333), b(716, 3224, 472, 327)],
      // blocks overlapping by less than half: still separate columns, pushed apart
      [b(240, 0, 400, 100), b(560, 0, 400, 100)],
      // konicaminolta's heading and the logo inside its box
      [b(236, 1226, 657, 31), b(581, 1208, 51, 48)],
    ];
    for (const boxes of rows) {
      const e = edges(layoutRow(boxes.map((box) => ({ box }))));
      for (let i = 1; i < e.length; i++) expect(e[i][0]).toBeGreaterThanOrEqual(e[i - 1][1] - 1e-9);
      expect(e.at(-1)![1]).toBeLessThanOrEqual(100.01); // percentages are rounded to 3 decimals
    }
  });
});

describe('mobileRow', () => {
  it('lays out a row that Wix also keeps side by side on mobile', () => {
    const row = [{ box: b(238, 973, 129, 120), mbox: b(20, 215, 90, 89) }, { box: b(398, 973, 102, 120), mbox: b(120, 220, 70, 84) }];
    const cells = mobileRow(row);
    expect(cells).not.toBeNull();
    expect(cells![0]).toMatchObject({ width: +(90 / 280 * 100).toFixed(3), offset: 0 });
    expect(cells![1]).toMatchObject({ width: +(70 / 280 * 100).toFixed(3), offset: +(10 / 280 * 100).toFixed(3) });
  });
  it('is null when Wix stacks the row on mobile, or a mobile box is missing', () => {
    expect(mobileRow([{ box: b(240, 0, 470, 310), mbox: b(20, 0, 280, 185) }, { box: b(720, 0, 466, 309), mbox: b(20, 195, 280, 185) }])).toBeNull();
    expect(mobileRow([{ box: b(240, 0, 470, 310), mbox: b(20, 0, 140, 185) }, { box: b(720, 0, 466, 309) }])).toBeNull();
    expect(mobileRow([{ box: b(240, 0, 470, 310), mbox: b(20, 0, 280, 185) }])).toBeNull();
  });
});

describe('mobileOrder', () => {
  it('orders a row that stacks on mobile by Wix mobile position', () => {
    // samsung-the-freestyle: Wix's mobile layout runs e1, c1, e3, c3, e2, c2.
    const blk = (id: string, my: number) => ({ id, box: b(0, 0, 10, 10), mbox: b(20, my, 280, 100) });
    const row = [blk('e1', 983), blk('c1', 1123), blk('e2', 1345), blk('c2', 1495), blk('e3', 1159), blk('c3', 1309)];
    expect(mobileOrder(row).map((x) => x.id)).toEqual(['e1', 'c1', 'e3', 'c3', 'e2', 'c2']);
  });
  it('keeps a block without a mobile box after the block before it in content order', () => {
    const row = [{ id: 'a', mbox: b(20, 500, 280, 10) }, { id: 'hidden' }, { id: 'c', mbox: b(20, 100, 280, 10) }];
    expect(mobileOrder(row).map((x) => x.id)).toEqual(['c', 'a', 'hidden']);
    expect(mobileOrder([{ id: 'x', mbox: undefined }, { id: 'y', mbox: undefined }]).map((x) => x.id)).toEqual(['x', 'y']);
  });
});

describe('nestOverlays', () => {
  // konicaminolta: GIF stickers placed over a 1010x899 background image.
  const bg = { id: 'bg', box: b(230, 1256, 1010, 899) };
  const s1 = { id: 's1', box: b(948, 1522, 237, 234), mbox: b(70, 600, 140, 140) };
  const s2 = { id: 's2', box: b(626, 1906, 249, 249) };
  it('attaches blocks lying inside another block to it, positioned in % of its box', () => {
    const nested = nestOverlays([bg, s1, s2]);
    expect(nested.map((n) => n.block.id)).toEqual(['bg']);
    expect(nested[0].overlays.map((o) => o.block.id)).toEqual(['s1', 's2']);
    expect(nested[0].overlays[0]).toMatchObject({
      left: +((948 - 230) / 1010 * 100).toFixed(3), top: +((1522 - 1256) / 899 * 100).toFixed(3), width: +(237 / 1010 * 100).toFixed(3) });
  });
  it('sizes an overlay for the mobile column from its mobile box', () => {
    expect(nestOverlays([bg, s1])[0].overlays[0].mobile).toMatchObject({ width: +(140 / 280 * 100).toFixed(3), offset: +(50 / 280 * 100).toFixed(3) });
    expect(nestOverlays([bg, s2])[0].overlays[0].mobile).toBeUndefined();
  });
  it('lays blocks only over images: a gallery renders in a different shape from its Wix box', () => {
    // samsung-connected-home: a video tile inside the box of a 3-column Wix grid gallery.
    const blocks = [{ type: 'gallery', box: b(230, 5183, 951, 2230) }, { type: 'video', box: b(870, 7103, 307, 310) }];
    expect(groupRows(blocks)).toHaveLength(2);
    expect(nestOverlays(blocks).map((n) => n.overlays.length)).toEqual([0, 0]);
  });
  it('leaves side-by-side blocks alone', () => {
    const nested = nestOverlays([{ box: b(240, 0, 470, 310) }, { box: b(720, 0, 466, 309) }]);
    expect(nested.map((n) => n.overlays.length)).toEqual([0, 0]);
  });
});
