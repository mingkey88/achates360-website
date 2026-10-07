/**
 * Which featured cards' videos should play at a point in the pinned stack (spec §4.1).
 * progress runs 0 → 1 over n - 1 hand-overs. The front card plays until it has fully left the
 * screen; the card coming forward starts as soon as the hand-over begins.
 */
export function playingCards(progress: number, n: number): number[] {
  if (n <= 1) return [0];
  const pos = Math.min(Math.max(progress, 0), 1) * (n - 1);
  const front = Math.min(Math.floor(pos + 1e-9), n - 1);
  return pos - front > 1e-9 ? [front, front + 1] : [front];
}
