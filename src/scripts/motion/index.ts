import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
export { gsap, ScrollTrigger, SplitText };

/**
 * Start a page's motion modules (spec §5). Under reduced motion none run and content simply shows.
 * A failing module is logged and skipped so the rest of the page still animates and reveals.
 * motion-ready goes on BEFORE the modules run: it lifts the CSS that hides [data-split]/[data-reveal],
 * and gsap.from() reads an element's current opacity as its end value, so it must not read the hidden 0.
 * Each from() applies its start state synchronously, so nothing flashes.
 */
export function run(...mods: Array<() => void>): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  // Already ready means the 3s fallback fired before the bundle arrived: content is visible, so don't re-hide it.
  const late = root.classList.contains('motion-ready');
  root.classList.add('motion-ready');
  if (reduced || late) return;
  for (const m of mods) {
    try { m(); } catch (e) { console.error('[motion]', e); }
  }
  ScrollTrigger.sort(); // creation order != page order once something pins
  // Trigger positions are measured now; fonts and media settling afterwards would leave them stale.
  const refresh = () => ScrollTrigger.refresh();
  if (document.readyState === 'complete') refresh();
  else window.addEventListener('load', refresh, { once: true });
  void document.fonts?.ready.then(refresh);
}
