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
  const msg = root.querySelector('[data-scatter-msg]');
  // How far each picture sits from the stage centre (measured without any transform applied).
  const offset = (el: HTMLElement, axis: 'x' | 'y') => {
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const t = gsap.getProperty(el, axis) as number;
    return axis === 'x' ? s.left + s.width / 2 - (r.left + r.width / 2 - t) : s.top + s.height / 2 - (r.top + r.height / 2 - t);
  };
  // Phones show six pictures above and below the message, desktop nine around it: each layout gets
  // its own timeline, rebuilt when the viewport crosses the breakpoint (matchMedia reverts the other).
  const mm = gsap.matchMedia();
  mm.add({ phone: '(max-width: 767px)', desk: '(min-width: 768px)' }, (ctx) => {
    const pics = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('.pic')).filter((p) => p.offsetParent !== null);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: .4, invalidateOnRefresh: true },
    });
    pics.forEach((p, i) => {
      tl.from(p, {
        x: () => offset(p, 'x') * .92 + (i % 3 - 1) * 24,
        y: () => offset(p, 'y') * .92 + (i % 2 ? 14 : -14),
        rotation: (i % 2 ? 1 : -1) * (3 + (i % 4) * 2), scale: .62, duration: .5,
      }, i * .035);
    });
    // autoAlpha: while hidden the message (and its button) is visibility:hidden, so not focusable.
    // On phones the pictures settle around the message, so it waits until they have.
    const at = ctx.conditions?.phone ? .66 : .5;
    if (msg) tl.from(msg, { autoAlpha: 0, y: 30, duration: .2 }, at).to({}, { duration: .15 });
  });
}
