/**
 * Page geometry, one source (Task 11b fix 1). The CSS side is tokens.css `--page-max` and
 * `--column-shift`; scripts/layout.test.mjs fails if they drift from these numbers.
 *
 * Desktop content column at the 1440 render: Wix's images, galleries and players run x=238..1178
 * (notter) and 240..1188 (dxv). The clone's column is PAGE_WIDTH wide and sits COLUMN_SHIFT px
 * left of centre (Project.astro: calc(50% - var(--page-max) / 2 - var(--column-shift))).
 */
export const VIEWPORT = 1440;
export const PAGE_WIDTH = 940;
export const COLUMN_SHIFT = 10;
export const PAGE_LEFT = VIEWPORT / 2 - PAGE_WIDTH / 2 - COLUMN_SHIFT; // 240
// Wix's mobile layout: a 320px page with a 280px column at x=20 (notter, dxv on iPhone 13).
export const MOBILE_WIDTH = 280;
export const MOBILE_LEFT = 20;
