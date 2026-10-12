/**
 * The homepage closing section's pictures can be picked up and moved with a mouse or pen, and a plain
 * click opens the project (each picture is a link). A press only becomes a drag once the pointer has
 * travelled DRAG_START px, so a slightly shaky click still opens the project; after a drag the click
 * that follows is swallowed. Touch is left alone: on phones a swipe must scroll the page and a tap
 * opens the project. The offset is written as --dx/--dy, added to the picture's left/top: GSAP folds a
 * CSS `translate` into its own transform for the scroll scatter, so the two must stay on separate properties.
 */
export const DRAG_START = 6;

/** Clamp a picture's drag offset so its centre stays on the stage (a picture dragged off would be lost). */
export function clampOffset(want: number, base: number, centre: number, min: number, max: number): number {
  // centre is the picture's current centre with offset `base` applied; moving to `want` shifts it by want - base.
  const lo = base + (min - centre), hi = base + (max - centre);
  return Math.min(hi, Math.max(lo, want));
}

export function pile(): void {
  const stage = document.querySelector<HTMLElement>('[data-scatter] .scta-stage');
  if (!stage) return;
  let top = 100; // the picked-up picture comes to the front, above the rest of the pile
  for (const link of stage.querySelectorAll<HTMLElement>('.pic-link')) {
    const pic = link.closest<HTMLElement>('.pic')!;
    let id: number | null = null, sx = 0, sy = 0, bx = 0, by = 0, dx = 0, dy = 0, moved = false;
    let box = { cx: 0, cy: 0, s: new DOMRect() };
    link.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY; bx = dx; by = dy; moved = false;
      const r = pic.getBoundingClientRect();
      box = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, s: stage.getBoundingClientRect() };
    });
    link.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const mx = e.clientX - sx, my = e.clientY - sy;
      if (!moved) {
        if (Math.hypot(mx, my) < DRAG_START) return;
        moved = true;
        link.setPointerCapture(e.pointerId); // keep the picture under the pointer even when it moves fast
        pic.classList.add('is-dragging');
        pic.style.zIndex = String(++top);
      }
      dx = clampOffset(bx + mx, bx, box.cx, box.s.left, box.s.right);
      dy = clampOffset(by + my, by, box.cy, box.s.top, box.s.bottom);
      pic.style.setProperty('--dx', `${dx}px`);
      pic.style.setProperty('--dy', `${dy}px`);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = null;
      pic.classList.remove('is-dragging');
    };
    link.addEventListener('pointerup', end);
    link.addEventListener('pointercancel', end);
    // A drag ends in a click on the link; that one must not open the project.
    link.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } });
    link.addEventListener('dragstart', (e) => e.preventDefault()); // no native link/image drag ghost
  }
}
