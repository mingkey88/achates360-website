import { gsap, SplitText } from './index';

/** Section headings rise letter by letter; blocks fade up, as each enters the screen. */
export function reveal(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-split]')) {
    if (el.closest('[data-hero]')) continue;
    const split = SplitText.create(el, { type: 'words,chars', mask: 'words' });
    gsap.from(split.chars, {
      yPercent: 110, duration: .8, ease: 'expo.out', stagger: .018,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    gsap.from(el, { y: 40, opacity: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  }
}
