import { gsap, ScrollTrigger } from './index';
import { playingCards } from '../../lib/stack-state';

const PEEK = 18;   // px each waiting card shows below the one in front of it
const SHRINK = .05; // scale lost per place back in the queue
const VISIBLE = 3;  // waiting cards that peek out; the rest wait hidden behind them

/**
 * Featured cards as one pinned deck (spec §4.1, after ariyana-studio): the waiting cards peek out
 * below the front one in brand colours. Scrolling tilts the front card back and lifts it off the top
 * while the rest move up a place. Its video keeps playing until it has fully left the screen.
 */
export function stack(): void {
  const list = document.querySelector<HTMLElement>('[data-stack]');
  const cards = list ? gsap.utils.toArray<HTMLElement>(list.children) : [];
  const n = cards.length;
  if (!list || n < 2) return;
  list.classList.add('is-stacked');

  const place = (d: number) => ({ y: Math.min(d, VISIBLE) * PEEK, scale: 1 - Math.min(d, VISIBLE) * SHRINK });
  const tones = cards.map((c) => c.querySelector('.sc-tone'));
  cards.forEach((c, i) => gsap.set(c, { zIndex: n - i, transformOrigin: '50% 100%', ...place(i) }));
  tones.forEach((t, i) => t && gsap.set(t, { opacity: i ? 1 : 0 }));

  const tl = gsap.timeline({ defaults: { ease: 'none', duration: 1 } });
  for (let i = 0; i < n - 1; i++) {
    tl.to(cards[i], { yPercent: -130, rotateX: 40 }, i);
    for (let j = i + 1; j < n; j++) tl.to(cards[j], place(j - i - 1), i);
    if (tones[i + 1]) tl.to(tones[i + 1], { opacity: 0, duration: .6 }, i);
  }

  // Only the cards in play run their videos; BgVideo honours data-bgvideo-hold.
  const media = cards.map((c) => c.querySelector<HTMLElement>('[data-bgvideo-viewport]'));
  let playing = '';
  const sync = (progress: number) => {
    const on = playingCards(progress, n);
    if (on.join() === playing) return;
    playing = on.join();
    media.forEach((m, i) => m?.toggleAttribute('data-bgvideo-hold', !on.includes(i)));
    document.dispatchEvent(new Event('bgvideo:refresh'));
  };

  const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
  const st = ScrollTrigger.create({
    trigger: list, animation: tl, pin: true, scrub: .6, invalidateOnRefresh: true,
    start: () => `top top+=${headerH() + 12}`,
    end: () => `+=${(n - 1) * window.innerHeight * .8}`,
    onUpdate: (self) => sync(self.progress),
  });
  sync(st.progress);

  // Keyboard: a link in a waiting or departed card scrolls the deck to bring that card to the front.
  list.addEventListener('focusin', (e) => {
    const i = cards.findIndex((c) => c.contains(e.target as Node));
    if (i < 0) return;
    const top = st.start + (st.end - st.start) * (i / (n - 1));
    if (Math.abs(window.scrollY - top) > 2) window.scrollTo({ top, behavior: 'instant' });
  });
}
