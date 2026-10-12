import { describe, expect, it } from 'vitest';
import { lensPose, lensOpacity, LENS_DESKTOP as D, LENS_PHONE as M } from './lens';

describe('lens strip curve', () => {
  it('keeps the centre card flat and in place', () => {
    expect(lensPose(0, D)).toEqual({ x: 0, z: 0, ry: 0 });
  });
  it('is symmetric', () => {
    const r = lensPose(1.7, D), l = lensPose(-1.7, D);
    expect(l.x).toBeCloseTo(-r.x, 6);
    expect(l.z).toBeCloseTo(r.z, 6);
    expect(l.ry).toBeCloseTo(-r.ry, 6);
  });
  it('is nearly flat in the middle and swings sharply toward the viewer at the edges', () => {
    expect(lensPose(.5, D).ry).toBeLessThan(8);
    expect(lensPose(2, D).ry).toBeGreaterThan(50);
    expect(lensPose(2, D).z).toBeGreaterThan(4 * lensPose(1, D).z);
  });
  it('levels off below its maximum turn (cards never curl back)', () => {
    for (const u of [3, 4, 5]) expect(lensPose(u, D).ry).toBeLessThan(D.max);
    expect(lensPose(5, D).x).toBeGreaterThan(lensPose(4, D).x);
  });
  it('spaces neighbours about one card apart along the curve', () => {
    const a = lensPose(0, D), b = lensPose(1, D);
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    expect(d).toBeGreaterThan(D.card * .97);
    expect(d).toBeLessThanOrEqual(D.card + D.gap + 1e-9);
  });
  it('shows the cards on screen and hides the ones that have left it', () => {
    for (const u of [0, 1, 2]) expect(lensOpacity(lensPose(u, D), D)).toBe(1);
    expect(lensOpacity(lensPose(4, D), D)).toBe(0);
    expect(lensOpacity(lensPose(0, M), M)).toBe(1);
    expect(lensOpacity(lensPose(3, M), M)).toBe(0);
  });
});
