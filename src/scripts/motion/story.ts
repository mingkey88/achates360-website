import { gsap, ScrollTrigger } from './index';

/**
 * /about told as a story (About.astro, Chronology.astro). Three movements, all driven by scroll:
 * - the chronology (wide screens): the section holds still for a stretch while its milestones turn, one
 *   per slice of the scroll: the year rolls over, the plate and line change, the ruler of years fills;
 * - the name: the logo's five figures drift in from apart, turning, and join hands as the chapter
 *   comes into view;
 * - thinking made visual: the sentence, set in pencil outline, inks in word by word.
 * Without motion every chapter is simply there, finished (the CSS defaults).
 */
export function story(): void {
  chronology();
  gather();
  ink();
}

function chronology(): void {
  const root = document.querySelector<HTMLElement>('[data-chron]');
  if (!root) return;
  const items = [...root.querySelectorAll<HTMLElement>('.chron-item')];
  const ticks = [...root.querySelectorAll<HTMLElement>('[data-tick]')];
  const n = items.length;
  if (!n) return;
  const show = (k: number) => {
    items.forEach((it, i) => { it.classList.toggle('is-on', i === k); it.classList.toggle('is-past', i < k); });
    ticks.forEach((t, i) => { t.classList.toggle('is-on', i === k); t.classList.toggle('is-done', i < k); });
  };
  gsap.matchMedia().add('(min-width: 1024px)', () => {
    root.classList.add('is-story');
    let at = -1;
    const set = (k: number) => { if (k !== at) { at = k; show(k); } };
    set(0);
    // While held, the stage carries its own copy of the page's paper and grid (the body's would scroll
    // behind it), placed so its lines continue the body's at both ends: --grid-y from where the hold
    // starts, and a hold of whole grid squares (120px), so the lines meet again where it ends.
    const sync = (st: ScrollTrigger) => {
      root.style.setProperty('--grid-y', `${-Math.round(st.start)}px`);
      root.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
    };
    gsap.timeline({
      scrollTrigger: {
        trigger: root, start: 'top top', end: () => `+=${Math.max(1, Math.round((innerHeight * .32 * n) / 120)) * 120}`, pin: true, invalidateOnRefresh: true,
        onRefresh: sync,
        onUpdate: (st) => set(Math.min(n - 1, Math.floor(st.progress * n))),
      },
    });
    return () => { root.classList.remove('is-story'); items.forEach((it) => it.classList.remove('is-on', 'is-past')); };
  });
}

function gather(): void {
  const root = document.querySelector<HTMLElement>('[data-gather]');
  const figs = root ? gsap.utils.toArray<SVGGElement>(root.querySelectorAll('.st-fig')) : [];
  if (!root || !figs.length) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 85%', end: 'center 55%', scrub: .6 } });
  // Each figure arrives in a corporate colour and settles to ink as they join hands (as in the hero).
  const ARRIVAL = ['#ff9015', '#99d9d9', '#cbe880', '#99d9d9', '#ff9015'];
  figs.forEach((f, i) => {
    const a = (i / figs.length) * Math.PI * 2 + .6;
    tl.from(f, { x: Math.cos(a) * 70, y: Math.sin(a) * 50, rotation: (i % 2 ? 1 : -1) * (60 + i * 20), opacity: .15, transformOrigin: '50% 50%', ease: 'power2.out' }, i * .06);
    tl.fromTo(f, { fill: ARRIVAL[i % ARRIVAL.length] }, { fill: '#333333', ease: 'power1.in', duration: .5 }, .5 + i * .06);
  });
}

function ink(): void {
  const root = document.querySelector<HTMLElement>('[data-ink]');
  const words = root ? gsap.utils.toArray<HTMLElement>(root.querySelectorAll('.w')) : [];
  if (!root || !words.length) return;
  gsap.fromTo(words, { '--k': 0 }, { '--k': 1, ease: 'none', stagger: .08, scrollTrigger: { trigger: root, start: 'top 75%', end: 'bottom 60%', scrub: .4 } });
}
