/**
 * Whether a background or looping video should be playing (spec §5, Review Focus 5). A visitor's
 * pause wins over everything; reduced motion never autoplays.
 */
export function shouldPlay(s: { onScreen: boolean; reduced: boolean; userPaused: boolean; allowedHere: boolean }): boolean {
  return s.onScreen && s.allowedHere && !s.reduced && !s.userPaused;
}
