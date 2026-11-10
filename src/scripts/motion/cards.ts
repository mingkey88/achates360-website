import { gsap } from './index';

/**
 * The work as a stack of full-screen cards (client, 2 Nov 2026, after yaas-energy.com): the page holds
 * the [data-workstack-stage] while each card slides up over the one before, which recedes (shrinks, rounds
 * its corners, dims under a veil); the incoming picture settles from a slight push-in. Only the card in front plays
 * its film (the others are held, BgVideo's data-bgvideo-hold). What is held is the stage's
 * [data-workstack-pin] wrapper where there is one: the stage with the button beneath it, which on phones
 * (cards shorter than the screen) stays in view under the cards.
 */
export function cards(): void {
  const stage = document.querySelector<HTMLElement>('[data-workstack-stage]');
  const items = stage ? gsap.utils.toArray<HTMLElement>(stage.querySelectorAll('.ws-card')) : [];
  if (!stage || items.length < 2) return;
  const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
  const media = items.map((c) => c.querySelector<HTMLElement>('.ws-media')!);
  let front = -1;
  const setFront = (n: number) => {
    if (n === front) return;
    front = n;
    media.forEach((m, i) => (i === n ? m.removeAttribute('data-bgvideo-hold') : m.setAttribute('data-bgvideo-hold', '')));
    document.dispatchEvent(new Event('bgvideo:refresh'));
  };
  setFront(0);
  gsap.set(items.slice(1), { yPercent: 100 });
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage, start: () => `top top+=${headerH()}`, end: () => `+=${(items.length - 1) * window.innerHeight * .9}`,
      pin: stage.closest<HTMLElement>('[data-workstack-pin]') ?? true, scrub: .6, invalidateOnRefresh: true,
      onUpdate: (st) => setFront(Math.min(items.length - 1, Math.floor(st.progress * (items.length - 1) + .5))),
    },
  });
  items.forEach((card, i) => {
    if (!i) return;
    const at = i - 1;
    tl.to(card, { yPercent: 0, duration: 1 }, at)
      .fromTo(media[i], { scale: 1.14 }, { scale: 1, duration: 1 }, at)
      .to(items[i - 1], { scale: .9, borderRadius: 28, duration: 1 }, at)
      // A veil, not a CSS filter: a filter cannot be eased from none, so the card went black at once.
      .fromTo(items[i - 1].querySelector('.ws-dim'), { opacity: 0 }, { opacity: .5, duration: 1 }, at);
  });
}
