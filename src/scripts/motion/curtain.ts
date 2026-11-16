import { gsap } from './index';

/**
 * The opening (client, 2 Nov 2026, after yaas-energy.com): the page holds the hero while the next
 * section ([data-curtain], rounded at its top) rises over it like a curtain, and the film draws in from
 * full bleed to a framed card with rounded corners as it is covered.
 * The hero also fades away over the second half of that rise (client, 11 Nov 2026: "the behind screen
 * disappear suddenly. instead do like a gradual fade out"): the panel is shorter than the hero, so the
 * hero showed above and below it until the hold ended and it vanished at once. It is gone by the time the
 * hold ends; what follows the panel also covers it (ClientWork sits above, on the paper).
 */
export function curtain(): void {
  const hero = document.querySelector<HTMLElement>('.vh');
  const stage = hero?.querySelector<HTMLElement>('.vh-stage');
  const next = document.querySelector<HTMLElement>('[data-curtain]');
  if (!hero || !stage || !next) return;
  const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero, start: () => `top top+=${headerH()}`, end: () => `bottom top+=${headerH()}`, pin: true, pinSpacing: false, scrub: .4, invalidateOnRefresh: true,
      // Released below its place once covered (pinSpacing false): by then it has faded out; it is also
      // taken out of the way (visibility) until scrolled back to, so nothing in it can be reached.
      onLeave: () => gsap.set(hero, { visibility: 'hidden' }), onEnterBack: () => gsap.set(hero, { visibility: 'visible' }),
    },
  });
  tl.fromTo(stage, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(5% 4% 12% 4% round 28px)', duration: 1 }, 0)
    .fromTo(hero, { opacity: 1 }, { opacity: 0, duration: .5 }, .45);
}
