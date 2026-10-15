import { gsap, ScrollTrigger } from './index';

/**
 * The projects cover (ProjectsCover.astro): a die-cut sheet lying over the top of the page. The page
 * holds still (pinned) for a while as scrolling starts, and the sheet slides away to the left over it,
 * so what shows through the cut stays in place. During the hold:
 * - the page carries its own copy of the paper and grid (the body's would scroll behind it), offset so
 *   its lines continue the body's exactly once the page moves on (--grid-y);
 * - the header ignores the held scroll (html[data-scroll-hold], read by Header.astro), so it neither
 *   condenses nor hides until the cover has cleared.
 * Triggers inside the pinned page allow for the pin through [data-pin-container] (motion/reveal.ts).
 */
export function cover(): void {
  selectedCover();
  const pc = document.querySelector<HTMLElement>('[data-pcover]');
  const page = pc?.closest<HTMLElement>('[data-pin-container]');
  if (!pc || !page) return;
  const sheet = pc.querySelector<HTMLElement>('.pc-sheet')!;
  const hold = () => Math.round(innerHeight * Number(pc.dataset.hold || .7));
  const root = document.documentElement;
  const sync = (st: ScrollTrigger) => {
    const d = st.end - st.start;
    root.dataset.scrollHold = `${st.start}:${st.end}`;
    // Where the page sits in the document once the hold is over: its spacer's top plus the hold.
    const top = (page.parentElement?.getBoundingClientRect().top ?? 0) + scrollY;
    page.style.setProperty('--grid-y', `${-(top + d)}px`);
  };
  // The cover is the first thing on the page, so the hold runs from scroll 0 (data-hold screens long).
  gsap.timeline({ scrollTrigger: { trigger: page, start: 0, end: () => `+=${hold()}`, pin: true, scrub: .6, invalidateOnRefresh: true, onRefresh: sync } })
    .fromTo(sheet, { x: 0 }, { x: () => -(sheet.offsetLeft + sheet.offsetWidth + 40), ease: 'power2.inOut' });
  page.classList.add('is-held');
}

/**
 * The homepage's Selected work cover (SelectedCover.astro), the same press sheet as the projects cover:
 * when its film reaches the top of the screen the cover holds still while the sheet slides away to the
 * left, uncovering the film, then the page moves on. Without motion the sheet scrolls up off the film
 * instead (pure CSS). The header leaves the held stretch out, as on /projects.
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
