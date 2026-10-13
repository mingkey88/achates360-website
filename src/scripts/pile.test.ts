import { describe, expect, it } from 'vitest';
import { clampOffset } from './pile';

describe('clampOffset', () => {
  it('lets a picture move freely inside the stage', () => {
    expect(clampOffset(40, 0, 500, 0, 1000)).toBe(40);
  });
  it('stops the centre at the stage edge', () => {
    expect(clampOffset(800, 0, 500, 0, 1000)).toBe(500);
    expect(clampOffset(-800, 0, 500, 0, 1000)).toBe(-500);
  });
  it('measures from where the last drag left it', () => {
    // already moved 300px right, centre now at 800: only 200px more room
    expect(clampOffset(700, 300, 800, 0, 1000)).toBe(500);
  });
});
