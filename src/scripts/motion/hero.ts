import { gsap, SplitText } from './index';

// Each figure arrives in a corporate colour, then all settle to ink as they join hands.
const ARRIVAL = ['#ff9015', '#99d9d9', '#cbe880', '#99d9d9', '#ff9015'];
const DRIFT = .045; // half-viewport widths per second

/**
 * Direction B homepage hero (after kitpro-croma): the arc of project images rises in from the centre
 * outward and drifts slowly sideways (drag to scrub, pause button stops it); the five logo figures
 * gather above the title, which letter-spaces in; the bottom corners fade up. Scrolling away lifts
 * the arc and fades the copy.
 */
export function hero(): void {
  const root = document.querySelector<HTMLElement>('[data-hero]');
  const arc = root?.querySelector<HTMLElement>('[data-arc]');
  if (!root || !arc) return;
  const q = gsap.utils.selector(root);
  const cards = q('.ha-card') as HTMLElement[];
  const figs = q('.lg-fig');
  const n = cards.length;
  const step = parseFloat(arc.dataset.step ?? '.34');
  const span = n * step; // the track wraps after this many half-viewport widths

  // Cards rise in from the centre outward; they fade via --in so their 3D placement never flattens.
  const order = cards.map((_, i) => Math.abs(i - (n - 1) / 2));
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo(cards, { '--in': 0, yPercent: 30 }, { '--in': 1, yPercent: 0, duration: 1.6, stagger: (i) => order[i] * .09 }, .2);
  figs.forEach((g, i) => {
    const a = (i / figs.length) * Math.PI * 2 + .6;
    tl.from(g, { x: Math.cos(a) * 120, y: Math.sin(a) * 80, rotation: (i % 2 ? 1 : -1) * (90 + i * 25), scale: .3, opacity: 0, transformOrigin: '50% 50%', duration: 1.6 }, .5 + i * .1);
    tl.fromTo(g, { fill: ARRIVAL[i % ARRIVAL.length] }, { fill: '#151414', duration: 1, ease: 'power1.inOut' }, 1.7);
  });
  const title = q('.ha-title')[0] as HTMLElement;
  const chars = SplitText.create(title, { type: 'chars' }).chars;
  tl.from(chars, { opacity: 0, x: (i) => (i - (chars.length - 1) / 2) * -14, duration: 1.6, stagger: .03 }, 1.1)
    .from(q('.ha-foot p'), { opacity: 0, y: 16, duration: 1.4, stagger: .12 }, 1.6);

  // Drift: shift every card's --u along a wrapping track.
  const state = { offset: 0, boost: 0 };
  const place = () => cards.forEach((c, i) => {
    const raw = (i - (n - 1) / 2) * step + state.offset;
    const u = ((((raw + span / 2) % span) + span) % span) - span / 2;
    c.style.setProperty('--u', u.toFixed(4));
  });
  let active = true;
  gsap.ticker.add((_t, dt) => {
    if (!active) return;
    const paused = root.hasAttribute('data-paused');
    state.offset -= ((paused ? 0 : DRIFT) + state.boost) * dt / 1000;
    state.boost *= .93;
    place();
  });

  let lastX = 0, lastT = 0, dragging = false;
  arc.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastT = e.timeStamp; arc.setPointerCapture(e.pointerId); });
  arc.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const du = (e.clientX - lastX) / (window.innerWidth / 2);
    state.offset += du;
    state.boost = gsap.utils.clamp(-1.5, 1.5, (-du * 1000) / Math.max(e.timeStamp - lastT, 1));
    lastX = e.clientX; lastT = e.timeStamp;
  });
  const release = () => { dragging = false; };
  arc.addEventListener('pointerup', release);
  arc.addEventListener('pointercancel', release);

  gsap.timeline({
    scrollTrigger: {
      trigger: root, start: 'top top', end: 'bottom top', scrub: true,
      onLeave: () => { active = false; }, onEnterBack: () => { active = true; },
    },
  })
    .to(arc, { yPercent: -18, ease: 'none' }, 0)
    .to(q('.ha-copy, .ha-foot'), { opacity: 0, y: -40, ease: 'none', duration: .6 }, 0);
}
