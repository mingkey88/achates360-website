import { gsap } from './index';

// Each figure arrives in a corporate colour, then all turn white as they join hands.
const ARRIVAL = ['#ff9015', '#99d9d9', '#cbe880', '#99d9d9', '#ff9015'];
const CRUISE = 7;   // degrees per second once the ring has settled
const LAUNCH = 90;  // degrees per second as the ring whooshes in

/**
 * Homepage hero as a short film (spec §4.1, ruling R29): the letterbox opens, the five logo figures
 * fly in and gather into their circle, the wordmark tracks in, then a ring of project images whooshes
 * up and settles into a slow orbit the visitor can drag. Scrolling pulls the camera back through it.
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
    .from(q('.hh-logo'), { scale: 1.3, duration: 4.2, ease: 'power2.out' }, .4);
  figs.forEach((g, i) => {
    const a = (i / figs.length) * Math.PI * 2 + .6;
    tl.from(g, {
      x: Math.cos(a) * 170, y: Math.sin(a) * 120 - 30, rotation: (i % 2 ? 1 : -1) * (90 + i * 25), scale: .25, opacity: 0,
      transformOrigin: '50% 50%', duration: 1.9,
    }, .8 + i * .13);
    tl.fromTo(g, { fill: ARRIVAL[i % ARRIVAL.length] }, { fill: '#ffffff', duration: 1.2, ease: 'power1.inOut' }, 2.2);
  });
  tl.from(q('.lg-ch'), { opacity: 0, x: (i) => (i - 4.5) * 16, duration: 1.5, stagger: .045 }, 2.1)
    .from(q('.hh-tagline'), { opacity: 0, y: 14, letterSpacing: '.9em', duration: 1.8 }, 2.6)
    .from(q('.hh-ring'), { opacity: 0, scale: .5, duration: 2.8 }, 2.3);

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
    .to(q('.hh-center'), { yPercent: -60, opacity: 0, ease: 'none' }, 0)
    .to(q('.hh-bars i'), { scaleY: 0, ease: 'none' }, 0);
}
