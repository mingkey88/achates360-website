import { describe, expect, it } from 'vitest';
import { contrastRatio, isHiddenText, visibleBlocks } from './visibility';

describe('contrastRatio', () => {
  it('measures black on white as 21:1 and a colour on itself as 1:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('rgb(242, 242, 242)', '#f2f2f2')).toBeCloseTo(1, 5);
  });
  it('reads short hex and rgb()', () => {
    expect(contrastRatio('#fff', 'rgb(255,255,255)')).toBeCloseTo(1, 5);
  });
  it('gives up on colours it cannot read', () => {
    expect(contrastRatio('transparent', '#fff')).toBeNull();
  });
});

describe('isHiddenText', () => {
  const text = (color?: string) => ({ type: 'text', md: 'x', color });
  it('hides white text on a white page (the default) and #f2f2f2 text on a #f2f2f2 page', () => {
    expect(isHiddenText(text('#ffffff'))).toBe(true);
    expect(isHiddenText(text('#f2f2f2'), '#f2f2f2')).toBe(true);
    expect(isHiddenText(text('#f2f2f2'))).toBe(true); // 1.12:1 on white
  });
  it('keeps real text, even the palest grey headings', () => {
    expect(isHiddenText(text('#adadac'))).toBe(false);
    expect(isHiddenText(text('#a0a09f'))).toBe(false);
    expect(isHiddenText(text('#ffffff'), '#282626')).toBe(false); // white on a dark page
    expect(isHiddenText(text())).toBe(false); // the default colour
  });
  it('only judges text blocks', () => {
    expect(isHiddenText({ type: 'image', color: '#ffffff' })).toBe(false);
  });
});

describe('visibleBlocks', () => {
  it('drops hidden text and keeps the order of the rest', () => {
    const blocks = [{ type: 'text', color: '#333333' }, { type: 'text', color: '#ffffff' }, { type: 'image' }];
    expect(visibleBlocks(blocks)).toEqual([blocks[0], blocks[2]]);
  });
});
