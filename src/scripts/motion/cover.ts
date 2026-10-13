import { gsap } from './index';

/**
 * The projects cover (ProjectsCover.astro): a die-cut sheet lying over the top of the page. The page
 * holds still (pinned) for a while as scrolling starts, and the sheet slides away to the left over it,
 * so what shows through the cut stays in place. Triggers inside the pinned page take the pin into
 * account through [data-pin-container] (motion/reveal.ts).
 */
export function cover(): void {
  const pc = document.querySelector<HTMLElement>('[data-pcover]');
  const page = pc?.closest<HTMLElement>('[data-pin-container]');
  if (!pc || !page) return;
  const sheet = pc.querySelector<HTMLElement>('.pc-sheet')!;
  // The cover is the first thing on the page, so the hold runs from scroll 0 for 70% of a screen.
  gsap.timeline({ scrollTrigger: { trigger: page, start: 0, end: () => `+=${Math.round(innerHeight * .7)}`, pin: true, scrub: .6, invalidateOnRefresh: true } })
    .fromTo(sheet, { x: 0 }, { x: () => -(sheet.offsetLeft + sheet.offsetWidth + 40), ease: 'power2.inOut' });
}
