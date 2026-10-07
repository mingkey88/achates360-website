import { gsap } from './index';

/** About timeline: on desktop the section pins and its years travel sideways (spec §4.5). */
export function timeline(): void {
  const section = document.querySelector<HTMLElement>('[data-timeline]');
  const track = section?.querySelector<HTMLElement>('.tl-track');
  if (!section || !track) return;
  gsap.matchMedia().add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-pinned');
    // A pinned, transformed track is not a scroll container: take it out of the tab order meanwhile.
    const tab = track.getAttribute('tabindex');
    track.removeAttribute('tabindex');
    const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
    gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true },
    });
    return () => {
      section.classList.remove('is-pinned');
      if (tab !== null) track.setAttribute('tabindex', tab);
    };
  });
}
