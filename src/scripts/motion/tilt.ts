import { gsap } from './index';

/** Cards lean toward the pointer (hover-capable pointers only). */
export function tilt(): void {
  if (!window.matchMedia('(hover: hover)').matches) return;
  for (const el of document.querySelectorAll<HTMLElement>('[data-tilt]')) {
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: .4, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: .4, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 8);
      rx(-((e.clientY - r.top) / r.height - .5) * 8);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }
}
