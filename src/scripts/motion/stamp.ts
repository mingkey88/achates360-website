import { gsap } from './index';

/**
 * Seals pressed onto the page (client, 26 Oct 2026: "more interesting animation"): as a [data-stamp] group
 * comes on screen, each [data-stamp-item] drops in a little large and askew and settles flat, one after
 * another, like a stamp.
 */
export function stamp(): void {
  for (const group of document.querySelectorAll<HTMLElement>('[data-stamp]')) {
    const items = group.querySelectorAll<HTMLElement>('[data-stamp-item]');
    gsap.from(items, {
      scale: 1.35, rotation: (i) => (i % 2 ? 7 : -6), opacity: 0, duration: .55, ease: 'back.out(2.2)', stagger: .07,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: group, start: 'top 85%', once: true },
    });
  }
}
