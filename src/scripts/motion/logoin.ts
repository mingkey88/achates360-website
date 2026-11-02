import { gsap, ScrollTrigger } from './index';

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

/**
 * The bookend: as the footer's large logo comes on screen, its five figures drift in from apart and join
 * hands, so the homepage ends where it began. Played once, not scrubbed: the logo sits at the very foot of
 * the page, where the scroll runs out before a scrubbed gather could finish (it stopped mid-flight).
 */
export function footerGather(): void {
  const logo = document.querySelector<SVGSVGElement>('.mega-mark .logo');
  const figs = logo ? gsap.utils.toArray<SVGPathElement>(logo.querySelectorAll('.logo-fig')) : [];
  if (!logo || figs.length !== 5) return;
  const tl = gsap.timeline({ paused: true, onComplete: () => { gsap.set(figs, { clearProps: 'all' }); } });
  figs.forEach((f, i) => {
    const a = (i / figs.length) * Math.PI * 2 + .6;
    tl.from(f, { x: Math.cos(a) * 40, y: Math.sin(a) * 28, rotation: (i % 2 ? 1 : -1) * (40 + i * 12), opacity: .2, transformOrigin: '50% 50%', duration: 1.1, ease: 'power3.out' }, i * .08);
  });
  tl.progress(1).progress(0); // start state applied only when the logo nears, so it is never seen scattered at rest
  ScrollTrigger.create({ trigger: logo, start: 'top 95%', once: true, onEnter: () => tl.play(0) });
}
