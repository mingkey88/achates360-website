/**
 * Wix page geometry at the 1440 render, used by src/lib/rows.ts to read the exported layout boxes
 * (which blocks sat side by side). The redesign's CSS no longer mirrors these numbers.
 */
export const VIEWPORT = 1440;
export const PAGE_WIDTH = 940;
export const COLUMN_SHIFT = 10;
export const PAGE_LEFT = VIEWPORT / 2 - PAGE_WIDTH / 2 - COLUMN_SHIFT; // 240
// Wix's mobile layout: a 320px page with a 280px column at x=20 (notter, dxv on iPhone 13).
export const MOBILE_WIDTH = 280;
export const MOBILE_LEFT = 20;
