/**
 * Breaks a heading into lines for a die-cut cover: words are joined greedily up to `max` characters a
 * line, and a lone "&" stays at the end of the line before it ("PACKAGING &" / "MERCHANDISE"). A word
 * longer than `max` gets a line to itself.
 */
export function cutLines(text: string, max: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (cur !== undefined && (w === '&' || `${cur} ${w}`.length <= max)) lines[lines.length - 1] = `${cur} ${w}`;
    else lines.push(w);
  }
  return lines;
}

/** The type size that sets the longest line across `width` units (capped at `cap`); `em` is the
 * average capital's width in ems for the cut's typeface and weight. */
export function cutSize(lines: string[], width: number, cap: number, em = .6): number {
  const longest = Math.max(1, ...lines.map((l) => l.length));
  return Math.min(cap, Math.floor(width / (longest * em)));
}
