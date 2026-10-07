import { gsap } from './index';

/** Stat numbers count up from 0 when they come into view; the HTML already holds the final value. */
export function counters(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-count]')) {
    const end = Number(el.dataset.count);
    if (!Number.isFinite(end)) continue;
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.6, ease: 'power2.out',
      onStart: () => { el.textContent = '0'; },
      onUpdate: () => { el.textContent = String(Math.round(o.v)); },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  }
}
