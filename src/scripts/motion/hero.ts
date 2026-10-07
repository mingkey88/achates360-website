import { gsap, SplitText } from './index';

/** Homepage hero on load: the wordmark builds in, the media settles, the sticker drops. */
export function hero(): void {
  const root = document.querySelector<HTMLElement>('[data-hero]');
  if (!root) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const media = root.querySelector('.hero-media');
  if (media) tl.from(media, { opacity: 0, scale: 1.06, duration: 1.4 }, 0);
  const title = root.querySelector<HTMLElement>('[data-hero-title]');
  if (title) {
    const s = SplitText.create(title, { type: 'chars', mask: 'chars' });
    tl.from(s.chars, { yPercent: 100, duration: 1.1, stagger: .035 }, .1);
  }
  const sticker = root.querySelector('[data-hero-sticker]');
  if (sticker) tl.from(sticker, { y: -60, rotate: -25, opacity: 0, duration: .8, ease: 'back.out(2)' }, '-=.6');
}
