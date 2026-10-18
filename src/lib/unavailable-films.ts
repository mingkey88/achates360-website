/**
 * Embedded films the provider no longer serves (checked 18 Oct 2026 with `npm run check:films`): YouTube
 * answers "Video unavailable" (removed) or refuses to embed them (private). Their players are left out of
 * the case study, so the page shows its picture and words rather than a grey error box; the page stays.
 * Remove an entry once the studio supplies a working link or the file (CONTENT-QUERIES 59).
 */
export const UNAVAILABLE_FILMS = new Set([
  'youtube:CBQJAf5utqM', // /dbs-cio-animated-videos: removed
  'youtube:6uyUFAdmkYY', // /dbs-cio-podcasts: removed
  'youtube:qkasTH721NI', // /dbs-sustainable-investing-video: private
]);

export const isUnavailableFilm = (b: { type: string; provider?: string; id?: string }): boolean =>
  b.type === 'embed' && UNAVAILABLE_FILMS.has(`${b.provider}:${b.id}`);
