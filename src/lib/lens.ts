/**
 * The homepage hero's lens strip (after kitpro-croma): cards stand edge to edge along a curve that is
 * almost flat in the middle and swings toward the viewer at the edges, unlike a circle, which bends
 * evenly. The curve's direction at arc length s from the centre (v = |s| / pitch, in cards) is
 *   theta(v) = max * (1 - exp(-(v / reach) ^ power))   degrees, signed like s,
 * so it is near 0 in the middle, turns fastest around `reach` cards out and levels off below `max`:
 * the outer cards keep sliding off the screen's edge instead of curling back, so the edges are never
 * empty. A card's centre is the curve point at s = u * pitch (u: its place in cards from the centre,
 * fractional while the strip drifts), found by integrating the direction. Shared by the server render
 * (HeroArc.astro) and hero.ts. Units: x, z and P (the CSS perspective) in vw, z toward the viewer;
 * ry in degrees (positive turns the card's inner side away from the viewer).
 */
export interface LensOpts { card: number; gap: number; max: number; reach: number; power: number; P: number }
export interface LensPose { x: number; z: number; ry: number }

// P must match HeroArc.astro's --P for the same breakpoint.
export const LENS_DESKTOP: LensOpts = { card: 42, gap: 1.05, max: 68, reach: 1.5, power: 2.2, P: 126 };
export const LENS_PHONE: LensOpts = { card: 72, gap: 1.4, max: 70, reach: 1.2, power: 2, P: 131 };

const DS = .25; // integration step, vw

export function lensAngle(s: number, o: LensOpts): number {
  const v = Math.abs(s) / (o.card + o.gap);
  return Math.sign(s) * o.max * (1 - Math.exp(-Math.pow(v / o.reach, o.power)));
}

export function lensPose(u: number, o: LensOpts): LensPose {
  const end = u * (o.card + o.gap);
  const steps = Math.max(1, Math.ceil(Math.abs(end) / DS));
  const ds = end / steps;
  let x = 0, z = 0;
  // Midpoint rule along the arc; both sides come toward the viewer.
  for (let i = 0; i < steps; i++) {
    const a = (lensAngle((i + .5) * ds, o) * Math.PI) / 180;
    x += Math.cos(a) * ds;
    z += Math.sin(Math.abs(a)) * Math.abs(ds);
  }
  return { x, z, ry: lensAngle(end, o) };
}

/**
 * Opacity for a card at this pose: 1 while any of it can be on screen, fading to 0 once its inner
 * edge has left the screen (projected beyond 50vw from the centre), and 0 before it nears the camera.
 */
export function lensOpacity(p: LensPose, o: LensOpts): number {
  const r = (p.ry * Math.PI) / 180;
  const half = o.card / 2;
  const innerX = Math.abs(p.x) - Math.cos(r) * half;
  const innerZ = p.z - Math.sin(Math.abs(r)) * half;
  const outerZ = p.z + Math.sin(Math.abs(r)) * half;
  if (o.P - outerZ < o.P * .12) return 0;
  const screenX = (innerX * o.P) / (o.P - innerZ);
  return Math.min(1, Math.max(0, (58 - screenX) / 8));
}
