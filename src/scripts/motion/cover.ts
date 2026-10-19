import { gsap } from './index';

/**
 * The homepage's cover (SelectedCover.astro). (The projects pages' cover, which held the page while its
 * sheet slid away, was removed: client, 19 Oct 2026. The paper cut lives on in ui/PaperCut.astro, a
 * panel in the flow that never covers the page.)
 */
export function cover(): void {
  selectedCover();
}

/**
 * The homepage's Selected work cover (SelectedCover.astro), a die-cut press sheet:
 * when its film reaches the top of the screen the cover holds still while the sheet slides away to the
 * left, uncovering the film, then the page moves on. Without motion the sheet scrolls up off the film
 * instead (pure CSS). The header leaves the held stretch out.
 */
function selectedCover(): void {
  const cv = document.querySelector<HTMLElement>('[data-scover]');
  const sheet = cv?.querySelector<HTMLElement>('.cover-paper');
  if (!cv || !sheet) return;
  cv.classList.add('is-slide');
  const root = document.documentElement;
  gsap.timeline({
    scrollTrigger: {
      trigger: cv, start: 'top top', end: () => `+=${Math.round(innerHeight * .8)}`, pin: true, scrub: .6, invalidateOnRefresh: true,
      onRefresh: (st) => { root.dataset.scrollHold = `${Math.round(st.start)}:${Math.round(st.end)}`; },
    },
  }).fromTo(sheet, { x: 0 }, { x: () => -(sheet.offsetWidth + 60), ease: 'power2.inOut' });
}
