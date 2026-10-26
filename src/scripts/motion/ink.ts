import { gsap, SplitText } from './index';

/**
 * A sentence that inks in as you read it (client, 26 Oct 2026: "more interesting animation"): its words
 * start pale and darken one by one with the scroll, the accent phrase (.hl) last, so the line that says
 * who the studio is gets read. Scrubbed: scrolling back pales them again. [data-ink] on a heading.
 */
export function ink(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-ink]')) {
    // Words are measured after the web fonts load and re-split on resize; the tween is rebuilt each time.
    SplitText.create(el, {
      type: 'words', autoSplit: true,
      onSplit: (self) => {
        const words = self.words as HTMLElement[];
        const plain = words.filter((w) => !w.closest('.hl'));
        const accent = words.filter((w) => w.closest('.hl'));
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 40%', scrub: .5 } });
        tl.fromTo(plain, { opacity: .16 }, { opacity: 1, stagger: .1, ease: 'none' })
          .fromTo(accent, { opacity: .16 }, { opacity: 1, stagger: .12, ease: 'none' }, '>-.2');
        return tl;
      },
    });
  }
}
