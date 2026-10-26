import { gsap } from './index';

/**
 * The masthead logo assembles as the homepage opens (client, 26 Oct 2026: "i actually like how the
 * achates logo fly in" on About, "could you do that for the navbar or at least the hero"): its five
 * figures fly in from apart, turning, each in a brand colour, and settle to ink as they join hands, as on
 * About (story.ts gather); then the lettering slides in beside them. Plays once per page load.
 */
export function logoIn(): void {
  const logo = document.querySelector<SVGSVGElement>('.site-header .logo');
  const figs = logo ? gsap.utils.toArray<SVGPathElement>(logo.querySelectorAll('.logo-fig')) : [];
  const word = logo?.querySelector<SVGPathElement>('.logo-word');
  if (!logo || figs.length !== 5 || !word) return;
  const ARRIVAL = ['#ff9015', '#99d9d9', '#cbe880', '#99d9d9', '#ff9015'];
  const tl = gsap.timeline({ delay: .25, onComplete: () => { gsap.set([...figs, word], { clearProps: 'all' }); } });
  figs.forEach((f, i) => {
    const a = (i / figs.length) * Math.PI * 2 + .6;
    tl.from(f, {
      x: Math.cos(a) * 60, y: Math.sin(a) * 40, rotation: (i % 2 ? 1 : -1) * (90 + i * 25), scale: .4, opacity: 0,
      transformOrigin: '50% 50%', duration: 1.1, ease: 'power3.out',
    }, i * .08);
    tl.fromTo(f, { fill: ARRIVAL[i] }, { fill: 'currentColor', duration: .6, ease: 'power1.in' }, .6 + i * .08);
  });
  tl.from(word, { x: -14, opacity: 0, duration: .8, ease: 'power3.out' }, .75);
}
