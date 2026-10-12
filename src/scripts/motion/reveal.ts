import { gsap, SplitText } from './index';

/**
 * Editorial reveals as each element enters the screen: headings rise line by line out of a mask,
 * images marked [data-wipe] are unveiled bottom to top while they settle from a slight zoom, and other
 * blocks fade up.
 */
export function reveal(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-split]')) {
    if (el.closest('[data-hero]')) continue;
    // SplitText adds aria-label and hides the parts: only safe on real headings, never on a span in a link.
    if (!/^H[1-6]$/.test(el.tagName)) {
      gsap.from(el, { y: 40, opacity: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
      continue;
    }
    // Lines are measured after the web fonts load and re-split on resize (autoSplit), so the break points
    // match what the visitor sees; returning the tween lets SplitText rebuild it on each re-split.
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .09,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }),
    });
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-wipe]')) {
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' });
    // clearProps hands the image back to its CSS hover zoom once the reveal is done.
    if (img) tl.from(img, { scale: 1.2, duration: 2, ease: 'expo.out', clearProps: 'transform' }, .1);
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    if (el.querySelector('[data-wipe]')) continue; // its image has its own reveal
    gsap.from(el, { y: 40, opacity: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  }
}
