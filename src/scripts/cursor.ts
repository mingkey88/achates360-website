/**
 * A round label that stands in for the pointer over linked work (client, 26 Oct 2026: "more interesting
 * animation"; it was a small arrow disc): over any [data-cursor] element it grows from nothing, reads that
 * element's label ("View") with an arrow, and eases after the pointer. Mouse-like pointers only, never
 * under reduced motion; the browser's own pointer is hidden there so only one shows. Decorative
 * (aria-hidden): the links keep their own names. Safe to call more than once per page.
 */
export function viewCursor(): void {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll<HTMLElement>('[data-cursor]:not([data-cursor-bound])');
  if (!targets.length || !fine || reduce) return;
  let dot = document.querySelector<HTMLElement>('.view-cursor');
  if (!dot) {
    dot = document.createElement('div');
    dot.className = 'view-cursor';
    dot.setAttribute('aria-hidden', 'true');
    dot.innerHTML = '<span class="vc-label"></span><svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8" /></svg>';
    document.body.append(dot);
    document.documentElement.classList.add('has-view-cursor');
  }
  const el = dot;
  const label = el.querySelector<HTMLElement>('.vc-label')!;
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, idle = 0;
  const tick = () => {
    x += (tx - x) * .35; y += (ty - y) * .35;
    el.style.translate = `${x}px ${y}px`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > .3 ? requestAnimationFrame(tick) : 0;
  };
  const follow = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(tick); };
  for (const t of targets) {
    t.dataset.cursorBound = '';
    t.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(idle);
      label.textContent = t.dataset.cursor ?? '';
      if (!el.classList.contains('is-on')) { x = tx = e.clientX; y = ty = e.clientY; el.style.translate = `${x}px ${y}px`; }
      el.classList.add('is-on');
    });
    t.addEventListener('pointermove', follow);
    t.addEventListener('pointerleave', () => { idle = window.setTimeout(() => el.classList.remove('is-on'), 40); });
  }
}
