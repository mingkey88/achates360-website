import { gsap, SplitText } from './index';

// Each figure arrives in a corporate colour, then all turn white as they join hands.
const ARRIVAL = ['#ff9015', '#99d9d9', '#cbe880', '#99d9d9', '#ff9015'];
const CRUISE = 7;   // degrees per second once the ring has settled
const LAUNCH = 90;  // degrees per second as the ring whooshes in

/**
 * Homepage hero as a short film (spec §4.1, rulings R29–R30): the letterbox opens, the five logo
 * figures fly in and gather into their circle, the full-width title rises letter by letter, a ring of
 * project images whooshes up and settles into a slow orbit the visitor can drag, and the bottom corners
 * fill in. Scrolling pulls the camera back through it.
 */
export function hero(): void {
  const root = document.querySelector<HTMLElement>('[data-hero]');
  if (!root) return;
  const q = gsap.utils.selector(root);
  const figs = q('.lg-fig');
  const items = q('.hh-item');

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(q('.hh-bars i'), { height: '50.5%', duration: 1.8, ease: 'expo.inOut' }, 0)
    .from(q('.hh-glow'), { opacity: 0, scale: .3, duration: 2.6 }, .5)
    .from(q('.hh-figures'), { scale: 1.5, duration: 4.2, ease: 'power2.out' }, .4);
  figs.forEach((g, i) => {
    const a = (i / figs.length) * Math.PI * 2 + .6;
    tl.from(g, {
      x: Math.cos(a) * 170, y: Math.sin(a) * 120 - 30, rotation: (i % 2 ? 1 : -1) * (90 + i * 25), scale: .25, opacity: 0,
      transformOrigin: '50% 50%', duration: 1.9,
    }, .8 + i * .13);
    tl.fromTo(g, { fill: ARRIVAL[i % ARRIVAL.length] }, { fill: '#ffffff', duration: 1.2, ease: 'power1.inOut' }, 2.2);
  });
  const title = q('.hh-title')[0] as HTMLElement;
  const chars = SplitText.create(title, { type: 'chars', mask: 'chars' }).chars;
  tl.from(chars, { yPercent: 105, duration: 1.4, stagger: { each: .05, from: 'center' } }, 2.0)
    .from(q('.hh-statement span'), { yPercent: 60, opacity: 0, duration: 1.4, stagger: .12 }, 2.9)
    .from(q('.hh-blurb'), { y: 20, opacity: 0, duration: 1.4 }, 3.1)
    // Fade through --fade, never the ring's own opacity (that flattens its 3D until the fade ends).
    .from(q('.hh-ring'), { '--fade': 0, scale: .5, duration: 2.8 }, 2.3);

  // The orbit: angle advances every frame; each card's place comes from --s/--c (sin/cos) in CSS.
  const ring = { angle: 0, speed: LAUNCH, boost: 0 };
  tl.to(ring, { speed: CRUISE, duration: 3.2, ease: 'power3.out' }, 2.3);
  const step = 360 / items.length;
  const place = () => items.forEach((el, i) => {
    const a = ((ring.angle + i * step) * Math.PI) / 180;
    el.style.setProperty('--s', Math.sin(a).toFixed(4));
    el.style.setProperty('--c', Math.cos(a).toFixed(4));
  });
  let active = true;
  const tick = (_t: number, dt: number) => {
    if (!active) return;
    const paused = root.hasAttribute('data-paused');
    ring.angle += ((paused ? 0 : ring.speed) + ring.boost) * dt / 1000;
    ring.boost *= .94;
    place();
  };
  gsap.ticker.add(tick);

  // Drag to spin; letting go keeps some of the throw.
  const stage = q('.hh-stage')[0] as HTMLElement;
  let lastX = 0, lastT = 0, dragging = false;
  stage.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastT = e.timeStamp; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dt = Math.max(e.timeStamp - lastT, 1);
    ring.angle += dx * .18;
    ring.boost = gsap.utils.clamp(-400, 400, (dx * .18 * 1000) / dt);
    lastX = e.clientX; lastT = e.timeStamp;
  });
  const release = () => { dragging = false; };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  // Scrolling away: the camera pulls back through the ring, the title rises, the bars slide off.
  gsap.timeline({
    scrollTrigger: {
      trigger: root, start: 'top top', end: 'bottom top', scrub: true,
      // The orbit only stops once the hero is off screen (at scroll 0 the trigger is not 'active').
      onLeave: () => { active = false; }, onEnterBack: () => { active = true; },
    },
  })
    .to(stage, { scale: 1.6, opacity: 0, ease: 'none' }, 0)
    .to(title, { yPercent: -40, opacity: 0, ease: 'none' }, 0)
    .to(q('.hh-figures'), { scale: 1.4, opacity: 0, ease: 'none' }, 0)
    .to(q('.hh-foot'), { y: -60, opacity: 0, ease: 'none', duration: .6 }, 0)
    // The bars leave within the first quarter, so no black band sits between the hero and Selected work.
    .to(q('.hh-bars i'), { scaleY: 0, ease: 'none', duration: .25 }, 0);
}
