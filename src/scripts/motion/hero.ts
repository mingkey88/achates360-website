import { gsap, isLate } from './index';
import { lensPose, lensOpacity, LENS_DESKTOP, LENS_PHONE } from '../../lib/lens';

// Each figure arrives in a corporate colour, then all settle to ink as they join hands.
const ARRIVAL = ['#ff9015', '#99d9d9', '#cbe880', '#99d9d9', '#ff9015'];
const DRIFT = .14; // cards per second

/**
 * Direction B homepage hero (after kitpro-croma): the lens of project images is on the paper from the
 * first frame and drifts slowly round the cylinder (drag to scrub, pause button stops it; it eases to a
 * stop under the mouse so a card can be opened); the five logo figures gather above
 * the logo's wordmark. Scrolling away lifts the arc and fades the copy.
 */
export function hero(): void {
  const root = document.querySelector<HTMLElement>('[data-hero]');
  const arc = root?.querySelector<HTMLElement>('[data-arc]');
  if (!root || !arc) return;
  const q = gsap.utils.selector(root);
  const cards = q('.ha-card') as HTMLElement[];
  const figs = q('.lg-fig');
  const n = cards.length;
  const mid = Math.floor(n / 2);
  // The lens curve for the current breakpoint (the same as HeroArc.astro's media query).
  const phone = window.matchMedia('(max-width: 767px)');
  const lens = () => (phone.matches ? LENS_PHONE : LENS_DESKTOP);

  // The cards are not animated in: the work is there from the first frame. Only the logo assembles.
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  figs.forEach((g, i) => {
    const a = (i / figs.length) * Math.PI * 2 + .6;
    tl.from(g, { x: Math.cos(a) * 120, y: Math.sin(a) * 80, rotation: (i % 2 ? 1 : -1) * (90 + i * 25), scale: .3, opacity: 0, transformOrigin: '50% 50%', duration: 1.6 }, .5 + i * .1);
    tl.fromTo(g, { fill: ARRIVAL[i % ARRIVAL.length] }, { fill: '#333333', duration: 1, ease: 'power1.inOut' }, 1.7);
  });
  // The logo's lowercase wordmark letters settle in under the figures. The words beside it (tagline,
  // description, button) are there from the first frame: the message never waits on the motion.
  tl.from(q('.lg-ch'), { opacity: 0, y: 6, duration: 1.2, stagger: .04 }, 1.2);
  // Late bundle (slow connection): the hero is already showing, so jump the entrance to its end
  // (from() states apply at once, so it must not sit at its start) and keep only the drift.
  if (isLate()) tl.progress(1);

  // Drift: every card moves along the curve on a track that wraps after n cards. Cards fade out as
  // they turn edge-on at the sides, long before they wrap round to the other end.
  const state = { offset: 0, boost: 0, speed: DRIFT };
  // Last value written per card and property: a style write (and the blur re-raster it causes) only
  // happens when the value actually changes.
  const written = cards.map(() => new Map<string, string>());
  const set = (i: number, prop: string, v: string) => {
    if (written[i].get(prop) === v) return;
    written[i].set(prop, v);
    if (prop === 'visibility') cards[i].style.visibility = v; else cards[i].style.setProperty(prop, v);
  };
  const place = () => cards.forEach((_c, i) => {
    const u = ((((i - mid + state.offset + n / 2) % n) + n) % n) - n / 2;
    const L = lens();
    const p = lensPose(u, L);
    const o = lensOpacity(p, L);
    set(i, '--cx', p.x.toFixed(3));
    set(i, '--cz', p.z.toFixed(3));
    set(i, '--cry', p.ry.toFixed(3));
    set(i, '--co', o.toFixed(3));
    set(i, 'visibility', o > 0 ? '' : 'hidden');
    // Depth of field (same curve as the server render in HeroArc.astro), quantised so the blur is
    // only re-rasterised when it visibly changes.
    const d = Math.max(0, Math.abs(u) - .55);
    set(i, '--blur', `${Math.round(Math.min(d * 1.6, 5) * 4) / 4}px`);
    set(i, '--sat', (1 - Math.min(d * .18, .35)).toFixed(2));
    // Captions on the centre card and its neighbours only (as HeroArc.astro renders them).
    set(i, '--cap', Math.abs(u) <= 1.5 ? '1' : '0');
  });
  // The drift runs only while the hero is on screen (also right after a reload that restores the
  // scroll position further down, where no scroll event would have switched it on or off).
  let active = false, hovering = false;
  new IntersectionObserver(([e]) => { active = e.isIntersecting; }).observe(root);
  gsap.ticker.add((_t, dt) => {
    if (!active) return;
    // Paused, or a card under the mouse: the drift eases to a stop.
    const still = root.hasAttribute('data-paused') || hovering;
    state.speed += ((still ? 0 : DRIFT) - state.speed) * (1 - Math.pow(.9, dt / (1000 / 60)));
    state.offset -= (state.speed + state.boost) * dt / 1000;
    state.boost *= Math.pow(.93, dt / (1000 / 60)); // the same decay at any refresh rate
    place();
  });

  arc.addEventListener('pointerover', (e) => { hovering = e.pointerType === 'mouse' && !!(e.target as Element).closest('.ha-card'); });
  arc.addEventListener('pointerleave', () => { hovering = false; });

  // Drag to scrub. A press only becomes a drag after 6px of movement, so a plain click still opens the
  // card's project; the click that ends a drag is swallowed.
  let lastX = 0, lastT = 0, startX = 0, down = false, dragging = false, dragged = false;
  arc.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // primary button or touch only
    down = true; dragging = false; dragged = false; startX = lastX = e.clientX; lastT = e.timeStamp;
  });
  arc.addEventListener('pointermove', (e) => {
    // A press released outside the arc (before capture) never sends it a pointerup: no button, no drag.
    if (down && e.buttons === 0) down = dragging = false;
    if (!down) return;
    if (!dragging) {
      if (Math.abs(e.clientX - startX) < 6) return;
      dragging = dragged = true;
      arc.setPointerCapture(e.pointerId);
    }
    const du = (e.clientX - lastX) / (cards[0].offsetWidth * .85);
    state.offset += du;
    state.boost = gsap.utils.clamp(-4, 4, (-du * 1000) / Math.max(e.timeStamp - lastT, 1));
    lastX = e.clientX; lastT = e.timeStamp;
  });
  // The click that ends a drag arrives straight after pointerup; after that, clicks open cards again.
  const release = () => { down = dragging = false; if (dragged) setTimeout(() => { dragged = false; }, 0); };
  arc.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
  arc.addEventListener('pointerup', release);
  arc.addEventListener('pointercancel', release);

  gsap.timeline({
    scrollTrigger: {
      trigger: root, start: 'top top', end: 'bottom top', scrub: true,
    },
  })
    .to(arc, { yPercent: -18, ease: 'none' }, 0)
    .to(q('.ha-copy'), { opacity: 0, y: -40, ease: 'none', duration: .6 }, 0);
}

// Drift needs no hidden start state: safe to start late (the entrance is skipped then).
hero.lateSafe = true;
