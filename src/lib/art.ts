/**
 * Art direction for a case study (src/content/art/<slug>.yaml): a layout that sets the page's own
 * paragraphs and pictures in a chosen order and arrangement. It only arranges: every paragraph and
 * every picture of the page is used exactly once, words and files untouched (checkArt enforces it).
 *
 * Paragraphs are the page's text blocks split at blank lines, numbered from 0 in page order. Media
 * are the page's pictures and films in page order: image blocks, gallery items, video blocks.
 */

export type ArtLayout = 'full' | 'pair' | 'trio' | 'grid4' | 'beside' | 'beside-left';
export interface ArtSection { text?: number[]; media?: number[]; layout?: ArtLayout }
export interface Art { sections: ArtSection[] }

export interface Media { kind: 'image' | 'video'; src: any; alt: string; poster?: any; href?: string; controls?: boolean }

export function paragraphs(blocks: any[]): string[] {
  return blocks
    .filter((b) => b.type === 'text')
    .flatMap((b) => String(b.md).split(/\n\s*\n/))
    .map((p) => p.trim())
    .filter(Boolean);
}

export function media(blocks: any[]): Media[] {
  const out: Media[] = [];
  for (const b of blocks) {
    if (b.type === 'image') out.push({ kind: 'image', src: b.src, alt: b.alt ?? '', href: b.href });
    else if (b.type === 'gallery') for (const it of b.items) out.push({ kind: 'image', src: it.thumb, alt: it.alt ?? '', href: it.href });
    else if (b.type === 'video') out.push({ kind: 'video', src: b.src, alt: '', poster: b.poster, controls: b.controls });
  }
  return out;
}

/** A paragraph that is only bold words ("**Refining the Guest Experience**") reads as a subheading. */
export function subheading(p: string): string | null {
  const m = p.match(/^\*\*([^*]+)\*\*$/);
  return m ? m[1].trim() : null;
}

/** Problems with a layout, as sentences; empty when every paragraph and picture is used exactly once. */
export function checkArt(art: Art, paraCount: number, mediaCount: number): string[] {
  const problems: string[] = [];
  const tally = (key: 'text' | 'media', count: number, noun: string) => {
    const seen = new Map<number, number>();
    for (const s of art.sections) for (const i of s[key] ?? []) seen.set(i, (seen.get(i) ?? 0) + 1);
    for (const [i, n] of seen) {
      if (i < 0 || i >= count) problems.push(`${noun} ${i} does not exist (the page has ${count})`);
      else if (n > 1) problems.push(`${noun} ${i} is used ${n} times`);
    }
    for (let i = 0; i < count; i++) if (!seen.has(i)) problems.push(`${noun} ${i} is not used`);
  };
  tally('text', paraCount, 'paragraph');
  tally('media', mediaCount, 'picture');
  art.sections.forEach((s, i) => {
    if (!s.text?.length && !s.media?.length) problems.push(`section ${i} is empty`);
    if ((s.layout === 'beside' || s.layout === 'beside-left') && (!s.text?.length || !s.media?.length)) problems.push(`section ${i}: "${s.layout}" needs both text and media`);
  });
  return problems;
}
