import { gsap } from './index';

/** Featured cards: each one shrinks back and dims as the next slides over it. */
export function stack(): void {
  const cards = gsap.utils.toArray<HTMLElement>('[data-stack] > .stack-card');
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: .92, filter: 'brightness(.55)', ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top+=120', scrub: true },
    });
  });
}
