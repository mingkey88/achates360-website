import { gsap } from './index';

/**
 * Homepage closing section (after kitpro-croma): the pictures begin as one stacked, slightly turned pile
 * at the centre of the sticky stage and spread to their places as you scroll; the message then rises in.
 * The places are the CSS ones, so the pile is a .from() state and no motion leaves the final layout.
 */
export function scatter(): void {
  const root = document.querySelector<HTMLElement>('[data-scatter]');
  const stage = root?.querySelector<HTMLElement>('.scta-stage');
  if (!root || !stage) return;
  const pics = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('.pic')).filter((p) => p.offsetParent !== null);
  const msg = root.querySelector('[data-scatter-msg]');
  // How far each picture sits from the stage centre (measured without any transform applied).
  const offset = (el: HTMLElement, axis: 'x' | 'y') => {
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const t = gsap.getProperty(el, axis) as number;
    return axis === 'x' ? s.left + s.width / 2 - (r.left + r.width / 2 - t) : s.top + s.height / 2 - (r.top + r.height / 2 - t);
  };
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: .8, invalidateOnRefresh: true },
  });
  pics.forEach((p, i) => {
    tl.from(p, {
      x: () => offset(p, 'x') * .92 + (i % 3 - 1) * 24,
      y: () => offset(p, 'y') * .92 + (i % 2 ? 14 : -14),
      rotation: (i % 2 ? 1 : -1) * (3 + (i % 4) * 2), scale: .62, duration: .62,
    }, 0);
  });
  if (msg) tl.from(msg, { opacity: 0, y: 30, duration: .22 }, .58).to({}, { duration: .2 });
}
