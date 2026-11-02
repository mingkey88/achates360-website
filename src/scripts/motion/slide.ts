import { gsap } from './index';

/**
 * Cards that slide sideways while the page holds (client, 2 Nov 2026, after yaas-energy.com): the
 * [data-slide] section is pinned and its [data-slide-track] travels its full overflow. Wide screens only;
 * phones keep the grid.
 */
export function slide(): void {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const sec = document.querySelector<HTMLElement>('[data-slide]');
    const track = sec?.querySelector<HTMLElement>('[data-slide-track]');
    if (!sec || !track) return;
    const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const travel = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    gsap.to(track, {
      x: () => -travel(), ease: 'none',
      scrollTrigger: { trigger: sec, start: () => `top top+=${headerH()}`, end: () => `+=${travel()}`, pin: true, scrub: .6, invalidateOnRefresh: true },
    });
  });
}
