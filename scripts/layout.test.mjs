// Page geometry has one source: src/lib/layout.ts. The CSS that lays out the column must use the
// same numbers (Task 11b fix 1).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PAGE_WIDTH, PAGE_LEFT, COLUMN_SHIFT, VIEWPORT } from '../src/lib/layout.ts';

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');

describe('page geometry', () => {
  it('derives the column left edge from the viewport, width and shift', () => {
    expect(PAGE_LEFT).toBe(VIEWPORT / 2 - PAGE_WIDTH / 2 - COLUMN_SHIFT);
  });
  it('matches the CSS tokens and the case-study column rule', () => {
    expect(read('styles/tokens.css')).toContain(`--page-max: ${PAGE_WIDTH}px;`);
    expect(read('styles/tokens.css')).toContain(`--column-shift: ${COLUMN_SHIFT}px;`);
    expect(read('layouts/Project.astro')).toContain('calc(50% - var(--page-max) / 2 - var(--column-shift))');
  });
});
