/**
 * The address of a Vimeo or YouTube player. With autoplay the film starts muted (browsers only allow
 * silent autoplay) and loops, so it never reaches the end screen ("More from Achates 360" on Vimeo,
 * suggested videos on YouTube). Without autoplay (reduced motion) it waits for the play button, and
 * YouTube keeps its end suggestions to the same channel (rel=0).
 */
export function embedSrc(provider: 'vimeo' | 'youtube', id: string, autoplay: boolean): string {
  if (provider === 'youtube') {
    const q = new URLSearchParams({ rel: '0', playsinline: '1' });
    if (autoplay) { q.set('autoplay', '1'); q.set('mute', '1'); q.set('loop', '1'); q.set('playlist', id); }
    return `https://www.youtube-nocookie.com/embed/${id}?${q}`;
  }
  const q = new URLSearchParams({ title: '0', byline: '0', portrait: '0', autopause: '0', dnt: '1' });
  if (autoplay) { q.set('autoplay', '1'); q.set('muted', '1'); q.set('loop', '1'); }
  return `https://player.vimeo.com/video/${id}?${q}`;
}
