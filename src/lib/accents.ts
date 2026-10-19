/**
 * Two-tone headings (direction B, after nationalgallery.sg): one phrase of a heading set in the brand's
 * orange, the rest in ink. The words are the supplied (or Draft) copy, unchanged: this only says which
 * of them take the colour. Keyed by the strings.yaml id; ui/T.astro applies it wherever that string
 * shows. A phrase that stops matching its heading fails the build (accents.test.ts), so a copy change
 * never silently loses its accent.
 */
export const ACCENTS: Record<string, string> = {
  'contact-heading': 'us',          // Write to us.
  'process-heading': 'work',        // How we work
  'timeline-heading': 'story',      // Our story
  'awards-chapter': 'hand in hand', // Leaving a mark, hand in hand
  'notfound-title': 'not found',    // Page not found
};

/** The About text's accent phrases (basic/about.md, verbatim), one per chapter. */
export const ABOUT_ACCENTS = {
  statement: 'creative, thoughtful and impactful solutions',
  companion: 'faithful companion and trusted friend',
  visual: 'thinking made visual',
} as const;

/** The footer's intro line (site.md, verbatim) and its accent phrase. */
export const FOOTER_ACCENT = 'intelligent creative solutions';

/**
 * Splits text at the first whole-word occurrence of phrase: [before, phrase, after]. Null when the
 * phrase is empty or not in the text as whole words.
 */
export function splitAccent(text: string, phrase: string | undefined): [string, string, string] | null {
  if (!phrase) return null;
  const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(^|[^\\p{L}\\p{N}])(${esc})(?=$|[^\\p{L}\\p{N}])`, 'u').exec(text);
  if (!m) return null;
  const at = m.index + m[1].length;
  return [text.slice(0, at), phrase, text.slice(at + phrase.length)];
}
