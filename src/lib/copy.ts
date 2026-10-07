// Pulling existing copy out of exported markdown without changing a word.

/** The first sentence of the paragraph that starts with `prefix`, verbatim. */
export function sentenceStarting(md: string, prefix: string): string | null {
  for (const para of md.split(/\n\s*\n/)) {
    const t = para.replace(/\s*\n\s*/g, ' ').trim();
    if (!t.startsWith(prefix)) continue;
    return t.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? t;
  }
  return null;
}

/** A Join us role block: its first heading (markers stripped) and the markdown after it. */
export function splitRoleHeading(md: string): { title: string; rest: string } | null {
  const m = md.match(/^[ \t]*#{1,6}[ \t]+(.+?)[ \t]*$/m);
  if (!m || m.index === undefined) return null;
  const title = m[1].replace(/\*\*|__/g, '').trim();
  const rest = md.slice(m.index + m[0].length).replace(/^\s*\n/, '');
  return { title, rest };
}

/** "Project Categories | Achates 360" → "Project Categories". */
export function titleFromSeo(t: string): string {
  return t.split(' | ')[0].trim();
}
