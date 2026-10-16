import { gsap } from './index';

/**
 * How we work on /services (ProcessSteps.astro), wide screens: the section holds still for a stretch of
 * scroll while its four steps rise in from below, one after another, to fill the right side two by two;
 * the press sheet at the left takes the stage of the newest step (1 Brief … 4 Deliver). Narrow screens
 * keep the plain column (matchMedia reverts the hold when the window narrows).
 */
export function press(): void {
  const root = document.querySelector<HTMLElement>('[data-press]');
  const svg = root?.querySelector<SVGSVGElement>('.pr');
  if (!root || !svg) return;
  const steps = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-step]'));
  const stage = (n: number) => { for (const k of [1, 2, 3, 4]) svg.toggleAttribute(`data-s${k}`, n >= k); };
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    root.classList.add('is-pinned');
    stage(0);
    let shown = 0;
    // Each step takes a quarter of the hold to rise in; the sheet follows the newest one fully in.
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        // A hold of whole grid squares (120px), so the section's own grid (below) meets the page's at both ends.
        trigger: root, start: 'top top', end: () => `+=${Math.max(1, Math.round((innerHeight * 1.4) / 120)) * 120}`, pin: true, scrub: .5, invalidateOnRefresh: true,
        // While held, the section carries its own copy of the page's paper and grid (the body's would scroll
        // behind it), lined up with the body's where the hold starts.
        onRefresh: (st) => {
          root.style.setProperty('--grid-y', `${-Math.round(st.start)}px`);
          root.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
        },
        onUpdate: (st) => {
          const n = Math.min(steps.length, Math.floor(st.progress * steps.length + .35));
          if (n !== shown) { shown = n; stage(n); }
        },
      },
    });
    steps.forEach((s, i) => tl.fromTo(s, { y: 140, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1 }, i));
    tl.to({}, { duration: .4 }); // a beat with all four in and the sheet delivered, before the page moves on
    return () => { root.classList.remove('is-pinned'); stage(4); gsap.set(steps, { clearProps: 'all' }); };
  });
}
