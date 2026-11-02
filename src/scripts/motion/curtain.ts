import { gsap } from './index';

/**
 * The opening (client, 2 Nov 2026, after yaas-energy.com): the page holds the hero while the next
 * section ([data-curtain], rounded at its top) rises over it like a curtain, and the film draws in from
 * full bleed to a framed card with rounded corners as it is covered.
 */
export function curtain(): void {
  const hero = document.querySelector<HTMLElement>('.vh');
  const stage = hero?.querySelector<HTMLElement>('.vh-stage');
  const next = document.querySelector<HTMLElement>('[data-curtain]');
  if (!hero || !stage || !next) return;
  const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
  gsap.fromTo(stage, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, {
    clipPath: 'inset(5% 4% 12% 4% round 28px)', ease: 'none',
    scrollTrigger: { trigger: hero, start: () => `top top+=${headerH()}`, end: () => `bottom top+=${headerH()}`, pin: true, pinSpacing: false, scrub: .4, invalidateOnRefresh: true,
      // Released below its place once covered (pinSpacing false), so it hides until scrolled back to.
      onLeave: () => gsap.set(hero, { autoAlpha: 0 }), onEnterBack: () => gsap.set(hero, { autoAlpha: 1 }),
    },
  });
}
