import { gsap, ScrollTrigger } from './index';

/**
 * Cards that slide sideways while the page holds (client, 2 Nov 2026, after yaas-energy.com): the
 * [data-slide] section is pinned and its [data-slide-track] travels its full overflow. Wide screens only;
 * phones keep the grid.
 *
 * Each card's pictures step on with the scroll (10 Nov 2026): a card holds a few shots of its service's
 * projects ([data-slide-shots] > .sv-shot, the first "on" at rest) and shows the next as the visitor
 * scrolls, the cards changing in turn rather than together. On wide screens the step follows the slide's
 * own travel; on phones, each card's passage up the screen. Driven by the scroll, never by a timer.
 */
export function slide(): void {
  const sec = document.querySelector<HTMLElement>('[data-slide]');
  const track = sec?.querySelector<HTMLElement>('[data-slide-track]');
  if (!sec || !track) return;
  const sets = gsap.utils.toArray<HTMLElement>(track.querySelectorAll('[data-slide-shots]')).map((el) => [...el.querySelectorAll<HTMLElement>('.sv-shot')]);
  const show = (shots: HTMLElement[], n: number) => shots.forEach((s, i) => s.classList.toggle('on', i === n));
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const travel = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    gsap.to(track, {
      x: () => -travel(), ease: 'none',
      scrollTrigger: {
        trigger: sec, start: () => `top top+=${headerH()}`, end: () => `+=${travel()}`, pin: true, scrub: .6, invalidateOnRefresh: true,
        // Every card runs through its shots once over the slide, each a beat after the card before it.
        onUpdate: (st) => sets.forEach((shots, i) => show(shots, Math.min(shots.length - 1, Math.floor(Math.max(0, st.progress * 1.3 - i * .1) * shots.length)))),
      },
    });
    return () => sets.forEach((shots) => show(shots, 0));
  });
  mm.add('(max-width: 767px)', () => {
    // While the card's picture crosses the middle of the screen, where it is seen whole.
    for (const shots of sets) {
      if (shots.length < 2) continue;
      ScrollTrigger.create({
        trigger: shots[0].parentElement!, start: 'top 60%', end: 'top 10%',
        onUpdate: (st) => show(shots, Math.min(shots.length - 1, Math.floor(st.progress * shots.length))),
      });
    }
    return () => sets.forEach((shots) => show(shots, 0));
  });
}
