import { describe, it, expect } from 'vitest';
import { shouldPlay } from './video-policy';

const base = { onScreen: true, reduced: false, userPaused: false, allowedHere: true };

describe('shouldPlay', () => {
  it('plays an on-screen video when nothing forbids it', () => expect(shouldPlay(base)).toBe(true));
  it('never plays off screen', () => expect(shouldPlay({ ...base, onScreen: false })).toBe(false));
  it('never autoplays under reduced motion', () => expect(shouldPlay({ ...base, reduced: true })).toBe(false));
  it('stays paused after the visitor paused it, even when it scrolls back on screen', () => {
    expect(shouldPlay({ ...base, userPaused: true })).toBe(false);
  });
  it('does not play where the layout does not load it (desktop-only video on a phone)', () => {
    expect(shouldPlay({ ...base, allowedHere: false })).toBe(false);
  });
});
