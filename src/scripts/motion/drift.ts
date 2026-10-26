import { gsap } from './index';

/**
 * Rows that drift sideways with the scroll (client, 26 Oct 2026: "more interesting animation"; the client
 * wall had no "vibes"): inside a [data-drift] frame, each [data-drift-row] slides across its full overflow
 * while the frame crosses the screen, alternate rows the other way. Tied to the scroll, so it moves only
 * when the visitor does and needs no pause control.
 */
export function drift(): void {
  for (const frame of document.querySelectorAll<HTMLElement>('[data-drift]')) {
    frame.querySelectorAll<HTMLElement>('[data-drift-row]').forEach((row, i) => {
      const travel = () => Math.max(0, row.scrollWidth - frame.clientWidth);
      const [from, to] = i % 2 ? [() => -travel(), 0] : [0, () => -travel()];
      gsap.fromTo(row, { x: from }, {
        x: to, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: .6, invalidateOnRefresh: true },
      });
    });
  }
}
drift.lateSafe = true;
