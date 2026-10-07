import { describe, it, expect } from 'vitest';
import { playingCards } from './stack-state';

// progress runs 0 → 1 across the pinned stack; with n cards there are n - 1 hand-overs.
describe('playingCards', () => {
  it('plays only the front card before any scrolling', () => {
    expect(playingCards(0, 6)).toEqual([0]);
  });
  it('keeps the leaving card playing while the next one comes forward', () => {
    expect(playingCards(0.1, 6)).toEqual([0, 1]); // card 0 halfway out
    expect(playingCards(0.199, 6)).toEqual([0, 1]); // card 0 almost gone
  });
  it('drops a card only once it has fully left', () => {
    expect(playingCards(0.2, 6)).toEqual([1]);
    expect(playingCards(0.3, 6)).toEqual([1, 2]);
  });
  it('plays only the last card at the end', () => {
    expect(playingCards(1, 6)).toEqual([5]);
  });
  it('clamps progress outside 0..1', () => {
    expect(playingCards(-0.5, 3)).toEqual([0]);
    expect(playingCards(1.5, 3)).toEqual([2]);
  });
  it('handles a single card', () => {
    expect(playingCards(0.5, 1)).toEqual([0]);
  });
});
