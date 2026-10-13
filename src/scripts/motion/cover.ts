import { gsap } from './index';

/**
 * The projects cover (ProjectsCover.astro): while the page scrolls through the cover's extra room the
 * sheet stays pinned (CSS sticky) and slides away to the left, uncovering the index beneath it. Meanwhile the pictures
 * in the die-cut change every few seconds while the cover is on screen.
 */
export function cover(): void {
  const pc = document.querySelector<HTMLElement>('[data-pcover]');
  if (!pc) return;
  const sheet = pc.querySelector<HTMLElement>('.pc-sheet')!;
  const pin = pc.querySelector<HTMLElement>('.pc-pin')!;
  // The cover is the first thing on the page and its pin sticks under the header from the first pixel
  // of scroll, so the opening runs from scroll 0 through the cover's extra room.
  const st = { start: 0, end: () => pc.offsetHeight - pin.offsetHeight, scrub: .6, invalidateOnRefresh: true };
  // What lies under the cover (the page pulls it up beneath) would peek out below the sheet's lower
  // edge at rest, so it stays clear until the cover begins to lift.
  const under = pc.nextElementSibling as HTMLElement | null;
  const tl = gsap.timeline({ scrollTrigger: st })
    .fromTo(sheet, { x: 0 }, { x: () => -(sheet.offsetLeft + sheet.offsetWidth + 40), ease: 'power2.inOut', duration: 1 }, 0);
  if (under) tl.fromTo(under, { opacity: 0 }, { opacity: 1, ease: 'none', duration: .12 }, 0);

  const imgs = [...pc.querySelectorAll<HTMLElement>('.pc-img')];
  if (imgs.length < 2) return;
  let i = 0, timer = 0;
  const next = () => {
    imgs[i].classList.remove('is-on');
    i = (i + 1) % imgs.length;
    const img = imgs[i] as HTMLImageElement;
    img.loading = 'eager';
    imgs[i].classList.add('is-on');
  };
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting) timer = window.setInterval(() => { if (!document.hidden) next(); }, 2800);
  }).observe(pin);
}
