import { describe, it, expect } from 'vitest';
import { groupRows, overlaps, layoutRow, mobileRow, nestOverlays, PAGE_WIDTH, PAGE_LEFT } from './rows';

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
    expect(groupRows(blocks).map((r) => r.map((x) => x.id))).toEqual([['copy'], ['heading', 'logo'], ['bg', 's1', 's2'], ['link']]);
  });
  it('keeps block order when some block has no box', () => {
    const rows = groupRows([{ id: 'a', box: b(0, 500, 10, 10) }, { id: 'b' }, { id: 'c', box: b(0, 0, 10, 10) }]);
    expect(rows.map((r) => r.map((x) => x.id))).toEqual([['a'], ['b'], ['c']]);
  });
});

describe('layoutRow', () => {
  it('sizes each cell as a share of the page width, offset from the column or the previous cell', () => {
    // notter's award logos at 1440: 129 wide at x=238, 102 wide at x=398.
    const row = [{ id: 'cert', box: b(398, 973, 102, 120) }, { id: 'spsa', box: b(238, 973, 129, 120) }];
    const cells = layoutRow(row);
    expect(cells.map((c) => c.block.id)).toEqual(['spsa', 'cert']); // left to right
    expect(cells[0]).toMatchObject({ width: +(129 / PAGE_WIDTH * 100).toFixed(3), offset: 0 }); // x left of the column clamps to 0
    expect(cells[1]).toMatchObject({ width: +(102 / PAGE_WIDTH * 100).toFixed(3), offset: +(31 / PAGE_WIDTH * 100).toFixed(3) });
  });
  it('scales a row wider than the page down to fit', () => {
    const cells = layoutRow([{ box: b(PAGE_LEFT, 0, 470, 310) }, { box: b(PAGE_LEFT + 480, 0, 466, 309) }]);
    const total = cells.reduce((s, c) => s + c.width + c.offset, 0);
    expect(total).toBeCloseTo(100, 1);
    expect(cells[0].width).toBeCloseTo(470 / 946 * 100, 2);
  });
  it('lets a cell overlap the one before it, as Wix places it', () => {
    // konicaminolta: the WhatsApp logo sits inside the heading's text box, after its words.
    const cells = layoutRow([{ box: b(236, 1226, 657, 31) }, { box: b(581, 1208, 51, 48) }]);
    expect(cells[1].offset).toBeCloseTo((581 - 893) / PAGE_WIDTH * 100, 2);
  });
  it('offsets a narrow block from the column edge', () => {
    expect(layoutRow([{ box: b(PAGE_LEFT + 94, 0, 470, 10) }])[0]).toMatchObject({ width: 50, offset: 10 });
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
  it('leaves side-by-side blocks alone', () => {
    const nested = nestOverlays([{ box: b(240, 0, 470, 310) }, { box: b(720, 0, 466, 309) }]);
    expect(nested.map((n) => n.overlays.length)).toEqual([0, 0]);
  });
});
