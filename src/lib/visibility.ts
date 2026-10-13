/**
 * Text Achates hid on Wix by colouring it like the page (white on white, #f2f2f2 on #f2f2f2):
 * leftovers from a duplicated page (Singapore Road Safety carried Nötter's award list) and award
 * lines they chose not to show. Wix visitors never see these blocks, so the site leaves them out.
 * Measured with the WCAG contrast ratio between the block's colour and its page's background; real
 * text on these pages is 2:1 or more (the palest, #adadac headings, is 2.2:1), hidden text is under
 * 1.15:1. Audit and list: docs/hidden-wix-text-2026-10-13.md.
 */
const MIN_CONTRAST = 1.3;
const WHITE = '#ffffff';

function rgb(c: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim());
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((x) => x + x).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const fn = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(c.trim());
  return fn ? [+fn[1], +fn[2], +fn[3]] : null;
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => { const s = v / 255; return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; };
  return .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
}

/** WCAG contrast ratio of two CSS colours (hex or rgb()); null when either can't be read. */
export function contrastRatio(a: string, b: string): number | null {
  const x = rgb(a), y = rgb(b);
  if (!x || !y) return null;
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + .05) / (lo + .05);
}

/** Whether a text block's colour makes it invisible on its page (Wix pages are white unless they say otherwise). */
export function isHiddenText(block: { type: string; color?: string }, pageBackground: string = WHITE): boolean {
  if (block.type !== 'text' || !block.color) return false;
  const ratio = contrastRatio(block.color, pageBackground);
  return ratio !== null && ratio < MIN_CONTRAST;
}

/** The blocks a Wix visitor actually sees. */
export const visibleBlocks = <T extends { type: string; color?: string }>(blocks: T[], pageBackground?: string): T[] =>
  blocks.filter((b) => !isHiddenText(b, pageBackground));
